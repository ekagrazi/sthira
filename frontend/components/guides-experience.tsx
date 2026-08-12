"use client";

import { ArrowUpRight, BookOpen, Flower2, Landmark, MoonStar, PenLine, Plus } from "lucide-react";
import Link from "next/link";
import { useCallback } from "react";

import { InlineError } from "@/components/inline-error";
import { PageSkeleton } from "@/components/loading-skeleton";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api/client";
import type { PublicGuide } from "@/lib/api/types";
import { useApiResource } from "@/lib/api/use-api-resource";
import { accentForGuide, findGuide, type GuideAccent } from "@/lib/guides";
import { cn } from "@/lib/utils";

const accentClasses: Record<GuideAccent, string> = {
  buddha: "border-t-guide-buddha text-guide-buddha-ink",
  camus: "border-t-guide-camus text-guide-camus-ink",
  gita: "border-t-guide-gita text-guide-gita-ink",
  marcus: "border-t-guide-marcus text-guide-marcus-ink",
  rumi: "border-t-guide-rumi text-guide-rumi-ink",
};

const guidePresentation: Record<string, {
  heading: string;
  icon: typeof BookOpen;
  label: string;
}> = {
  "bhagavad-gita": { heading: "Purpose in action", icon: BookOpen, label: "Scripture" },
  buddha: { heading: "Awareness in change", icon: Flower2, label: "Dhammapada" },
  "marcus-aurelius": { heading: "Agency under pressure", icon: Landmark, label: "Stoicism" },
  rumi: { heading: "Transformation through longing", icon: MoonStar, label: "Sufi poetry" },
  camus: { heading: "Meaning without certainty", icon: PenLine, label: "Existentialism" },
};

function GuideCard({ guide }: { guide: PublicGuide }) {
  const local = findGuide(guide.slug);
  const accent = accentForGuide(guide);
  const presentation = guidePresentation[guide.slug] ?? {
    heading: guide.name,
    icon: BookOpen,
    label: guide.tradition,
  };
  const Icon = presentation.icon;

  return (
    <Link
      className="group rounded-[var(--radius-card)] focus-visible:ring-3 focus-visible:ring-ring/55"
      href={`/guides/${guide.slug}`}
    >
      <Card
        className={cn(
          "relative h-full min-h-72 overflow-hidden border-t-4 transition-[transform,box-shadow] duration-[var(--motion-fast)] group-hover:-translate-y-1 group-hover:shadow-[var(--shadow-lifted)]",
          accentClasses[accent],
        )}
      >
        <CardHeader className="gap-4">
          <div className="flex items-start justify-between">
            <span className="grid size-12 place-items-center rounded-2xl bg-current/10">
              <Icon aria-hidden="true" className="size-6" />
            </span>
            <ArrowUpRight aria-hidden="true" className="size-5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>
          <div>
            <p className="text-[0.68rem] font-extrabold uppercase tracking-[0.14em]">
              {presentation.label}
            </p>
            <CardTitle className="mt-2 font-serif text-3xl font-medium leading-tight text-foreground">
              {guide.name}
            </CardTitle>
          </div>
          <p className="font-serif text-xl font-medium leading-7 text-foreground">
            {presentation.heading}
          </p>
        </CardHeader>
        <CardContent className="relative mt-auto">
          <p className="max-w-sm leading-6 text-muted-foreground">
            {guide.short_desc ?? local?.shortDescription}
          </p>
          <span aria-hidden="true" className="absolute -bottom-20 -right-16 size-36 rounded-full bg-current/10" />
        </CardContent>
      </Card>
    </Link>
  );
}

export function GuidesExperience() {
  const load = useCallback((signal: AbortSignal) => api.guides.list(signal), []);
  const resource = useApiResource(load);

  if (resource.status === "loading") return <PageSkeleton cards={5} />;
  if (resource.status === "error") {
    return (
      <InlineError
        description={resource.error.message}
        onRetry={resource.retry}
        title="Perspectives unavailable"
      />
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        description="Meet five distinct voices and the questions each is especially equipped to hold."
        eyebrow="Perspectives"
        title="Choose a perspective"
      />
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {resource.data.map((guide) => <GuideCard guide={guide} key={guide.id} />)}
        <Card className="min-h-72 border-dashed bg-card/45 shadow-none">
          <CardContent className="flex h-full flex-col justify-between p-7">
            <span className="grid size-12 place-items-center rounded-2xl bg-muted text-muted-foreground"><Plus aria-hidden="true" className="size-6" /></span>
            <div><p className="text-[0.68rem] font-extrabold uppercase tracking-[0.14em] text-muted-foreground">The collection will grow</p><h2 className="mt-3 font-serif text-3xl font-medium">More perspectives are taking shape.</h2><p className="mt-4 max-w-sm leading-7 text-muted-foreground">New voices will be added carefully, with clear sources and a distinct purpose.</p></div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
