import Link from "next/link";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function EmptyState({
  action,
  className,
  description,
  icon,
  title,
}: {
  action?: { href: string; label: string };
  className?: string;
  description: string;
  icon?: React.ReactNode;
  title: string;
}) {
  return (
    <section
      className={cn(
        "flex min-h-56 flex-col items-center justify-center rounded-2xl border border-dashed bg-card/65 px-5 py-10 text-center",
        className,
      )}
    >
      {icon && (
        <div className="mb-4 grid size-11 place-items-center rounded-xl bg-muted text-muted-foreground">
          {icon}
        </div>
      )}
      <h2 className="text-base font-semibold">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
      {action && (
        <Button asChild className="mt-5" variant="outline">
          <Link href={action.href}>{action.label}</Link>
        </Button>
      )}
    </section>
  );
}
