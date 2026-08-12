import { Skeleton } from "@/components/ui/skeleton";

export default function OnboardingLoading() {
  return (
    <main aria-busy="true" aria-label="Loading onboarding" className="relative mx-auto w-full max-w-3xl" role="status">
      <span className="sr-only">Loading…</span>
      <div className="rounded-2xl border bg-card p-6 shadow-[var(--shadow-soft)] sm:p-9">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="mt-4 h-8 w-3/5" />
        <Skeleton className="mt-3 h-5 w-full max-w-md" />
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton className="h-28" key={index} />
          ))}
        </div>
      </div>
    </main>
  );
}
