export class AppError extends Error {
  readonly code: string;
  readonly statusCode: number;

  constructor(statusCode: number, code: string, publicMessage: string) {
    super(publicMessage);
    this.name = "AppError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

export class RequestValidationError extends AppError {
  constructor(publicMessage = "Invalid request.") {
    super(400, "REQUEST_VALIDATION_FAILED", publicMessage);
  }
}

export class ResourceNotFoundError extends AppError {
  constructor(publicMessage = "Not found.") {
    super(404, "RESOURCE_NOT_FOUND", publicMessage);
  }
}

export class DependencyUnavailableError extends AppError {
  constructor(publicMessage = "Service temporarily unavailable.") {
    super(503, "DEPENDENCY_UNAVAILABLE", publicMessage);
  }
}
