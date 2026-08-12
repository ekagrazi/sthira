import { Router, type Request } from "express";

import { AppError, RequestValidationError } from "../errors/app-error.js";
import { asyncRoute } from "../middleware/async-route.js";
import {
  moodCheckinBodySchema,
  moodHistoryQuerySchema,
  moodRerollBodySchema,
} from "../schemas/mood.js";
import { uuidSchema } from "../schemas/common.js";
import type { MoodHistoryRange } from "../services/mood-checkins.js";
import type { MoodService } from "../services/mood.js";

const MAX_HISTORY_RANGE_MS = 90 * 24 * 60 * 60 * 1_000;

function userIdFrom(request: Request): string {
  const userId = request.auth?.userId;
  if (!userId) throw new AppError(401, "UNAUTHORIZED", "Unauthorized");
  return userId;
}

export function parseMoodHistoryRange(
  query: unknown,
  now = new Date(),
): MoodHistoryRange {
  const parsed = moodHistoryQuerySchema.safeParse(query);
  if (!parsed.success) {
    throw new RequestValidationError("Invalid mood history query.");
  }

  const to = parsed.data.to ? new Date(parsed.data.to) : now;
  const from = parsed.data.from
    ? new Date(parsed.data.from)
    : new Date(to.getTime() - MAX_HISTORY_RANGE_MS);
  if (to.getTime() < from.getTime() || to.getTime() - from.getTime() > MAX_HISTORY_RANGE_MS) {
    throw new RequestValidationError("Mood history range must not exceed 90 days.");
  }

  if (parsed.data.before) {
    const beforeTime = new Date(parsed.data.before).getTime();
    if (beforeTime <= from.getTime() || beforeTime > to.getTime()) {
      throw new RequestValidationError("Invalid mood history cursor.");
    }
  }

  return {
    ...(parsed.data.before && { before: parsed.data.before }),
    from: from.toISOString(),
    limit: parsed.data.limit,
    to: to.toISOString(),
  };
}

export function createMoodRouter(mood: MoodService): Router {
  const router = Router();

  router.get(
    "/checkins/:checkinId",
    asyncRoute(async (request, response) => {
      const parsedId = uuidSchema.safeParse(request.params.checkinId);
      if (!parsedId.success) {
        throw new RequestValidationError("Invalid mood check-in ID.");
      }

      response.status(200).json(await mood.getResult(userIdFrom(request), parsedId.data));
    }),
  );

  router.post(
    "/checkin",
    asyncRoute(async (request, response) => {
      const parsed = moodCheckinBodySchema.safeParse(request.body);
      if (!parsed.success) {
        throw new RequestValidationError("Invalid mood check-in.");
      }

      response.status(201).json(await mood.checkIn(userIdFrom(request), parsed.data));
    }),
  );

  router.post(
    "/reroll",
    asyncRoute(async (request, response) => {
      const parsed = moodRerollBodySchema.safeParse(request.body);
      if (!parsed.success) {
        throw new RequestValidationError("Invalid mood reroll.");
      }

      response.status(200).json(await mood.reroll(userIdFrom(request), parsed.data));
    }),
  );

  router.get(
    "/history",
    asyncRoute(async (request, response) => {
      const range = parseMoodHistoryRange(request.query);
      response.status(200).json(await mood.history(userIdFrom(request), range));
    }),
  );

  return router;
}
