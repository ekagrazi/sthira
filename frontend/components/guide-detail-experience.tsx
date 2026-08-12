"use client";

import { BookOpenText, Check, Compass, LoaderCircle, MessageCircle, Quote } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import { InlineError } from "@/components/inline-error";
import { PageSkeleton, QuoteSkeleton } from "@/components/loading-skeleton";
import { PageHeader } from "@/components/page-header";
import { QuoteCard } from "@/components/quote-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/components/ui/toast";
import { api, ApiClientError } from "@/lib/api/client";
import type { GuideSlug, WisdomResponse } from "@/lib/api/types";
import { useApiResource } from "@/lib/api/use-api-resource";
import { accentForGuide } from "@/lib/guides";

export function GuideDetailExperience({ slug }: { slug: GuideSlug }) {
  const router = useRouter();
  const load = useCallback((signal: AbortSignal) => api.guides.get(slug, signal), [slug]);
  const resource = useApiResource(load);
  const [quote, setQuote] = useState<WisdomResponse["wisdom"][number] | null>(null);
  const [pending, setPending] = useState<"chat" | "quote" | "save" | null>(null);
  const [savedQuoteId, setSavedQuoteId] = useState<string | null>(null);

  async function getQuote() {
    if (pending) return;
    setPending("quote");
    try {
      const result = await api.wisdom.forGuide(slug);
      setQuote(result.wisdom[0] ?? null);
    } catch (error) {
      toast.error("A passage could not be opened", {
        description: error instanceof ApiClientError ? error.message : "Please try again.",
      });
    } finally {
      setPending(null);
    }
  }

  async function startConversation() {
    if (pending) return;
    setPending("chat");
    try {
      const session = await api.chat.createSession(slug);
      router.push(`/chat/${encodeURIComponent(session.id)}`);
    } catch (error) {
      toast.error("Conversation could not be opened", {
        description: error instanceof ApiClientError ? error.message : "Please try again.",
      });
      setPending(null);
    }
  }

  async function saveQuote() {
    if (!quote || pending || savedQuoteId === quote.quote.id) return;
    setPending("save");
    try {
      const entry = await api.journal.create({ quote_id: quote.quote.id });
      setSavedQuoteId(entry.quote.id);
      toast.success("Saved to journal");
    } catch (error) {
      toast.error("The passage could not be saved", {
        description: error instanceof ApiClientError ? error.message : "Please try again.",
      });
    } finally {
      setPending(null);
    }
  }

  if (resource.status === "loading") return <PageSkeleton cards={1} />;
  if (resource.status === "error") {
    return (
      <InlineError
        description={resource.error.message}
        onRetry={resource.retry}
        title="Perspective unavailable"
      />
    );
  }

  const guide = resource.data;
  const displayTradition = guide.slug === "bhagavad-gita" ? "Scripture" : guide.tradition;
  return (
    <div className="space-y-8">
      <PageHeader
        description={guide.short_desc ?? "A considered perspective for the question in front of you."}
        eyebrow={displayTradition}
        title={guide.name}
      />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.65fr)]">
        <Card className="relative overflow-hidden bg-primary text-primary-foreground">
          <span aria-hidden="true" className="absolute -bottom-32 -right-24 size-80 rounded-full border border-white/10" />
          <CardContent className="relative flex min-h-72 flex-col justify-between space-y-8 p-7 sm:p-9">
            <div>
              <Badge className="border-white/15 bg-white/8 text-primary-foreground" variant="outline">{displayTradition}</Badge>
              <h2 className="mt-7 max-w-xl font-serif text-3xl font-medium leading-tight sm:text-4xl">A distinct voice for a question worth examining.</h2>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-primary-foreground/65">Reflections use verified source passages when a citation is offered, while leaving room for your own judgment.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button className="bg-card text-foreground hover:bg-card/90" disabled={pending !== null} onClick={getQuote} variant="secondary">{pending === "quote" ? <LoaderCircle className="animate-spin" /> : <Quote />}Open a passage</Button>
              <Button className="border-white/20 bg-card text-foreground hover:bg-card/90" disabled={pending !== null} onClick={startConversation} variant="outline">{pending === "chat" ? <LoaderCircle className="animate-spin" /> : <MessageCircle />}Start a conversation</Button>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex h-full flex-col justify-between p-7">
            <div><Compass className="size-7 text-guide-gita-ink" /><h2 className="mt-6 font-serif text-2xl">What to expect</h2><p className="mt-4 text-sm leading-7 text-muted-foreground">A reflective exchange grounded in this tradition—not certainty, diagnosis, or an imitation of a historical person.</p></div>
            <p className="mt-8 border-t pt-5 text-xs leading-5 text-muted-foreground">Passages remain clearly attributed so you can keep source and interpretation distinct.</p>
          </CardContent>
        </Card>
      </div>
      {pending === "quote" && !quote && <QuoteSkeleton />}
      {quote && (
        <div className="space-y-3 rounded-[var(--radius-card)] border bg-card p-3 shadow-[var(--shadow-soft)]">
          <QuoteCard
            accent={accentForGuide(quote.guide)}
            citation={quote.quote.citation ?? "Source not listed"}
            contentType={quote.quote.content_type}
            guide={quote.guide.name}
            text={quote.quote.text}
          />
          <Button
            disabled={pending !== null || savedQuoteId === quote.quote.id}
            onClick={saveQuote}
            variant="outline"
          >
            {pending === "save" ? (
              <LoaderCircle className="animate-spin" />
            ) : savedQuoteId === quote.quote.id ? (
              <Check />
            ) : (
              <BookOpenText />
            )}
            {savedQuoteId === quote.quote.id ? "Saved to journal" : "Save to journal"}
          </Button>
        </div>
      )}
    </div>
  );
}
