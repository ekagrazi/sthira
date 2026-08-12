"use client";

import { ArrowRight, BookOpenText, Flame, MessageCircle, Quote } from "lucide-react";
import Link from "next/link";
import { useCallback } from "react";

import { InlineError } from "@/components/inline-error";
import { MoodCheckinForm } from "@/components/mood-checkin-form";
import { PassageText, passageKindLabel } from "@/components/passage-text";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api/client";
import type { ChatSessionList, JournalList, StreakSummary, WisdomResponse } from "@/lib/api/types";
import { useApiResource } from "@/lib/api/use-api-resource";

function PanelSkeleton() {
  return (
    <div aria-label="Loading section" className="space-y-3" role="status">
      <Skeleton className="h-5 w-2/5" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-4/5" />
    </div>
  );
}

function EmptyPanel({ children }: { children: React.ReactNode }) {
  return <p className="py-3 text-sm leading-6 text-muted-foreground">{children}</p>;
}

function WisdomPanel() {
  const load = useCallback((signal: AbortSignal) => api.wisdom.list(3, signal), []);
  const resource = useApiResource<WisdomResponse>(load);

  return (
    <Card className="relative overflow-hidden border-guide-rumi/20 bg-primary text-primary-foreground">
      <span aria-hidden="true" className="absolute -right-28 -top-28 size-72 rounded-full border border-white/10" />
      <span aria-hidden="true" className="absolute -right-12 -top-12 size-44 rounded-full border border-guide-gita/35" />
      <CardHeader className="relative">
        <div className="mb-4 grid size-11 place-items-center rounded-2xl bg-white/8 text-guide-gita">
          <Quote aria-hidden="true" className="size-5" />
        </div>
        <CardTitle className="font-serif text-2xl">Wisdom for today</CardTitle>
        <CardDescription className="text-primary-foreground/60">A passage to carry without needing to solve anything.</CardDescription>
      </CardHeader>
      <CardContent className="relative">
        {resource.status === "loading" && <PanelSkeleton />}
        {resource.status === "error" && (
          <InlineError description={resource.error.message} onRetry={resource.retry} title="Wisdom unavailable" />
        )}
        {resource.status === "success" && resource.data.wisdom.length === 0 && (
          <EmptyPanel>No passage is available right now.</EmptyPanel>
        )}
        {resource.status === "success" && resource.data.wisdom[0] && (
          <figure className="max-w-4xl pb-2">
            <PassageText className="font-serif text-2xl italic leading-9 sm:text-3xl sm:leading-[1.45]" contentType={resource.data.wisdom[0].quote.content_type} text={resource.data.wisdom[0].quote.text} />
            <figcaption className="mt-6 text-xs font-semibold uppercase tracking-[0.14em] text-primary-foreground/58">
              {passageKindLabel(resource.data.wisdom[0].quote.content_type) ? `${passageKindLabel(resource.data.wisdom[0].quote.content_type)} · ` : ""}
              {resource.data.wisdom[0].guide.name}
              {resource.data.wisdom[0].quote.citation ? ` · ${resource.data.wisdom[0].quote.citation}` : ""}
            </figcaption>
          </figure>
        )}
      </CardContent>
    </Card>
  );
}

function StreakPanel() {
  const load = useCallback((signal: AbortSignal) => api.streak.get(signal), []);
  const resource = useApiResource<StreakSummary>(load);
  return (
    <Card>
      <CardHeader>
        <div className="mb-3 grid size-10 place-items-center rounded-xl bg-guide-gita/10 text-guide-gita-ink"><Flame className="size-5" /></div>
        <CardTitle>Reflection rhythm</CardTitle>
        <CardDescription>Small returns build a steadier practice.</CardDescription>
      </CardHeader>
      <CardContent>
        {resource.status === "loading" && <PanelSkeleton />}
        {resource.status === "error" && <InlineError description={resource.error.message} onRetry={resource.retry} title="Streak unavailable" />}
        {resource.status === "success" && resource.data.current_streak === 0 && <EmptyPanel>Your first completed check-in begins the rhythm.</EmptyPanel>}
        {resource.status === "success" && resource.data.current_streak > 0 && (
          <div className="flex items-end gap-5"><div><p className="font-serif text-5xl">{resource.data.current_streak}</p><p className="mt-1 text-sm text-muted-foreground">current days</p></div><div className="border-l pl-5"><p className="text-xl font-semibold">{resource.data.longest_streak}</p><p className="mt-1 text-sm text-muted-foreground">longest</p></div></div>
        )}
      </CardContent>
    </Card>
  );
}

