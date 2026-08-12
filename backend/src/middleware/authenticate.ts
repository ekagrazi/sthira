import type { RequestHandler } from "express";

export type AccessTokenVerifier = (
  accessToken: string,
) => Promise<string | null>;

const bearerPattern = /^Bearer ([^\s,]+)$/u;

export function createAuthenticationMiddleware(
  verifyAccessToken: AccessTokenVerifier,
): RequestHandler {
  return async (request, response, next) => {
    const authorization = request.get("authorization");
    const match = authorization?.match(bearerPattern);

    if (!match?.[1]) {
      response.setHeader("WWW-Authenticate", "Bearer");
      response.status(401).json({ error: "Unauthorized" });
      return;
    }

    try {
      const userId = await verifyAccessToken(match[1]);

      if (!userId) {
        response.setHeader("WWW-Authenticate", "Bearer");
        response.status(401).json({ error: "Unauthorized" });
        return;
      }

      request.auth = { userId };
      next();
    } catch {
      response.setHeader("WWW-Authenticate", "Bearer");
      response.status(401).json({ error: "Unauthorized" });
    }
  };
}
