"use client";

import { BookOpenText, LoaderCircle, Pencil, Trash2 } from "lucide-react";
import { useCallback, useState } from "react";

import { EmptyState } from "@/components/empty-state";
import { InlineError } from "@/components/inline-error";
import { PageSkeleton } from "@/components/loading-skeleton";
import { PageHeader } from "@/components/page-header";
import { PassageText, passageKindLabel } from "@/components/passage-text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import { api, ApiClientError } from "@/lib/api/client";
import type { JournalEntrySummary, JournalList } from "@/lib/api/types";
import { useApiResource } from "@/lib/api/use-api-resource";

function formatSavedDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function parseTags(value: string): { error: string | null; tags: string[] } {
  const tags = [...new Set(
    value.split(",").map((tag) => tag.trim().toLocaleLowerCase()).filter(Boolean),
  )];
  if (tags.length > 5) return { error: "Use no more than five tags.", tags };
  if (tags.some((tag) => tag.length > 24)) {
    return { error: "Keep each tag within 24 characters.", tags };
  }
  return { error: null, tags };
}

function EditEntryDialog({
  entry,
  onClose,
  onSaved,
}: {
  entry: JournalEntrySummary;
  onClose: () => void;
  onSaved: (entry: JournalEntrySummary) => void;
}) {
  const [note, setNote] = useState(entry.personal_note ?? "");
  const [tagsText, setTagsText] = useState(entry.tags.join(", "));
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function save() {
    const parsedTags = parseTags(tagsText);
    if (note.length > 1_000) {
      setError("Keep the note within 1000 characters.");
      return;
    }
    if (parsedTags.error) {
      setError(parsedTags.error);
      return;
    }
    setPending(true);
    setError(null);
    try {
      const updated = await api.journal.update(entry.id, {
        personal_note: note.trim() || null,
        tags: parsedTags.tags,
      });
      onSaved(updated);
      toast.success("Journal entry updated");
      onClose();
    } catch (caught) {
      setError(caught instanceof ApiClientError ? caught.message : "The entry could not be updated.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog onOpenChange={(open) => !open && !pending && onClose()} open>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit journal entry</DialogTitle>
          <DialogDescription>Add a personal note or a few tags for returning later.</DialogDescription>
        </DialogHeader>
        <Field>
          <FieldLabel htmlFor="journal-note">Personal note</FieldLabel>
          <Textarea
            id="journal-note"
            maxLength={1_000}
            onChange={(event) => setNote(event.target.value)}
            rows={5}
            value={note}
          />
          <FieldDescription>{note.length}/1000 characters</FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="journal-tags">Tags</FieldLabel>
          <Input
            id="journal-tags"
            onChange={(event) => setTagsText(event.target.value)}
            placeholder="calm, work, perspective"
            value={tagsText}
          />
          <FieldDescription>Separate up to five tags with commas.</FieldDescription>
        </Field>
        {error && <FieldError>{error}</FieldError>}
        <DialogFooter>
          <Button disabled={pending} onClick={onClose} variant="outline">Cancel</Button>
          <Button disabled={pending} onClick={save}>
            {pending && <LoaderCircle className="animate-spin" />}
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function JournalContent({ initial }: { initial: JournalList }) {
  const [entries, setEntries] = useState(initial.entries);
  const [cursor, setCursor] = useState(initial.next_cursor);
  const [editing, setEditing] = useState<JournalEntrySummary | null>(null);
  const [deleting, setDeleting] = useState<JournalEntrySummary | null>(null);
  const [pendingAction, setPendingAction] = useState<"delete" | "load" | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  async function loadMore() {
    if (!cursor || pendingAction) return;
    setPendingAction("load");
    setLoadError(null);
    try {
      const next = await api.journal.list(10, cursor);
      setEntries((current) => [
        ...current,
        ...next.entries.filter((entry) => !current.some((item) => item.id === entry.id)),
      ]);
      setCursor(next.next_cursor);
    } catch (error) {
      setLoadError(error instanceof ApiClientError ? error.message : "More entries could not be loaded.");
    } finally {
      setPendingAction(null);
    }
  }

  async function confirmDelete() {
    if (!deleting || pendingAction) return;
    const entry = deleting;
    const index = entries.findIndex((item) => item.id === entry.id);
    setPendingAction("delete");
    setEntries((current) => current.filter((item) => item.id !== entry.id));
    try {
      await api.journal.delete(entry.id);
      setDeleting(null);
      toast.success("Journal entry deleted");
    } catch (error) {
      setEntries((current) => {
        if (current.some((item) => item.id === entry.id)) return current;
        const restored = [...current];
        restored.splice(Math.max(0, index), 0, entry);
        return restored;
      });
      toast.error("Journal entry was restored", {
        description: error instanceof ApiClientError ? error.message : "Deletion could not be completed.",
      });
      setDeleting(null);
    } finally {
      setPendingAction(null);
    }
  }

  if (entries.length === 0) {
    return (
      <EmptyState
        action={{ href: "/dashboard", label: "Start a check-in" }}
        description="Passages you choose to keep will be collected here with your notes."
        icon={<BookOpenText aria-hidden="true" className="size-5" />}
        title="Your journal is clear"
      />
    );
  }

  return (
    <>
      <div className="space-y-4">
        {entries.map((entry) => (
          <Card
            className="border-l-[6px] transition-shadow hover:shadow-[var(--shadow-lifted)]"
            key={entry.id}
            style={{ borderLeftColor: entry.guide.accent_color ?? undefined }}
          >
            <CardContent className="space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    {entry.guide.name} · {passageKindLabel(entry.quote.content_type) ? `${passageKindLabel(entry.quote.content_type)} · ` : ""}{entry.quote.citation ?? "Source not listed"}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">Saved {formatSavedDate(entry.created_at)}</p>
                </div>
                <div className="flex gap-2">
                  <Button aria-label={`Edit entry from ${entry.guide.name}`} onClick={() => setEditing(entry)} size="sm" variant="outline">
                    <Pencil /> Edit
                  </Button>
                  <Button aria-label={`Delete entry from ${entry.guide.name}`} onClick={() => setDeleting(entry)} size="sm" variant="destructive">
                    <Trash2 /> Delete
                  </Button>
                </div>
              </div>
              <PassageText className="max-w-3xl font-serif text-xl italic leading-8" contentType={entry.quote.content_type} text={entry.quote.text} />
              {entry.personal_note && (
                <div className="rounded-xl bg-muted/65 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Personal note</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{entry.personal_note}</p>
                </div>
              )}
              {entry.tags.length > 0 && (
                <div className="flex flex-wrap gap-2" aria-label="Tags">
                  {entry.tags.map((tag) => <Badge key={tag} variant="muted">{tag}</Badge>)}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {loadError && <InlineError className="mt-5" description={loadError} onRetry={loadMore} title="More entries unavailable" />}
      {cursor && !loadError && (
        <div className="mt-6 flex justify-center">
          <Button disabled={pendingAction !== null} onClick={loadMore} variant="outline">
            {pendingAction === "load" && <LoaderCircle className="animate-spin" />}
            Load more
          </Button>
        </div>
      )}

      {editing && (
        <EditEntryDialog
          entry={editing}
          onClose={() => setEditing(null)}
          onSaved={(updated) => setEntries((current) => current.map((entry) => entry.id === updated.id ? updated : entry))}
        />
      )}

      <Dialog onOpenChange={(open) => !open && pendingAction !== "delete" && setDeleting(null)} open={Boolean(deleting)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this journal entry?</DialogTitle>
            <DialogDescription>This removes the saved passage, note, and tags from your journal.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button disabled={pendingAction === "delete"} onClick={() => setDeleting(null)} variant="outline">Keep entry</Button>
            <Button disabled={pendingAction === "delete"} onClick={confirmDelete} variant="destructive">
              {pendingAction === "delete" && <LoaderCircle className="animate-spin" />}
              Delete entry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function JournalExperience() {
  const load = useCallback((signal: AbortSignal) => api.journal.list(10, undefined, signal), []);
  const resource = useApiResource(load);

  if (resource.status === "loading") return <PageSkeleton cards={3} />;
  if (resource.status === "error") {
    return <InlineError description={resource.error.message} onRetry={resource.retry} title="Journal unavailable" />;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        description="Saved passages, your notes, and the context in which they found you."
        eyebrow="Private journal"
        title="Words worth returning to"
      />
      <JournalContent initial={resource.data} />
    </div>
  );
}
