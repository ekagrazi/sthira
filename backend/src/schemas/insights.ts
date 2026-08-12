import { z } from "zod";

const insightsQuerySchema = z
  .object({
    from: z.iso.datetime({ offset: true }).optional(),
    to: z.iso.datetime({ offset: true }).optional(),
  })
  .strict();

export type InsightsRange = {
  from: string;
  to: string;
};

export function parseInsightsRange(
  query: unknown,
  now = new Date(),
): InsightsRange {
  const parsed = insightsQuerySchema.safeParse(query);
  if (!parsed.success) throw new Error("Invalid insights range.");

  const to = parsed.data.to ? new Date(parsed.data.to) : now;
  const from = parsed.data.from
    ? new Date(parsed.data.from)
    : new Date(to.getTime() - 90 * 24 * 60 * 60 * 1_000);
  const rangeMilliseconds = to.getTime() - from.getTime();
  if (rangeMilliseconds < 0 || rangeMilliseconds > 90 * 24 * 60 * 60 * 1_000) {
    throw new Error("Invalid insights range.");
  }
  return { from: from.toISOString(), to: to.toISOString() };
}
