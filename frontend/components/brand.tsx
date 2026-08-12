import Link from "next/link";

import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn("relative block size-6 rounded-full border-2 border-[#81786d]", className)}
    >
      <span className="absolute right-[2px] top-[2px] size-2 rounded-full bg-guide-gita" />
    </span>
  );
}

export function Brand({ className, href = "/dashboard" }: { className?: string; href?: string }) {
  return (
    <Link
      className={cn(
        "inline-flex w-fit items-center gap-2 rounded-lg font-bold tracking-[-0.04em] focus-visible:ring-3 focus-visible:ring-ring/55",
        className,
      )}
      href={href}
    >
      <BrandMark />
      Sthira
    </Link>
  );
}