function ChatPanel() {
  const load = useCallback((signal: AbortSignal) => api.chat.listSessions(1, signal), []);
  const resource = useApiResource<ChatSessionList>(load);
  return (
    <Card>
      <CardHeader>
        <div className="mb-3 grid size-10 place-items-center rounded-xl bg-guide-marcus/10 text-guide-marcus-ink"><MessageCircle className="size-5" /></div>
        <CardTitle>Continue a conversation</CardTitle>
        <CardDescription>Return to your most recent reflection.</CardDescription>
      </CardHeader>
      <CardContent>
        {resource.status === "loading" && <PanelSkeleton />}
        {resource.status === "error" && <InlineError description={resource.error.message} onRetry={resource.retry} title="Conversation unavailable" />}
        {resource.status === "success" && resource.data.sessions.length === 0 && <EmptyPanel>Begin an open conversation with the Companion or choose a perspective.</EmptyPanel>}
        {resource.status === "success" && resource.data.sessions[0] && (
          <div><p className="font-serif text-xl">{resource.data.sessions[0].title ?? resource.data.sessions[0].guide?.name ?? "Sthira Companion"}</p><p className="mt-1 text-sm text-muted-foreground">{resource.data.sessions[0].guide?.tradition ?? "Open reflection"}</p><Button asChild className="mt-4" size="sm" variant="outline"><Link href={`/chat/${resource.data.sessions[0].id}`}>Resume conversation</Link></Button></div>
        )}
      </CardContent>
    </Card>
  );
}

function JournalPanel() {
  const load = useCallback((signal: AbortSignal) => api.journal.list(3, undefined, signal), []);
  const resource = useApiResource<JournalList>(load);
  return (
    <Card className="md:col-span-2">
      <CardHeader>
        <div className="mb-3 grid size-10 place-items-center rounded-xl bg-guide-buddha/10 text-guide-buddha-ink"><BookOpenText className="size-5" /></div>
        <CardTitle>Recently saved</CardTitle><CardDescription>The newest passages in your journal.</CardDescription>
        <CardAction><Button asChild size="sm" variant="ghost"><Link href="/journal">Open journal <ArrowRight /></Link></Button></CardAction>
      </CardHeader>
      <CardContent>
        {resource.status === "loading" && <PanelSkeleton />}
        {resource.status === "error" && <InlineError description={resource.error.message} onRetry={resource.retry} title="Journal unavailable" />}
        {resource.status === "success" && resource.data.entries.length === 0 && <EmptyPanel>Passages you save will gather here.</EmptyPanel>}
        {resource.status === "success" && resource.data.entries.length > 0 && (
          <div className="grid gap-4 md:grid-cols-3">{resource.data.entries.map((entry) => <figure className="rounded-2xl border bg-background/50 p-4" key={entry.id}><PassageText className="line-clamp-3 font-serif italic leading-6" contentType={entry.quote.content_type} text={entry.quote.text} /><figcaption className="mt-3 text-xs font-semibold text-muted-foreground">{entry.guide.name}</figcaption></figure>)}</div>
        )}
      </CardContent>
    </Card>
  );
}

export function DashboardExperience() {
  return (
    <div className="space-y-6">
      <WisdomPanel />
      <Card className="border-primary/10">
        <CardHeader><CardTitle className="font-serif text-2xl">Check in with yourself</CardTitle><CardDescription>Notice what is present, then meet a fitting perspective.</CardDescription></CardHeader>
        <CardContent><MoodCheckinForm compact /></CardContent>
      </Card>
      <div className="grid gap-5 md:grid-cols-2"><StreakPanel /><ChatPanel /><JournalPanel /></div>
    </div>
  );
}
