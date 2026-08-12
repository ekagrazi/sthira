import { Router, type Request } from "express";

import { AppError, RequestValidationError } from "../errors/app-error.js";
import { asyncRoute } from "../middleware/async-route.js";
import { parseInsightsRange } from "../schemas/insights.js";
import type { InsightsService } from "../services/insights.js";

function userIdFrom(request: Request): string {
  const userId = request.auth?.userId;
  if (!userId) throw new AppError(401, "UNAUTHORIZED", "Unauthorized");
  return userId;
}

export function createInsightsRouter(insights: InsightsService): Router {
  const router = Router();
  router.get(
    "/",
    asyncRoute(async (request, response) => {
      let range;
      try {
        range = parseInsightsRange(request.query);
      } catch {
        throw new RequestValidationError("Invalid insights range.");
      }
      response.status(200).json(await insights.get(userIdFrom(request), range));
    }),
  );
  return router;
}
