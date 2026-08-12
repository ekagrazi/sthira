import type { ErrorRequestHandler, RequestHandler } from "express";

import { AppError } from "../errors/app-error.js";
import type { ApiErrorResponse } from "../types/api.js";

type BodyParserError = Error & {
  status?: number;
  type?: string;
};

function mapError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    const parserError = error as BodyParserError;

    if (parserError.type === "entity.too.large" || parserError.status === 413) {
      return new AppError(413, "REQUEST_BODY_TOO_LARGE", "Request body too large.");
    }

    if (parserError.type === "entity.parse.failed") {
      return new AppError(400, "INVALID_JSON", "Invalid JSON body.");
    }
  }

  return new AppError(500, "INTERNAL_ERROR", "Internal server error.");
}

export const notFoundHandler: RequestHandler = (_request, response) => {
  const body: ApiErrorResponse = { error: "Not found." };
  response.status(404).json(body);
};

export const errorHandler: ErrorRequestHandler = (
  error,
  _request,
  response,
  _next,
) => {
  void _next;
  const mappedError = mapError(error);
  const body: ApiErrorResponse = { error: mappedError.message };
  response.status(mappedError.statusCode).json(body);
};
