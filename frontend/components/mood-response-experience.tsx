"use client";

import { BookOpenText, LoaderCircle, MessageCircle, RefreshCw, Sparkles } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { EmptyState } from "@/components/empty-state";
import { InlineError } from "@/components/inline-error";
import { QuoteSkeleton } from "@/components/loading-skeleton";
import { QuoteCard } from "@/components/quote-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/toast";
import { api, ApiClientError } from "@/lib/api/client";
import type { GuideSlug, MoodResult } from "@/lib/api/types";
import { useApiResource } from "@/lib/api/use-api-resource";
import { findGuide, guideIdentities, type GuideAccent } from "@/lib/guides";

const guideContext: Record<GuideSlug, string> = {
  "bhagavad-gita":
    "The Bhagavad Gita frames steadiness through action, duty, and freedom from attachment to outcomes. Read the passage as an invitation to examine how you meet the present task.",
  "marcus-aurelius":
    "Marcus Aurelius wrote the Meditations as private reminders about judgment, conduct, and what remains within our control. The passage belongs to that practice of self-correction.",
  buddha:
    "Teachings collected in the Dhammapada use concise verses to connect attention, conduct, and the causes of suffering. This passage is best held as practical reflection rather than command.",
  rumi:
    "Rumi’s poetry often approaches inner change through love, longing, and paradox. Wording varies between translations, while the image invites reflection beyond a single literal reading.",
  camus:
    "Camus examines how a person can live honestly and freely without guaranteed answers. This passage sits within that tension between uncertainty and active engagement with life.",
};

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

function accentFor(slug: GuideSlug): GuideAccent {
  return findGuide(slug)?.accent ?? "marcus";
}

