"use client";

import { ArrowLeft, CircleAlert, LoaderCircle, RefreshCw, Send } from "lucide-react";
import Link from "next/link";
import { Fragment, useCallback, useEffect, useRef, useState } from "react";

import { EmptyState } from "@/components/empty-state";
import { InlineError } from "@/components/inline-error";
import { PageSkeleton } from "@/components/loading-skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { api, ApiClientError } from "@/lib/api/client";
import type {
  ChatMessage,
  ChatMessageList,
  ChatSessionSummary,
  ChatTurn,
} from "@/lib/api/types";
import { useApiResource } from "@/lib/api/use-api-resource";
import { accentForGuide, type GuideAccent } from "@/lib/guides";
import { cn } from "@/lib/utils";

type ChatPageData = {
  history: ChatMessageList;
  session: ChatSessionSummary;
};

const guideMessageClasses: Record<GuideAccent, string> = {
  buddha: "border-guide-buddha/35 bg-guide-buddha/8",
  camus: "border-guide-camus/35 bg-guide-camus/8",
  gita: "border-guide-gita/35 bg-guide-gita/8",
  marcus: "border-guide-marcus/35 bg-guide-marcus/8",
  rumi: "border-guide-rumi/35 bg-guide-rumi/8",
};

const RESPONSE_POLL_INTERVAL_MS = 2_000;
const RESPONSE_POLL_ATTEMPTS = 15;

function mergeTurn(messages: ChatMessage[], turn: ChatTurn): ChatMessage[] {
  const withoutOptimistic = messages.filter(
    (message) => message.client_action_id !== turn.user_message.client_action_id,
  );
  const next = [...withoutOptimistic, turn.user_message];
  if (turn.guide_message && !next.some((message) => message.id === turn.guide_message?.id)) {
    next.push(turn.guide_message);
  }
  return next.sort((left, right) => left.created_at.localeCompare(right.created_at));
}

function mergeHistory(messages: ChatMessage[], stored: ChatMessage[]): ChatMessage[] {
  const storedActions = new Set(
    stored.flatMap((message) =>
      message.client_action_id ? [message.client_action_id] : [],
    ),
  );
  const unsavedOptimistic = messages.filter(
    (message) =>
      message.id.startsWith("pending-") &&
      (!message.client_action_id || !storedActions.has(message.client_action_id)),
  );
  return [...stored, ...unsavedOptimistic].sort((left, right) =>
    left.created_at.localeCompare(right.created_at),
  );
}

export function ChatExperience({ sessionId }: { sessionId: string }) {
  const load = useCallback(
    async (signal: AbortSignal): Promise<ChatPageData> => {
      const [session, history] = await Promise.all([
        api.chat.getSession(sessionId, signal),
        api.chat.listMessages(sessionId, 30, signal),
      ]);
      return { history, session };
    },
    [sessionId],
  );
  const resource = useApiResource(load);

  if (resource.status === "loading") return <PageSkeleton cards={1} />;
  if (resource.status === "error") {
    if (resource.error.status === 404) {
      return (
        <EmptyState
          action={{ href: "/chat", label: "Open conversation history" }}
          description="This conversation is unavailable or does not belong to the current account."
          title="Conversation not found"
        />
      );
    }
    return <InlineError description={resource.error.message} onRetry={resource.retry} />;
  }

  return (
    <Conversation
      initialMessages={resource.data.history.messages}
      session={resource.data.session}
      sessionId={sessionId}
    />
  );
}

