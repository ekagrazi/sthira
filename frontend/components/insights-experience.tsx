"use client";

import { ChartNoAxesColumnIncreasing, Flame, Library, Sparkles } from "lucide-react";
import dynamic from "next/dynamic";
import { Component, type ReactNode, useCallback } from "react";

import { EmptyState } from "@/components/empty-state";
import { InlineError } from "@/components/inline-error";
import { PageSkeleton } from "@/components/loading-skeleton";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api/client";
import { useApiResource } from "@/lib/api/use-api-resource";

const InsightsCharts = dynamic(
  () => import("@/components/insights-charts").then((module) => module.InsightsCharts),
  {
    loading: () => (
      <div aria-label="Loading charts" className="grid gap-5 md:grid-cols-2" role="status">
        <Skeleton className="h-80 rounded-2xl" />
        <Skeleton className="h-80 rounded-2xl" />
        <Skeleton className="h-56 rounded-2xl md:col-span-2" />
      </div>
    ),
  },
);

class InsightsChartsBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return (
        <InlineError
          description="Your summary is still available while the charts reconnect."
          onRetry={() => this.setState({ failed: false })}
          title="Charts unavailable"
        />
      );
    }
    return this.props.children;
  }
}

export function InsightsExperience() {
  const load = useCallback((signal: AbortSignal) => api.insights.get(signal), []);
  const resource = useApiResource(load);

  if (resource.status === "loading") return <PageSkeleton cards={4} />;
  if (resource.status === "error") {
    return <InlineError description={resource.error.message} onRetry={resource.retry} title="Insights unavailable" />;
  }

  const data = resource.data;
  if (data.summary.total_checkins === 0) {
    return (
      <div className="space-y-8">
        <PageHeader
          description="See how moods, themes, and chosen perspectives move across time."
          eyebrow="Patterns"
          title="Your insights"
        />
        <EmptyState
          action={{ href: "/dashboard", label: "Start a check-in" }}
          description="Your patterns will take shape as you record check-ins and save reflections."
          icon={<ChartNoAxesColumnIncreasing aria-hidden="true" className="size-5" />}
          title="No patterns yet"
        />
      </div>
    );
  }

  const stats = [
    { icon: Sparkles, label: "Check-ins", value: data.summary.total_checkins },
    { icon: Flame, label: "Current streak", value: `${data.summary.current_streak} days` },
    { icon: Flame, label: "Longest streak", value: `${data.summary.longest_streak} days` },
    { icon: Library, label: "Top perspective", value: data.summary.top_guide?.name ?? "Not enough data" },
  ];

  const leadingTheme = data.theme_counts[0]?.theme;

  return (
    <div className="space-y-8">
      <PageHeader
        description="Patterns are descriptions, not verdicts. Use them as invitations to notice."
        eyebrow="Your patterns"
        title="A gentler view of change"
      />
      <Card className="overflow-hidden border-0">
        <div className="grid md:grid-cols-[1.25fr_1fr]">
          <div className="bg-guide-buddha-ink p-7 text-white sm:p-9">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/65">What stands out</p>
            <h2 className="mt-5 font-serif text-3xl font-medium leading-tight">
              {leadingTheme ? `${leadingTheme[0]?.toUpperCase()}${leadingTheme.slice(1)} appears most often in your recent reflections.` : "Your reflection rhythm is beginning to take shape."}
            </h2>
            <p className="mt-4 text-sm leading-7 text-white/68">These patterns describe what has been present. They do not rank your days or define what comes next.</p>
          </div>
          <div className="grid grid-cols-2 bg-card sm:grid-cols-3 md:grid-cols-1 lg:grid-cols-3">
            {stats.slice(0, 3).map(({ label, value }) => <div className="flex min-h-28 flex-col justify-center border-b border-r p-5 last:border-r-0 md:border-r-0 lg:border-b-0 lg:border-r" key={label}><strong className="font-serif text-3xl font-medium">{value}</strong><span className="mt-2 text-xs text-muted-foreground">{label}</span></div>)}
          </div>
        </div>
      </Card>
      <div className="grid gap-5 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Most active weekday</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{data.summary.most_active_weekday ?? "Not enough data"}</p>
            <p className="mt-2 text-sm text-muted-foreground">Based on check-ins in your profile timezone.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Top themes</CardTitle></CardHeader>
          <CardContent>
            {data.theme_counts.length === 0 ? (
              <p className="text-sm text-muted-foreground">Themes appear after more detailed check-ins.</p>
            ) : (
              <ol className="space-y-3">
                {data.theme_counts.slice(0, 5).map((theme) => (
                  <li className="flex items-center justify-between gap-4" key={theme.theme}>
                    <span className="capitalize">{theme.theme}</span>
                    <span className="font-semibold">{theme.count}</span>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      </div>

      <InsightsChartsBoundary>
        <InsightsCharts data={data} />
      </InsightsChartsBoundary>
    </div>
  );
}
