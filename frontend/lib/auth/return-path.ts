const INTERNAL_ORIGIN = "https://internal.invalid";

const blockedDestinations = ["/auth", "/login", "/signup"];

export function getSafeReturnPath(
  candidate: string | null | undefined,
  fallback = "/dashboard",
): string {
  if (
    !candidate ||
    !candidate.startsWith("/") ||
    candidate.startsWith("//") ||
    candidate.includes("\\") ||
    /[\u0000-\u001f\u007f]/u.test(candidate)
  ) {
    return fallback;
  }

  try {
    const parsed = new URL(candidate, INTERNAL_ORIGIN);

    if (parsed.origin !== INTERNAL_ORIGIN) {
      return fallback;
    }

    const decodedPath = decodeURIComponent(parsed.pathname);

    if (
      decodedPath.startsWith("//") ||
      decodedPath.includes("\\") ||
      /[\u0000-\u001f\u007f]/u.test(decodedPath)
    ) {
      return fallback;
    }

    if (
      blockedDestinations.some(
        (path) =>
          parsed.pathname === path || parsed.pathname.startsWith(`${path}/`),
      )
    ) {
      return fallback;
    }

    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}
