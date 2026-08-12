import { Router, type Request } from "express";

import { AppError, RequestValidationError } from "../errors/app-error.js";
import { asyncRoute } from "../middleware/async-route.js";
import {
  chatMessageListQuerySchema,
  chatMessageSubmitBodySchema,
  chatSessionCreateBodySchema,
  chatSessionIdSchema,
  chatSessionListQuerySchema,
} from "../schemas/chat.js";
import type { ChatSessionsService } from "../services/chat-sessions.js";

function userIdFrom(request: Request): string {
  const userId = request.auth?.userId;
  if (!userId) throw new AppError(401, "UNAUTHORIZED", "Unauthorized");
  return userId;
}

export function createChatRouter(chat: ChatSessionsService): Router {
  const router = Router();

  router.get(
    "/sessions",
    asyncRoute(async (request, response) => {
      const parsed = chatSessionListQuerySchema.safeParse(request.query);
      if (!parsed.success) {
        throw new RequestValidationError("Invalid conversation query.");
      }
      response.status(200).json(await chat.list(userIdFrom(request), parsed.data));
    }),
  );

  router.post(
    "/sessions",
    asyncRoute(async (request, response) => {
      const parsed = chatSessionCreateBodySchema.safeParse(request.body);
      if (!parsed.success) {
        throw new RequestValidationError("Invalid conversation.");
      }
      response.status(201).json(await chat.create(userIdFrom(request), parsed.data));
    }),
  );

  router.get(
    "/sessions/:id",
    asyncRoute(async (request, response) => {
      const id = chatSessionIdSchema.safeParse(request.params.id);
      if (!id.success) throw new RequestValidationError("Invalid conversation ID.");
      response.status(200).json(await chat.get(userIdFrom(request), id.data));
    }),
  );

  router.get(
    "/sessions/:id/messages",
    asyncRoute(async (request, response) => {
      const id = chatSessionIdSchema.safeParse(request.params.id);
      const query = chatMessageListQuerySchema.safeParse(request.query);
      if (!id.success || !query.success) {
        throw new RequestValidationError("Invalid conversation history query.");
      }
      response.status(200).json(
        await chat.listMessages(userIdFrom(request), id.data, query.data),
      );
    }),
  );

  router.post(
    "/sessions/:id/messages",
    asyncRoute(async (request, response) => {
      const id = chatSessionIdSchema.safeParse(request.params.id);
      const body = chatMessageSubmitBodySchema.safeParse(request.body);
      if (!id.success || !body.success) {
        throw new RequestValidationError("Invalid conversation message.");
      }
      const result = await chat.submitMessage(
        userIdFrom(request),
        id.data,
        body.data,
      );
      response.status(result.status === "complete" ? 201 : 202).json(result);
    }),
  );

  return router;
}
