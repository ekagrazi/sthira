import { Router } from "express";

import { RequestValidationError, ResourceNotFoundError } from "../errors/app-error.js";
import { asyncRoute } from "../middleware/async-route.js";
import { guideSlugSchema } from "../schemas/common.js";
import type { GuidesService } from "../services/guides.js";

export function createGuidesRouter(guides: GuidesService): Router {
  const router = Router();

  router.get(
    "/",
    asyncRoute(async (_request, response) => {
      response.status(200).json(await guides.list());
    }),
  );

  router.get(
    "/:slug",
    asyncRoute(async (request, response) => {
      const result = guideSlugSchema.safeParse(request.params.slug);
      if (!result.success) {
        throw new RequestValidationError("Invalid guide slug.");
      }

      const guide = await guides.findBySlug(result.data);
      if (!guide) {
        throw new ResourceNotFoundError("Guide not found.");
      }

      response.status(200).json(guide);
    }),
  );

  return router;
}
