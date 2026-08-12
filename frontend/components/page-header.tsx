import { cn } from "@/lib/utils";

export function PageHeader({
  className,
  description,
  eyebrow,
  title,
}: {
  className?: string;
  description: string;
  eyebrow?: string;
  title: string;
}) {
  return (
    <header className={cn("max-w-2xl", className)}>
      {eyebrow && (
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          {eyebrow}
        </p>
      )}
      <h1 className="font-serif text-4xl font-medium tracking-[-0.035em] sm:text-5xl">{title}</h1>
      <p className="mt-3 text-base leading-7 text-muted-foreground">{description}</p>
    </header>
  );
}
