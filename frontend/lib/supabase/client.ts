import { createBrowserClient } from "@supabase/ssr";

import { getPublicSupabaseEnv } from "@/lib/env";
import type { Database } from "@/types/database";

export function createClient() {
  const { supabaseUrl, supabasePublishableKey } = getPublicSupabaseEnv();

  return createBrowserClient<Database>(supabaseUrl, supabasePublishableKey);
}
