"use client";

import { BookOpen, Check, Library, LoaderCircle, Search } from "lucide-react";
import { useCallback, useState, type FormEvent } from "react";

import { EmptyState } from "@/components/empty-state";
import { InlineError } from "@/components/inline-error";
import { PageSkeleton } from "@/components/loading-skeleton";
import { PageHeader } from "@/components/page-header";
import { PassageText, passageKindLabel } from "@/components/passage-text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { api, ApiClientError } from "@/lib/api/client";
import type { LibraryPassage } from "@/lib/api/types";
import { useApiResource } from "@/lib/api/use-api-resource";
import { cn } from "@/lib/utils";

const themeFilters = [
  { label: "All", value: "" },
  { label: "Purpose", value: "purpose" },
  { label: "Control", value: "control" },
  { label: "Patience", value: "patience" },
  { label: "Change", value: "impermanence" },
  { label: "Love", value: "love" },
] as const;

function SaveButton({ passage, inverse = false }: { passage: LibraryPassage; inverse?: boolean }) {
  const [journalEntryId, setJournalEntryId] = useState(passage.journal_entry_id);
  const [pending, setPending] = useState(false);

  async function toggleSaved() {
    if (pending) return;
    setPending(true);
    try {
      if (journalEntryId) {
        await api.journal.delete(journalEntryId);
        setJournalEntryId(null);
        toast.success("Removed from journal");
      } else {
        const entry = await api.journal.create({ quote_id: passage.quote.id });
        setJournalEntryId(entry.id);
        toast.success("Saved to journal");
      }
    } catch (error) {
      toast.error("The journal could not be updated", { description: error instanceof ApiClientError ? error.message : "Please try again." });
    } finally {
      setPending(false);
    }
  }

  return (
    <Button
      aria-label={journalEntryId ? "Remove passage from journal" : "Save passage to journal"}
      className={inverse ? "bg-card text-foreground hover:bg-card/90" : undefined}
      disabled={pending}
      onClick={toggleSaved}
      size="sm"
      variant={inverse ? "secondary" : journalEntryId ? "secondary" : "outline"}
    >
      {pending ? <LoaderCircle className="animate-spin" /> : journalEntryId ? <Check /> : <Library />}
      {journalEntryId ? "Saved" : inverse ? "Save to journal" : "Save"}
    </Button>
  );
}

function PassageCard({ passage }: { passage: LibraryPassage }) {
  return (
    <Card className="flex h-full min-h-72 flex-col border-t-4" style={{ borderTopColor: passage.guide.accent_color ?? undefined }}>
      <CardContent className="flex h-full flex-col p-5">
        <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-[0.68rem] font-extrabold uppercase tracking-[0.14em]" style={{ color: passage.guide.accent_color ?? undefined }}>{passage.guide.name}</p>{passage.quote.themes[0] && <Badge variant="outline">{passage.quote.themes[0]}</Badge>}</div>
        <PassageText className="my-7 flex-1 font-serif text-xl italic leading-8" contentType={passage.quote.content_type} text={passage.quote.text} />
        <div className="flex items-end justify-between gap-3 border-t pt-4"><cite className="text-xs not-italic leading-5 text-muted-foreground">{passageKindLabel(passage.quote.content_type) ? `${passageKindLabel(passage.quote.content_type)} · ` : ""}{passage.quote.citation ?? passage.guide.tradition}</cite><SaveButton passage={passage} /></div>
      </CardContent>
    </Card>
  );
}

