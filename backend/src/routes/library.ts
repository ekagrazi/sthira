import { Router, type Request } from "express";

import { AppError, RequestValidationError } from "../errors/app-error.js";
import { asyncRoute } from "../middleware/async-route.js";
import { libraryListQuerySchema } from "../schemas/library.js";
import type { LibraryService } from "../services/library.js";

function userIdFrom(request: Request): string {
  const userId = request.auth?.userId;
  if (!userId) throw new AppError(401, "UNAUTHORIZED", "Unauthorized");
  return userId;
}

export function createLibraryRouter(library: LibraryService): Router {
  const router = Router();

  router.get(
    "/",
    asyncRoute(async (request, response) => {
      const parsed = libraryListQuerySchema.safeParse(request.query);
      if (!parsed.success) {
        throw new RequestValidationError("Invalid library query.");
      }
      response.status(200).json(await library.list(userIdFrom(request), parsed.data));
    }),
  );

  return router;
}