function Conversation({
  initialMessages,
  session,
  sessionId,
}: {
  initialMessages: ChatMessage[];
  session: ChatSessionSummary;
  sessionId: string;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [pollingTimedOut, setPollingTimedOut] = useState(false);
  const threadEnd = useRef<HTMLDivElement>(null);
  const isCompanion = session.mode === "companion";
  const speakerName = isCompanion ? "Sthira" : (session.guide?.name ?? "Perspective");
  const messageStyle = session.guide
    ? guideMessageClasses[accentForGuide(session.guide)]
    : "border-border bg-card";

  const pendingActionIds = messages
    .filter(
      (message) =>
        message.role === "user" && message.response_status === "generating",
    )
    .map((message) => message.client_action_id ?? message.id)
    .join(":");

  useEffect(() => {
    if (!pendingActionIds || activeAction !== null) return;

    const controller = new AbortController();
    const pendingKeys = new Set(pendingActionIds.split(":"));
    let attempts = 0;
    let timer: number | undefined;

    const poll = async () => {
      attempts += 1;
      try {
        const history = await api.chat.listMessages(sessionId, 30, controller.signal);
        if (controller.signal.aborted) return;
        setMessages((current) => mergeHistory(current, history.messages));

        const storedUserKeys = new Set(
          history.messages.flatMap((message) =>
            message.role === "user"
              ? [message.client_action_id ?? message.id]
              : [],
          ),
        );
        const stillGenerating =
          history.messages.some(
          (message) =>
            message.role === "user" && message.response_status === "generating",
          ) || [...pendingKeys].some((key) => !storedUserKeys.has(key));
        if (!stillGenerating) {
          setPollingTimedOut(false);
          setSendError(null);
          return;
        }
      } catch {
        if (controller.signal.aborted) return;
      }

      if (attempts >= RESPONSE_POLL_ATTEMPTS) {
        setPollingTimedOut(true);
        return;
      }
      timer = window.setTimeout(poll, RESPONSE_POLL_INTERVAL_MS);
    };

    timer = window.setTimeout(poll, RESPONSE_POLL_INTERVAL_MS);

    return () => {
      controller.abort();
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [activeAction, pendingActionIds, sessionId]);

  useEffect(() => {
    if (typeof threadEnd.current?.scrollIntoView === "function") {
      threadEnd.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages, activeAction]);

  async function deliver(content: string, clientActionId: string) {
    setActiveAction(clientActionId);
    setSendError(null);
    setPollingTimedOut(false);
    try {
      const turn = await api.chat.submitMessage(sessionId, {
        client_action_id: clientActionId,
        content,
      });
      setMessages((current) => mergeTurn(current, turn));
    } catch (error) {
      setSendError(error instanceof ApiClientError ? error.message : "The message could not be sent.");
    } finally {
      setActiveAction(null);
    }
  }

  function submit() {
    if (activeAction || !draft.trim()) return;
    const content = draft;
    const clientActionId = crypto.randomUUID();
    const optimistic: ChatMessage = {
      client_action_id: clientActionId,
      content,
      created_at: new Date().toISOString(),
      id: `pending-${clientActionId}`,
      response_status: "generating",
      role: "user",
    };
    setMessages((current) => [...current, optimistic]);
    setDraft("");
    void deliver(content, clientActionId);
  }

  function retry(message: ChatMessage) {
    if (!message.client_action_id || activeAction) return;
    void deliver(message.content, message.client_action_id);
  }

  const waiting = messages.some(
    (message) => message.role === "user" && message.response_status === "generating",
  );
  const busy = activeAction !== null || waiting;

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
            href={isCompanion ? "/companion" : "/chat"}
          >
            <ArrowLeft className="size-4" /> {isCompanion ? "Companion" : "Conversation history"}
          </Link>
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {isCompanion ? "Open reflection" : session.guide?.tradition}
          </p>
          <h1 className="mt-1 font-serif text-3xl font-medium tracking-tight sm:text-4xl">
            {session.title ?? (isCompanion ? "Talk with Sthira" : speakerName)}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {isCompanion
              ? "An encouraging conversation with verified passages when one genuinely fits."
              : `A conversation with ${speakerName}`}
          </p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_16rem]">
      <Card>
        <CardContent className="p-0">
          <div
            aria-label={`Conversation with ${speakerName}`}
            aria-live="polite"
            className="max-h-[60dvh] min-h-[28rem] space-y-4 overflow-y-auto bg-background/45 p-4 sm:p-6"
            role="log"
          >
            {messages.length === 0 && (
              <div className="mx-auto max-w-md py-16 text-center">
                <p className="font-semibold">Begin where you are</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Share a question, a feeling, or a situation you want to examine.
                </p>
              </div>
            )}
            {messages.map((message) => {
              const showRecovery =
                message.role === "user" &&
                activeAction !== message.client_action_id &&
                (message.response_status === "failed" ||
                  (message.response_status === "generating" && pollingTimedOut));

              return (
                <Fragment key={message.id}>
                  <div
                    className={cn(
                      "flex",
                      message.role === "user" ? "justify-end" : "justify-start",
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[88%] whitespace-pre-wrap rounded-2xl border px-4 py-3 text-sm leading-6 sm:max-w-[76%]",
                        message.role === "user"
                          ? "border-primary bg-primary text-primary-foreground"
                          : cn("font-serif text-[0.96rem]", messageStyle),
                        message.id.startsWith("pending-") && "opacity-70",
                      )}
                    >
                      {message.content}
                    </div>
                  </div>
                  {showRecovery && (
                    <div className="flex justify-start" role="status">
                      <div
                        className={cn(
                          "max-w-[88%] rounded-2xl border p-4 text-sm shadow-sm sm:max-w-[76%]",
                          messageStyle,
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <CircleAlert
                            aria-hidden="true"
                            className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                          />
                          <div>
                            <p className="font-medium text-foreground">
                              {message.response_status === "failed"
                                ? `${isCompanion ? "The Companion" : speakerName} couldn’t respond this time. Your message is safe.`
                                : message.id.startsWith("pending-")
                                  ? "We couldn’t confirm the response. You can safely try this message again."
                                : "The response is taking longer than expected. Your message is safe."}
                            </p>
                            <Button
                              className="mt-3"
                              disabled={activeAction !== null}
                              onClick={() => retry(message)}
                              size="sm"
                            >
                              <RefreshCw />
                              Try response again
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </Fragment>
              );
            })}
            {(activeAction || (waiting && !pollingTimedOut)) && (
              <div className="flex justify-start" role="status">
                <div className={cn("rounded-2xl border px-4 py-3 text-sm", messageStyle)}>
                  <LoaderCircle className="mr-2 inline size-4 animate-spin" />
                  {speakerName} is reflecting…
                </div>
              </div>
            )}
            <div ref={threadEnd} />
          </div>

          <form
            className="border-t bg-card p-3 sm:p-4"
            onSubmit={(event) => {
              event.preventDefault();
              submit();
            }}
          >
            {sendError && <p className="mb-3 text-sm text-destructive" role="alert">{sendError}</p>}
            <label className="sr-only" htmlFor="chat-message">Message</label>
            <div className="flex items-end gap-2">
              <Textarea
                className="max-h-40 min-h-12 resize-none"
                disabled={busy}
                id="chat-message"
                maxLength={2000}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
                    event.preventDefault();
                    event.currentTarget.form?.requestSubmit();
                  }
                }}
                placeholder={`Write to ${speakerName}…`}
                rows={2}
                value={draft}
              />
              <Button
                aria-label="Send message"
                disabled={busy || !draft.trim()}
                size="icon"
                type="submit"
              >
                {activeAction ? <LoaderCircle className="animate-spin" /> : <Send />}
              </Button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {draft.length}/2000 · Ctrl or Command + Enter to send
            </p>
          </form>
        </CardContent>
      </Card>
      <aside className="hidden space-y-4 lg:block">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Conversation</p>
            <h2 className="mt-4 font-serif text-xl font-medium">A place to examine, not perform</h2>
            <p className="mt-3 text-xs leading-6 text-muted-foreground">Take your time. You can question the response, ask for a simpler explanation, or change direction.</p>
          </CardContent>
        </Card>
        <Card className="bg-primary text-primary-foreground">
          <CardContent className="p-5">
            <p className="font-serif text-lg italic leading-7">Verified passages are identified when they appear. Interpretation remains open to your judgment.</p>
            <p className="mt-4 text-[0.68rem] font-bold uppercase tracking-[0.12em] text-primary-foreground/55">Sthira’s approach</p>
          </CardContent>
        </Card>
      </aside>
      </div>
    </div>
  );
}
