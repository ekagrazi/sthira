import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function PageSkeleton({ cards = 2 }: { cards?: number }) {
  return (
    <div aria-busy="true" aria-label="Loading page" className="space-y-8" role="status">
      <span className="sr-only">Loading…</span>
      <div className="space-y-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-9 w-3/5 max-w-md" />
        <Skeleton className="h-5 w-full max-w-xl" />
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        {Array.from({ length: cards }, (_, index) => (
          <Card key={index}>
            <CardHeader>
              <Skeleton className="size-10 rounded-xl" />
              <Skeleton className="mt-3 h-5 w-2/5" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function QuoteSkeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("rounded-2xl border bg-card p-6 sm:p-8", className)}
    >
      <Skeleton className="h-6 w-28 rounded-full" />
      <Skeleton className="mt-6 h-7 w-full" />
      <Skeleton className="mt-3 h-7 w-5/6" />
      <Skeleton className="mt-6 h-4 w-36" />
    </div>
  );
}
