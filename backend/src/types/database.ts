export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      chat_messages: {
        Row: {
          client_action_id: string | null
          content: string
          created_at: string
          id: string
          reply_to_message_id: string | null
          response_started_at: string | null
          response_status: string | null
          role: string
          session_id: string
        }
        Insert: {
          client_action_id?: string | null
          content: string
          created_at?: string
          id?: string
          reply_to_message_id?: string | null
          response_started_at?: string | null
          response_status?: string | null
          role: string
          session_id: string
        }
        Update: {
          client_action_id?: string | null
          content?: string
          created_at?: string
          id?: string
          reply_to_message_id?: string | null
          response_started_at?: string | null
          response_status?: string | null
          role?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_reply_to_message_id_fkey"
            columns: ["reply_to_message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_sessions: {
        Row: {
          created_at: string
          guide_id: string | null
          id: string
          mode: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          guide_id?: string | null
          id?: string
          mode?: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          guide_id?: string | null
          id?: string
          mode?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_sessions_guide_id_fkey"
            columns: ["guide_id"]
            isOneToOne: false
            referencedRelation: "guides"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      guides: {
        Row: {
          accent_color: string | null
          created_at: string
          icon: string | null
          id: string
          name: string
          short_desc: string | null
          slug: string
          system_prompt: string | null
          tradition: string
        }
        Insert: {
          accent_color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          name: string
          short_desc?: string | null
          slug: string
          system_prompt?: string | null
          tradition: string
        }
        Update: {
          accent_color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
          short_desc?: string | null
          slug?: string
          system_prompt?: string | null
          tradition?: string
        }
        Relationships: []
      }
      journal_entries: {
        Row: {
          checkin_id: string | null
          created_at: string
          id: string
          personal_note: string | null
          quote_id: string
          tags: string[]
          user_id: string
        }
        Insert: {
          checkin_id?: string | null
          created_at?: string
          id?: string
          personal_note?: string | null
          quote_id: string
          tags?: string[]
          user_id: string
        }
        Update: {
          checkin_id?: string | null
          created_at?: string
          id?: string
          personal_note?: string | null
          quote_id?: string
          tags?: string[]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "journal_entries_checkin_id_fkey"
            columns: ["checkin_id"]
            isOneToOne: false
            referencedRelation: "mood_checkins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entries_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mood_checkins: {
        Row: {
          created_at: string
          detected_theme: string | null
          free_text: string | null
          id: string
          matched_guide_id: string | null
          matched_quote_id: string | null
          mood_emoji: string | null
          mood_label: string | null
          sentiment_score: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          detected_theme?: string | null
          free_text?: string | null
          id?: string
          matched_guide_id?: string | null
          matched_quote_id?: string | null
          mood_emoji?: string | null
          mood_label?: string | null
          sentiment_score?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          detected_theme?: string | null
          free_text?: string | null
          id?: string
          matched_guide_id?: string | null
          matched_quote_id?: string | null
          mood_emoji?: string | null
          mood_label?: string | null
          sentiment_score?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mood_checkins_matched_guide_id_fkey"
            columns: ["matched_guide_id"]
            isOneToOne: false
            referencedRelation: "guides"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mood_checkins_matched_quote_id_fkey"
            columns: ["matched_quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mood_checkins_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          onboarded: boolean
          onboarding_intent: string | null
          timezone: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          onboarded?: boolean
          onboarding_intent?: string | null
          timezone?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          onboarded?: boolean
          onboarding_intent?: string | null
          timezone?: string
        }
        Relationships: []
      }
      quotes: {
        Row: {
          archived_at: string | null
          citation: string | null
          content_type: "direct_quote" | "paraphrase" | "source_based_reflection"
          created_at: string
          guide_id: string
          id: string
          mood_tags: string[]
          rights_basis: string | null
          source_url: string | null
          source_work: string | null
          text: string
          themes: string[]
          translator: string | null
        }
        Insert: {
          archived_at?: string | null
          citation?: string | null
          content_type?: "direct_quote" | "paraphrase" | "source_based_reflection"
          created_at?: string
          guide_id: string
          id?: string
          mood_tags?: string[]
          rights_basis?: string | null
          source_url?: string | null
          source_work?: string | null
          text: string
          themes?: string[]
          translator?: string | null
        }
        Update: {
          archived_at?: string | null
          citation?: string | null
          content_type?: "direct_quote" | "paraphrase" | "source_based_reflection"
          created_at?: string
          guide_id?: string
          id?: string
          mood_tags?: string[]
          rights_basis?: string | null
          source_url?: string | null
          source_work?: string | null
          text?: string
          themes?: string[]
          translator?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotes_guide_id_fkey"
            columns: ["guide_id"]
            isOneToOne: false
            referencedRelation: "guides"
            referencedColumns: ["id"]
          },
        ]
      }
      user_streaks: {
        Row: {
          current_streak: number
          last_checkin_date: string | null
          longest_streak: number
          user_id: string
        }
        Insert: {
          current_streak?: number
          last_checkin_date?: string | null
          longest_streak?: number
          user_id: string
        }
        Update: {
          current_streak?: number
          last_checkin_date?: string | null
          longest_streak?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_streaks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_insights: {
        Args: { p_from: string; p_to: string; p_user_id: string }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
