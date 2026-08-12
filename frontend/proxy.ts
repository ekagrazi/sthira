import type { NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    "/login/:path*",
    "/signup/:path*",
    "/auth/:path*",
    "/dashboard/:path*",
    "/onboarding/:path*",
    "/journal/:path*",
    "/insights/:path*",
    "/guides/:path*",
    "/chat/:path*",
    "/mood/:path*",
  ],
};