export function LibraryExperience() {
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const [theme, setTheme] = useState("");
  const [additional, setAdditional] = useState<LibraryPassage[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null | undefined>(undefined);
  const [loadingMore, setLoadingMore] = useState(false);
  const load = useCallback((signal: AbortSignal) => api.library.list({ limit: 12, ...(query ? { query } : {}), ...(theme ? { theme } : {}) }, signal), [query, theme]);
  const resource = useApiResource(load);

  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAdditional([]);
    setNextCursor(undefined);
    setQuery(draft.trim());
  }

  function selectTheme(value: string) {
    setAdditional([]);
    setNextCursor(undefined);
    setTheme(value);
  }

  async function loadMore() {
    if (resource.status !== "success" || loadingMore) return;
    const cursor = nextCursor === undefined ? resource.data.next_cursor : nextCursor;
    if (!cursor) return;
    setLoadingMore(true);
    try {
      const result = await api.library.list({ cursor, limit: 12, ...(query ? { query } : {}), ...(theme ? { theme } : {}) });
      setAdditional((current) => [...current, ...result.passages]);
      setNextCursor(result.next_cursor);
    } catch (error) {
      toast.error("More passages could not be loaded", { description: error instanceof ApiClientError ? error.message : "Please try again." });
    } finally { setLoadingMore(false); }
  }

  if (resource.status === "loading") return <PageSkeleton cards={6} />;
  if (resource.status === "error") return <InlineError description={resource.error.message} onRetry={resource.retry} title="Library unavailable" />;

  const passages = [...resource.data.passages, ...additional];
  const cursor = nextCursor === undefined ? resource.data.next_cursor : nextCursor;
  const featured = passages[0];
  const remaining = passages.slice(1);

  return (
    <div className="space-y-7">
      <PageHeader description="Browse verified passages across every perspective, follow a theme, and save what deserves another reading." eyebrow="Passage library" title="A room of useful words" />
      <div className="space-y-3">
        <form className="flex gap-2" onSubmit={search}><label className="relative flex-1"><span className="sr-only">Search words in passages</span><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input className="h-12 bg-card pl-10" maxLength={80} onChange={(event) => setDraft(event.target.value)} placeholder="Search words in passages" value={draft} /></label><Button type="submit" variant="outline">Search</Button></form>
        <div aria-label="Filter passages by theme" className="flex flex-wrap gap-2">{themeFilters.map((filter) => <button aria-pressed={theme === filter.value} className={cn("rounded-full border px-3 py-2 text-xs font-semibold transition-colors focus-visible:ring-3 focus-visible:ring-ring/55", theme === filter.value ? "border-primary bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground")} key={filter.value} onClick={() => selectTheme(filter.value)} type="button">{filter.label}</button>)}</div>
      </div>

      {passages.length === 0 ? <EmptyState description="Try another word or choose a different theme." icon={<Search className="size-5" />} title="No passages found" /> : (
        <>
          {featured && (
            <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
              <figure className="flex min-h-80 flex-col justify-between rounded-[var(--radius-card)] bg-primary p-7 text-primary-foreground shadow-[var(--shadow-soft)] sm:p-9"><div><p className="text-[0.68rem] font-extrabold uppercase tracking-[0.14em] text-guide-gita">Featured passage · {featured.guide.name}</p><PassageText className="my-9 max-w-3xl font-serif text-3xl italic leading-[1.25] sm:text-4xl" contentType={featured.quote.content_type} text={featured.quote.text} /></div><div className="flex flex-wrap items-end justify-between gap-4"><figcaption className="text-xs text-primary-foreground/60">{passageKindLabel(featured.quote.content_type) ? `${passageKindLabel(featured.quote.content_type)} · ` : ""}{featured.quote.citation ?? featured.guide.tradition}</figcaption><SaveButton inverse passage={featured} /></div></figure>
              <div className="relative flex min-h-80 flex-col justify-between overflow-hidden rounded-[var(--radius-card)] border bg-gradient-to-br from-guide-gita/12 to-card p-7 shadow-[var(--shadow-soft)]"><span aria-hidden="true" className="absolute -bottom-24 -right-16 size-64 rounded-full bg-guide-gita/10" /><div className="relative"><p className="text-xs font-bold uppercase tracking-[0.16em] text-guide-gita-ink">Your reading room</p><h2 className="mt-5 max-w-sm font-serif text-3xl font-medium">Save a passage. Return when its meaning changes.</h2><p className="mt-4 max-w-sm text-sm leading-7 text-muted-foreground">The Library holds verified source passages. Your Journal holds the ones you choose, alongside your own notes.</p></div><BookOpen className="relative size-10 text-guide-gita-ink" /></div>
            </section>
          )}
          {remaining.length > 0 && <section><div className="mb-4 flex items-end justify-between gap-4"><h2 className="font-serif text-2xl">Explore passages</h2><span className="text-xs text-muted-foreground">{passages.length} shown</span></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{remaining.map((passage) => <PassageCard key={passage.quote.id} passage={passage} />)}</div></section>}
        </>
      )}
      {cursor && <div className="flex justify-center"><Button disabled={loadingMore} onClick={loadMore} variant="outline">{loadingMore && <LoaderCircle className="animate-spin" />}Load more passages</Button></div>}
    </div>
  );
}
