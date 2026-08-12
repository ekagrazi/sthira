import cors, { type CorsOptions } from "cors";
import type { RequestHandler } from "express";

import { AppError } from "../errors/app-error.js";

export function createCorsMiddleware(allowedOrigins: readonly string[]): RequestHandler {
  const allowlist = new Set(allowedOrigins);
  const options: CorsOptions = {
    allowedHeaders: ["Authorization", "Content-Type", "X-Request-Id"],
    credentials: true,
    maxAge: 600,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    origin(origin, callback) {
      if (!origin || allowlist.has(origin)) {
        callback(null, true);
        return;
      }

      callback(new AppError(403, "ORIGIN_NOT_ALLOWED", "Origin not allowed."));
    },
  };

  return cors(options);
}
