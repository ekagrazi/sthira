import type { SupabaseClient } from "@supabase/supabase-js";

import { DependencyUnavailableError } from "../errors/app-error.js";
import type { Database } from "../types/database.js";
import type { PublicGuide } from "../types/api.js";

const publicGuideFields =
  "id, name, slug, tradition, short_desc, accent_color, icon" as const;
const publicGuideLimit = 20;

export interface GuidesService {
  findById(id: string): Promise<PublicGuide | null>;
  findBySlug(slug: string): Promise<PublicGuide | null>;
  list(): Promise<PublicGuide[]>;
}

export function createSupabaseGuidesService(
  supabase: SupabaseClient<Database>,
): GuidesService {
  return {
    async findById(id) {
      const { data, error } = await supabase
        .from("guides")
        .select(publicGuideFields)
        .eq("id", id)
        .limit(1)
        .maybeSingle();

      if (error) {
        throw new DependencyUnavailableError("Guides are temporarily unavailable.");
      }

      return data;
    },
    async findBySlug(slug) {
      const { data, error } = await supabase
        .from("guides")
        .select(publicGuideFields)
        .eq("slug", slug)
        .limit(1)
        .maybeSingle();

      if (error) {
        throw new DependencyUnavailableError("Guides are temporarily unavailable.");
      }

      return data;
    },
    async list() {
      const { data, error } = await supabase
        .from("guides")
        .select(publicGuideFields)
        .order("name", { ascending: true })
        .limit(publicGuideLimit);

      if (error) {
        throw new DependencyUnavailableError("Guides are temporarily unavailable.");
      }

      return data;
    },
  };
}
