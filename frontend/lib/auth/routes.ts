export const protectedRoutePrefixes = [
  "/dashboard",
  "/onboarding",
  "/journal",
  "/insights",
  "/guides",
  "/chat",
  "/mood",
] as const;

export function isProtectedPath(pathname: string): boolean {
  return protectedRoutePrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function isAuthenticationPath(pathname: string): boolean {
  return (
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname.startsWith("/auth/")
  );
}
