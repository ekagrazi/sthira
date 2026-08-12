"use client";

import { MessageCircle } from "lucide-react";
import Link from "next/link";
import { useCallback } from "react";

import { EmptyState } from "@/components/empty-state";
import { InlineError } from "@/components/inline-error";
import { PageSkeleton } from "@/components/loading-skeleton";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { api } from "@/lib/api/client";
import { useApiResource } from "@/lib/api/use-api-resource";

export function ChatHistoryExperience() {
  const load = useCallback((signal: AbortSignal) => api.chat.listSessions(20, signal), []);
  const resource = useApiResource(load);

  if (resource.status === "loading") return <PageSkeleton cards={3} />;
  if (resource.status === "error") {
    return (
      <InlineError
        description={resource.error.message}
        onRetry={resource.retry}
        title="Conversation history unavailable"
      />
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        description="Resume a private exchange from its latest point."
        eyebrow="Conversations"
        title="Conversation history"
      />
      {resource.data.sessions.length === 0 ? (
        <EmptyState
          action={{ href: "/guides", label: "Choose a perspective" }}
          description="Choose a perspective or begin an open conversation with the Companion."
          icon={<MessageCircle className="size-5" />}
          title="No conversations yet"
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {resource.data.sessions.map((session) => (
            <Link href={`/chat/${session.id}`} key={session.id}>
              <Card className="h-full transition-shadow hover:shadow-[var(--shadow-lifted)]">
                <CardContent>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    {session.mode === "companion" ? "Sthira Companion" : session.guide?.name}
                  </p>
                  <h2 className="mt-2 font-semibold">{session.title ?? "New conversation"}</h2>
                  <p className="mt-3 text-sm text-muted-foreground">
                    Updated {new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(session.updated_at))}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
