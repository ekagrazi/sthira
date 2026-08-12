import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { AccessTokenVerifier } from "../middleware/authenticate.js";
import type { BackendEnv } from "../config/env.js";
import type { Database } from "../types/database.js";

export function createSupabaseAdminClient(
  env: Pick<BackendEnv, "supabaseUrl" | "supabaseSecretKey">,
): SupabaseClient<Database> {
  return createClient<Database>(env.supabaseUrl, env.supabaseSecretKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}

export function createSupabaseTokenVerifier(
  supabase: SupabaseClient<Database>,
): AccessTokenVerifier {
  return async (accessToken) => {
    const { data, error } = await supabase.auth.getUser(accessToken);

    if (error || !data.user) {
      return null;
    }

    return data.user.id;
  };
}
