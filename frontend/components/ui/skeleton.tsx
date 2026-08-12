import * as React from "react";

import { cn } from "@/lib/utils";

export function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "rounded-lg bg-[color-mix(in_srgb,var(--muted-foreground)_14%,var(--muted))] [animation:skeleton-pulse_1.7s_ease-in-out_infinite]",
        className,
      )}
      {...props}
    />
  );
}
