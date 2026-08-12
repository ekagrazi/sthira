"use client";

import { ArrowRight, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import { api, ApiClientError } from "@/lib/api/client";
import { cn } from "@/lib/utils";

const moodChoices = [
  { emoji: "😊", label: "Bright" },
  { emoji: "🙂", label: "Steady" },
  { emoji: "😐", label: "Neutral" },
  { emoji: "😟", label: "Uneasy" },
  { emoji: "😢", label: "Low" },
  { emoji: "😠", label: "Frustrated" },
] as const;

export function MoodCheckinForm({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [moodEmoji, setMoodEmoji] = useState<string | null>(null);
  const [freeText, setFreeText] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [showColdStartMessage, setShowColdStartMessage] = useState(false);

  useEffect(() => {
    if (!pending) return;
    const timer = window.setTimeout(() => setShowColdStartMessage(true), 900);
    return () => window.clearTimeout(timer);
  }, [pending]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const trimmedText = freeText.trim();
    if (!moodEmoji && !trimmedText) {
      setFieldError("Choose a feeling or add a few words before continuing.");
      return;
    }
    setFieldError(null);
    setShowColdStartMessage(false);
    setPending(true);
    try {
      const result = await api.mood.checkIn({
        ...(trimmedText && { free_text: trimmedText }),
        ...(moodEmoji && { mood_emoji: moodEmoji }),
      });
      router.push(`/mood/response?checkin=${encodeURIComponent(result.checkin.id)}`);
    } catch (error) {
      const message = error instanceof ApiClientError ? error.message : "Your check-in could not be completed. Please try again.";
      setFieldError(message);
      toast.error("Check-in interrupted", { description: message });
      setShowColdStartMessage(false);
      setPending(false);
    }
  }

  return (
    <form className={cn("space-y-5", compact && "space-y-4")} onSubmit={submit}>
      <fieldset disabled={pending}>
        <legend className="text-sm font-semibold">How does this moment feel?</legend>
        <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
          {moodChoices.map((choice) => {
            const selected = moodEmoji === choice.emoji;
            return (
              <button
                aria-pressed={selected}
                className={cn(
                  "flex min-h-20 flex-col items-center justify-center rounded-2xl border px-2 py-3 text-center transition-[background-color,border-color,transform] focus-visible:ring-3 focus-visible:ring-ring/55 disabled:cursor-not-allowed disabled:opacity-55",
                  selected ? "-translate-y-0.5 border-primary bg-primary text-primary-foreground shadow-sm" : "bg-background/65 hover:border-primary/35 hover:bg-muted",
                )}
                key={choice.label}
                onClick={() => { setMoodEmoji(choice.emoji); setFieldError(null); }}
                type="button"
              >
                <span aria-hidden="true" className="text-2xl">{choice.emoji}</span>
                <span className="mt-1 text-xs font-semibold">{choice.label}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <Field>
        <div className="flex items-baseline justify-between gap-3"><FieldLabel htmlFor="mood-note">Put it into words</FieldLabel><span className="text-xs text-muted-foreground">{freeText.length}/500</span></div>
        <Textarea
          aria-invalid={Boolean(fieldError)}
          className="bg-background/60"
          disabled={pending}
          id="mood-note"
          maxLength={500}
          onChange={(event) => { setFreeText(event.target.value); setFieldError(null); }}
          placeholder="What is weighing on you, or giving you energy?"
          rows={compact ? 3 : 4}
          value={freeText}
        />
        <FieldDescription>A feeling, a sentence, or both is enough. Your words remain private.</FieldDescription>
        {fieldError && <FieldError>{fieldError}</FieldError>}
      </Field>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button disabled={pending} size="lg" type="submit">
          {pending ? <><LoaderCircle aria-hidden="true" className="animate-spin" />Finding the right words…</> : <>Find a perspective<ArrowRight aria-hidden="true" /></>}
        </Button>
        {pending && <p aria-live="polite" className="text-sm text-muted-foreground" role="status">{showColdStartMessage ? "The reflection service is waking up. Your check-in is still here." : "Listening to what you shared…"}</p>}
      </div>
    </form>
  );
}
