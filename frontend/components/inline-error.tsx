import { CircleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function InlineError({
  className,
  description = "We could not load this section.",
  onRetry,
  title = "Something interrupted the page",
}: {
  className?: string;
  description?: string;
  onRetry?: () => void;
  title?: string;
}) {
  return (
    <div
      className={cn("rounded-2xl border border-destructive/25 bg-destructive/5 p-5", className)}
      role="alert"
    >
      <div className="flex gap-3">
        <CircleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-destructive" />
        <div className="min-w-0">
          <h2 className="font-semibold">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
          {onRetry && (
            <Button className="mt-4" onClick={onRetry} size="sm" variant="outline">
              Try again
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
