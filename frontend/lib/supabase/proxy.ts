import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getPublicSupabaseEnv } from "@/lib/env";
import { isProtectedPath } from "@/lib/auth/routes";
import { getSafeReturnPath } from "@/lib/auth/return-path";
import type { Database } from "@/types/database";

const privateHeaders = {
  "Cache-Control": "private, no-store, max-age=0",
  Expires: "0",
  Pragma: "no-cache",
  Vary: "Cookie",
} as const;

function applyPrivateHeaders(response: NextResponse): void {
  Object.entries(privateHeaders).forEach(([name, value]) => {
    response.headers.set(name, value);
  });
}

function copySessionState(source: NextResponse, target: NextResponse): void {
  source.cookies.getAll().forEach((cookie) => target.cookies.set(cookie));

  for (const headerName of ["cache-control", "expires", "pragma", "vary"]) {
    const value = source.headers.get(headerName);
    if (value) {
      target.headers.set(headerName, value);
    }
  }

  applyPrivateHeaders(target);
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const { supabaseUrl, supabasePublishableKey } = getPublicSupabaseEnv();

  const supabase = createServerClient<Database>(
    supabaseUrl,
    supabasePublishableKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          supabaseResponse = NextResponse.next({ request });

          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });

          Object.entries(headers).forEach(([name, value]) => {
            supabaseResponse.headers.set(name, value);
          });
        },
      },
    },
  );

  const { data, error } = await supabase.auth.getClaims();
  const isAuthenticated = !error && typeof data?.claims?.sub === "string";

  if (!isAuthenticated && isProtectedPath(request.nextUrl.pathname)) {
    const loginUrl = request.nextUrl.clone();
    const requestedPath = `${request.nextUrl.pathname}${request.nextUrl.search}`;
    loginUrl.pathname = "/login";
    loginUrl.search = "";
    loginUrl.searchParams.set(
      "next",
      getSafeReturnPath(requestedPath, "/dashboard"),
    );

    const redirectResponse = NextResponse.redirect(loginUrl);
    copySessionState(supabaseResponse, redirectResponse);
    return redirectResponse;
  }

  applyPrivateHeaders(supabaseResponse);
  return supabaseResponse;
}
