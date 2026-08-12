import { randomUUID } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";

import type pino from "pino";
import { pinoHttp } from "pino-http";

const requestIdPattern = /^[A-Za-z0-9_-]{8,64}$/u;

export function createHttpLoggingMiddleware(logger: pino.Logger) {
  return pinoHttp({
    customAttributeKeys: {
      responseTime: "durationMs",
    },
    customProps(request) {
      return { requestId: request.id };
    },
    customErrorMessage: () => "request completed",
    customLogLevel(_request, response, error) {
      if (error || response.statusCode >= 500) return "error";
      if (response.statusCode >= 400) return "warn";
      return "info";
    },
    customSuccessMessage: () => "request completed",
    genReqId(request, response) {
      const suppliedId = request.headers["x-request-id"];
      const requestId =
        typeof suppliedId === "string" && requestIdPattern.test(suppliedId)
          ? suppliedId
          : randomUUID();
      response.setHeader("X-Request-Id", requestId);
      return requestId;
    },
    logger,
    serializers: {
      req(request: IncomingMessage) {
        const path = new URL(request.url ?? "/", "http://localhost").pathname;
        return { method: request.method, path };
      },
      res(response: ServerResponse) {
        return { statusCode: response.statusCode };
      },
    },
    wrapSerializers: false,
  });
}
