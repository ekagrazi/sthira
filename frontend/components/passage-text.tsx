import type { PublicQuote } from "@/lib/api/types";
import { cn } from "@/lib/utils";

export function passageKindLabel(contentType: PublicQuote["content_type"]): string | null {
  if (contentType === "paraphrase") return "Paraphrase";
  if (contentType === "source_based_reflection") return "Source-based reflection";
  return null;
}

export function PassageText({
  className,
  contentType,
  text,
}: {
  className?: string;
  contentType: PublicQuote["content_type"];
  text: string;
}) {
  if (contentType && contentType !== "direct_quote") {
    return <p className={cn(className, "not-italic")}>{text}</p>;
  }

  return <blockquote className={className}>“{text}”</blockquote>;
}
