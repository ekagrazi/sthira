import { Router, type Request } from "express";

import { AppError, RequestValidationError } from "../errors/app-error.js";
import { asyncRoute } from "../middleware/async-route.js";
import {
  journalCreateBodySchema,
  journalEntryIdSchema,
  journalListQuerySchema,
  journalUpdateBodySchema,
} from "../schemas/journal.js";
import type { JournalService } from "../services/journal.js";

function userIdFrom(request: Request): string {
  const userId = request.auth?.userId;
  if (!userId) throw new AppError(401, "UNAUTHORIZED", "Unauthorized");
  return userId;
}

export function createJournalRouter(journal: JournalService): Router {
  const router = Router();

  router.get(
    "/",
    asyncRoute(async (request, response) => {
      const parsed = journalListQuerySchema.safeParse(request.query);
      if (!parsed.success) throw new RequestValidationError("Invalid journal query.");
      response.status(200).json(await journal.list(userIdFrom(request), parsed.data));
    }),
  );

  router.post(
    "/",
    asyncRoute(async (request, response) => {
      const parsed = journalCreateBodySchema.safeParse(request.body);
      if (!parsed.success) throw new RequestValidationError("Invalid journal entry.");
      const result = await journal.create(userIdFrom(request), parsed.data);
      response.status(result.created ? 201 : 200).json(result.entry);
    }),
  );

  router.patch(
    "/:id",
    asyncRoute(async (request, response) => {
      const id = journalEntryIdSchema.safeParse(request.params.id);
      const body = journalUpdateBodySchema.safeParse(request.body);
      if (!id.success || !body.success) {
        throw new RequestValidationError("Invalid journal update.");
      }
      response.status(200).json(
        await journal.update(userIdFrom(request), id.data, body.data),
      );
    }),
  );

  router.delete(
    "/:id",
    asyncRoute(async (request, response) => {
      const id = journalEntryIdSchema.safeParse(request.params.id);
      if (!id.success) throw new RequestValidationError("Invalid journal entry ID.");
      await journal.delete(userIdFrom(request), id.data);
      response.status(204).end();
    }),
  );

  return router;
}
