import { Badge } from "@/components/ui/badge";
import { PassageText, passageKindLabel } from "@/components/passage-text";
import type { PublicQuote } from "@/lib/api/types";
import type { GuideAccent } from "@/lib/guides";
import { cn } from "@/lib/utils";

const accentClasses: Record<GuideAccent, string> = {
  buddha: "border-l-guide-buddha text-guide-buddha-ink",
  camus: "border-l-guide-camus text-guide-camus-ink",
  gita: "border-l-guide-gita text-guide-gita-ink",
  marcus: "border-l-guide-marcus text-guide-marcus-ink",
  rumi: "border-l-guide-rumi text-guide-rumi-ink",
};

export function QuoteCard({
  accent,
  citation,
  className,
  contentType,
  guide,
  text,
}: {
  accent: GuideAccent;
  citation: string;
  className?: string;
  contentType?: PublicQuote["content_type"];
  guide: string;
  text: string;
}) {
  return (
    <figure
      className={cn(
        "page-enter rounded-2xl border border-l-4 bg-card p-6 shadow-[var(--shadow-soft)] sm:p-8",
        accentClasses[accent],
        className,
      )}
    >
      <Badge className="mb-5" variant="muted">
        {guide}
      </Badge>
      <PassageText className="font-serif text-xl italic leading-8 text-foreground sm:text-2xl sm:leading-9" contentType={contentType} text={text} />
      <figcaption className="mt-5 text-sm font-medium text-muted-foreground">
        {passageKindLabel(contentType) ? `${passageKindLabel(contentType)} · ` : ""}{citation}
      </figcaption>
    </figure>
  );
}
