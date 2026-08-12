"use client";

import { LoaderCircle, MessageCircle, Plus, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import { InlineError } from "@/components/inline-error";
import { PageSkeleton } from "@/components/loading-skeleton";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/components/ui/toast";
import { api, ApiClientError } from "@/lib/api/client";
import { useApiResource } from "@/lib/api/use-api-resource";

export function CompanionExperience() {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const load = useCallback(
    (signal: AbortSignal) => api.chat.listSessions(6, signal, "companion"),
    [],
  );
  const resource = useApiResource(load);

  async function beginConversation() {
    if (creating) return;
    setCreating(true);
    try {
      const session = await api.chat.createCompanionSession();
      router.push(`/chat/${encodeURIComponent(session.id)}`);
    } catch (error) {
      toast.error("Conversation could not be opened", {
        description: error instanceof ApiClientError ? error.message : "Please try again.",
      });
      setCreating(false);
    }
  }

  if (resource.status === "loading") return <PageSkeleton cards={2} />;
  if (resource.status === "error") {
    return (
      <InlineError
        description={resource.error.message}
        onRetry={resource.retry}
        title="Companion unavailable"
      />
    );
  }

  const latest = resource.data.sessions[0];
  return (
    <div className="space-y-8">
      <PageHeader
        description="A warm, grounded conversation that can draw from the complete verified passage library without choosing one perspective first."
        eyebrow="Open reflection"
        title="Talk with Sthira"
      />

      <Card className="relative overflow-hidden bg-primary text-primary-foreground">
        <span aria-hidden="true" className="absolute -bottom-40 -right-24 size-96 rounded-full border border-white/10" />
        <CardContent className="relative grid gap-8 p-7 sm:p-9 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="max-w-2xl">
            <div className="mb-5 grid size-12 place-items-center rounded-2xl bg-white/8 text-guide-gita">
              <Sparkles aria-hidden="true" className="size-6" />
            </div>
            <h2 className="font-serif text-3xl font-medium">Begin with what is on your mind</h2>
            <p className="mt-4 text-sm leading-7 text-primary-foreground/65">
              The Companion responds naturally and uses a verified passage only when one genuinely
              fits. Different traditions remain clearly identified rather than blended together.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 lg:flex-col">
            {latest && (
              <Button asChild className="border-white/20 bg-card text-foreground hover:bg-card/90 hover:text-foreground" variant="outline">
                <Link href={`/chat/${latest.id}`}>
                  <MessageCircle /> Resume latest
                </Link>
              </Button>
            )}
            <Button className="bg-card text-foreground hover:bg-card/90" disabled={creating} onClick={beginConversation}>
              {creating ? <LoaderCircle className="animate-spin" /> : <Plus />}
              New conversation
            </Button>
          </div>
        </CardContent>
      </Card>

      {resource.data.sessions.length > 0 && (
        <section aria-labelledby="recent-companion-title">
          <h2 className="mb-4 font-serif text-2xl" id="recent-companion-title">
            Recent conversations
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {resource.data.sessions.map((session) => (
              <Link href={`/chat/${session.id}`} key={session.id}>
                <Card className="h-full transition-shadow hover:shadow-[var(--shadow-lifted)]">
                  <CardContent>
                    <p className="font-serif text-lg font-medium">{session.title ?? "Open reflection"}</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Updated {new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(session.updated_at))}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
