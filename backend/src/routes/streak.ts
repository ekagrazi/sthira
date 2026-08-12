import { Router, type Request } from "express";

import { AppError } from "../errors/app-error.js";
import { asyncRoute } from "../middleware/async-route.js";
import type { StreakSummaryService } from "../services/streaks.js";

function userIdFrom(request: Request): string {
  const userId = request.auth?.userId;
  if (!userId) throw new AppError(401, "UNAUTHORIZED", "Unauthorized");
  return userId;
}

export function createStreakRouter(streaks: StreakSummaryService): Router {
  const router = Router();
  router.get(
    "/",
    asyncRoute(async (request, response) => {
      response.status(200).json(await streaks.get(userIdFrom(request)));
    }),
  );
  return router;
}
