import { Router } from "express";

import { RequestValidationError } from "../errors/app-error.js";
import { asyncRoute } from "../middleware/async-route.js";
import { wisdomQuerySchema } from "../schemas/wisdom.js";
import type { QuoteMatchingService } from "../services/quote-matching.js";
import type { WisdomResponse } from "../types/api.js";

export function createWisdomRouter(quotes: QuoteMatchingService): Router {
  const router = Router();

  router.get(
    "/",
    asyncRoute(async (request, response) => {
      const parsed = wisdomQuerySchema.safeParse(request.query);
      if (!parsed.success) throw new RequestValidationError("Invalid wisdom query.");
      const wisdom = parsed.data.guide_slug
        ? [await quotes.match({ guideSlug: parsed.data.guide_slug })]
        : await quotes.wisdom(parsed.data.limit);
      const body: WisdomResponse = { wisdom };
      response.status(200).json(body);
    }),
  );

  return router;
}
