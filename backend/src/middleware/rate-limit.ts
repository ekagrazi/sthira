import type { Request, RequestHandler } from "express";

import type { ApiErrorResponse } from "../types/api.js";

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

export type RateLimitOptions = {
  key: (request: Request) => string | null;
  maxEntries?: number;
  maxRequests: number;
  now?: () => number;
  windowMs: number;
};

export function createRateLimitMiddleware({
  key,
  maxEntries = 5_000,
  maxRequests,
  now = Date.now,
  windowMs,
}: RateLimitOptions): RequestHandler {
  const entries = new Map<string, RateLimitEntry>();
  let requestsSinceSweep = 0;

  function sweepExpired(currentTime: number): void {
    requestsSinceSweep += 1;
    if (requestsSinceSweep < 100 && entries.size < maxEntries) {
      return;
    }

    requestsSinceSweep = 0;
    let inspected = 0;
    for (const [entryKey, entry] of entries) {
      if (entry.resetAt <= currentTime) {
        entries.delete(entryKey);
      }

      inspected += 1;
      if (inspected >= 100) {
        break;
      }
    }
  }

  return (request, response, next) => {
    const currentTime = now();
    sweepExpired(currentTime);
    const requestKey = key(request);

    if (!requestKey) {
      next();
      return;
    }

    let entry = entries.get(requestKey);
    if (!entry || entry.resetAt <= currentTime) {
      if (!entry && entries.size >= maxEntries) {
        const body: ApiErrorResponse = { error: "Too many requests." };
        response.status(429).json(body);
        return;
      }

      entry = { count: 0, resetAt: currentTime + windowMs };
      entries.set(requestKey, entry);
    }

    entry.count += 1;
    const remaining = Math.max(0, maxRequests - entry.count);
    const resetSeconds = Math.max(1, Math.ceil((entry.resetAt - currentTime) / 1_000));

    response.setHeader("RateLimit-Limit", String(maxRequests));
    response.setHeader("RateLimit-Remaining", String(remaining));
    response.setHeader("RateLimit-Reset", String(resetSeconds));

    if (entry.count > maxRequests) {
      response.setHeader("Retry-After", String(resetSeconds));
      const body: ApiErrorResponse = { error: "Too many requests." };
      response.status(429).json(body);
      return;
    }

    next();
  };
}
