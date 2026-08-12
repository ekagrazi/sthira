import { type NextRequest, NextResponse } from "next/server";

import { getSafeReturnPath } from "@/lib/auth/return-path";
import { getPostAuthenticationPath } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

function privateRedirect(request: NextRequest, pathname: string) {
  const response = NextResponse.redirect(new URL(pathname, request.url));
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  response.headers.set("Expires", "0");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Vary", "Cookie");
  return response;
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const flowId = request.nextUrl.searchParams.get("sb_flow_id");
  const requestedPath = getSafeReturnPath(
    request.nextUrl.searchParams.get("next"),
  );

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(
      code,
      flowId ? { flowId } : undefined,
    );

    if (!error && data.user) {
      const destination = await getPostAuthenticationPath(
        supabase,
        data.user.id,
        requestedPath,
      );
      return privateRedirect(request, destination);
    }
  }

  const loginPath = new URL("/login", request.url);
  loginPath.searchParams.set("error", "oauth_callback");
  loginPath.searchParams.set("next", requestedPath);
  return privateRedirect(request, `${loginPath.pathname}${loginPath.search}`);
}