export function MoodResponseExperience({ checkinId }: { checkinId: string | null }) {
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const validId = checkinId && uuidPattern.test(checkinId) ? checkinId : null;
  const load = useCallback(
    (signal: AbortSignal) => {
      if (!validId) {
        return Promise.reject(new ApiClientError("Reflection not found.", "generic", 404));
      }
      return api.mood.getResult(validId, signal);
    },
    [validId],
  );
  const resource = useApiResource<MoodResult>(load);
  const [replacement, setReplacement] = useState<MoodResult | null>(null);
  const [pendingAction, setPendingAction] = useState<"chat" | "reroll" | "save" | null>(null);
  const [savedQuoteId, setSavedQuoteId] = useState<string | null>(null);
  const [showColdStartMessage, setShowColdStartMessage] = useState(false);

  useEffect(() => {
    if (resource.status !== "loading") return;
    const timer = window.setTimeout(() => setShowColdStartMessage(true), 900);
    return () => window.clearTimeout(timer);
  }, [resource.status]);

  const result = replacement ?? (resource.status === "success" ? resource.data : null);

  async function save() {
    if (!result || pendingAction) return;
    setPendingAction("save");
    try {
      await api.journal.create({
        checkin_id: result.checkin.id,
        quote_id: result.matched_quote.id,
      });
      setSavedQuoteId(result.matched_quote.id);
      toast.success("Saved to your journal", {
        description: "This passage is ready whenever you want to return to it.",
      });
    } catch (error) {
      toast.error("Could not save this passage", {
        description: error instanceof ApiClientError ? error.message : "Please try again.",
      });
    } finally {
      setPendingAction(null);
    }
  }

  async function reroll(guideSlug: GuideSlug) {
    if (!result || pendingAction) return;
    setPendingAction("reroll");
    try {
      const next = await api.mood.reroll(result.checkin.id, guideSlug);
      setReplacement({
        checkin: {
          ...result.checkin,
          matched_guide_id: next.matched_guide.id,
          matched_quote_id: next.matched_quote.id,
        },
        ...next,
      });
      setSavedQuoteId(null);
    } catch (error) {
      toast.error("Another perspective could not be found", {
        description: error instanceof ApiClientError ? error.message : "Please try again.",
      });
    } finally {
      setPendingAction(null);
    }
  }

  async function startChat() {
    if (!result || pendingAction) return;
    setPendingAction("chat");
    try {
      const session = await api.chat.createSession(result.matched_guide.slug);
      router.push(`/chat/${encodeURIComponent(session.id)}`);
    } catch (error) {
      toast.error("Conversation could not be opened", {
        description: error instanceof ApiClientError ? error.message : "Please try again.",
      });
      setPendingAction(null);
    }
  }

  if (resource.status === "loading") {
    return (
      <div className="space-y-4" aria-live="polite">
        <QuoteSkeleton />
        <p className="text-sm text-muted-foreground" role="status">
          {showColdStartMessage
            ? "The reflection service is waking up. Your result will appear here."
            : "Opening your reflection…"}
        </p>
      </div>
    );
  }

  if (resource.status === "error") {
    if (resource.error.status === 404) {
      return (
        <EmptyState
          action={{ href: "/dashboard", label: "Start a new check-in" }}
          description="This reflection is unavailable or does not belong to the current session."
          icon={<Sparkles aria-hidden="true" className="size-5" />}
          title="Reflection not found"
        />
      );
    }
    return (
      <InlineError
        description={resource.error.message}
        onRetry={() => {
          setShowColdStartMessage(false);
          setReplacement(null);
          resource.retry();
        }}
        title="Reflection interrupted"
      />
    );
  }

  if (!result) return null;

  const currentGuide = result.matched_guide;
  const alternatives = guideIdentities.filter((guide) => guide.slug !== currentGuide.slug);
  const actionPending = pendingAction !== null;

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1.45fr)_minmax(18rem,0.75fr)]">
      <div className="space-y-5">
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          initial={reducedMotion ? false : { opacity: 0, y: 10 }}
          key={result.matched_quote.id}
          transition={{ duration: reducedMotion ? 0 : 0.38, ease: "easeOut" }}
        >
          <QuoteCard
            accent={accentFor(currentGuide.slug)}
            citation={result.matched_quote.citation ?? "Source not listed"}
            contentType={result.matched_quote.content_type}
            guide={currentGuide.name}
            text={result.matched_quote.text}
          />
        </motion.div>

        <div className="flex flex-wrap gap-3">
          <Button
            disabled={actionPending || savedQuoteId === result.matched_quote.id}
            onClick={save}
          >
            {pendingAction === "save" ? (
              <LoaderCircle aria-hidden="true" className="animate-spin" />
            ) : (
              <BookOpenText aria-hidden="true" />
            )}
            {savedQuoteId === result.matched_quote.id ? "Saved" : "Save to journal"}
          </Button>
          <Button disabled={actionPending} onClick={startChat} variant="outline">
            {pendingAction === "chat" ? (
              <LoaderCircle aria-hidden="true" className="animate-spin" />
            ) : (
              <MessageCircle aria-hidden="true" />
            )}
            Chat about this
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw aria-hidden="true" className="size-4" />
              Try another perspective
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm leading-6 text-muted-foreground">
              Keep the same check-in and hear from a different tradition.
            </p>
            <div className="flex flex-wrap gap-2">
              {alternatives.map((guide) => (
                <Button
                  disabled={actionPending}
                  key={guide.slug}
                  onClick={() => reroll(guide.slug as GuideSlug)}
                  size="sm"
                  variant="secondary"
                >
                  {guide.name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <aside className="space-y-5">
        <Card>
          <CardHeader>
            <CardTitle>Why this passage</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Theme</p>
              <p className="mt-1 font-medium capitalize">
                {result.checkin.detected_theme ?? result.matched_quote.themes[0] ?? "Reflection"}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Citation</p>
              <p className="mt-1 font-medium">{result.matched_quote.citation ?? "Source not listed"}</p>
            </div>
            <p className="text-sm leading-6 text-muted-foreground">{guideContext[currentGuide.slug]}</p>
          </CardContent>
        </Card>
        <Button asChild className="w-full" variant="ghost">
          <Link href="/dashboard">Return to dashboard</Link>
        </Button>
      </aside>
    </div>
  );
}
