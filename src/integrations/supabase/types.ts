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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      channels: {
        Row: {
          banner_url: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          subscriber_count: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          banner_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          subscriber_count?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          banner_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          subscriber_count?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      claim_requests: {
        Row: {
          amount: number
          created_at: string
          error_message: string | null
          id: string
          processed_at: string | null
          status: string
          tx_hash: string | null
          user_id: string
          wallet_address: string
        }
        Insert: {
          amount: number
          created_at?: string
          error_message?: string | null
          id?: string
          processed_at?: string | null
          status?: string
          tx_hash?: string | null
          user_id: string
          wallet_address: string
        }
        Update: {
          amount?: number
          created_at?: string
          error_message?: string | null
          id?: string
          processed_at?: string | null
          status?: string
          tx_hash?: string | null
          user_id?: string
          wallet_address?: string
        }
        Relationships: []
      }
      comment_logs: {
        Row: {
          comment_id: string
          created_at: string
          id: string
          is_rewarded: boolean
          is_valid: boolean
          user_id: string
          video_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          id?: string
          is_rewarded?: boolean
          is_valid?: boolean
          user_id: string
          video_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          id?: string
          is_rewarded?: boolean
          is_valid?: boolean
          user_id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_logs_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comment_logs_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          content: string
          created_at: string
          id: string
          like_count: number | null
          parent_comment_id: string | null
          updated_at: string
          user_id: string
          video_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          like_count?: number | null
          parent_comment_id?: string | null
          updated_at?: string
          user_id: string
          video_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          like_count?: number | null
          parent_comment_id?: string | null
          updated_at?: string
          user_id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_reward_limits: {
        Row: {
          comment_rewards_earned: number
          created_at: string
          date: string
          id: string
          updated_at: string
          upload_rewards_earned: number
          uploads_count: number
          user_id: string
          view_rewards_earned: number
        }
        Insert: {
          comment_rewards_earned?: number
          created_at?: string
          date?: string
          id?: string
          updated_at?: string
          upload_rewards_earned?: number
          uploads_count?: number
          user_id: string
          view_rewards_earned?: number
        }
        Update: {
          comment_rewards_earned?: number
          created_at?: string
          date?: string
          id?: string
          updated_at?: string
          upload_rewards_earned?: number
          uploads_count?: number
          user_id?: string
          view_rewards_earned?: number
        }
        Relationships: []
      }
      likes: {
        Row: {
          comment_id: string | null
          created_at: string
          id: string
          is_dislike: boolean | null
          user_id: string
          video_id: string | null
        }
        Insert: {
          comment_id?: string | null
          created_at?: string
          id?: string
          is_dislike?: boolean | null
          user_id: string
          video_id?: string | null
        }
        Update: {
          comment_id?: string | null
          created_at?: string
          id?: string
          is_dislike?: boolean | null
          user_id?: string
          video_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "likes_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      meditation_playlist_videos: {
        Row: {
          created_at: string
          id: string
          playlist_id: string
          position: number
          video_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          playlist_id: string
          position?: number
          video_id: string
        }
        Update: {
          created_at?: string
          id?: string
          playlist_id?: string
          position?: number
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meditation_playlist_videos_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "meditation_playlists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meditation_playlist_videos_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      meditation_playlists: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_featured: boolean | null
          name: string
          thumbnail_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_featured?: boolean | null
          name: string
          thumbnail_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_featured?: boolean | null
          name?: string
          thumbnail_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      platform_statistics: {
        Row: {
          active_users: number
          created_at: string
          date: string
          id: string
          total_comments: number
          total_rewards_distributed: number
          total_users: number
          total_videos: number
          total_views: number
          updated_at: string
        }
        Insert: {
          active_users?: number
          created_at?: string
          date?: string
          id?: string
          total_comments?: number
          total_rewards_distributed?: number
          total_users?: number
          total_videos?: number
          total_views?: number
          updated_at?: string
        }
        Update: {
          active_users?: number
          created_at?: string
          date?: string
          id?: string
          total_comments?: number
          total_rewards_distributed?: number
          total_users?: number
          total_videos?: number
          total_views?: number
          updated_at?: string
        }
        Relationships: []
      }
      playlist_videos: {
        Row: {
          created_at: string
          id: string
          playlist_id: string
          position: number
          video_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          playlist_id: string
          position: number
          video_id: string
        }
        Update: {
          created_at?: string
          id?: string
          playlist_id?: string
          position?: number
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "playlist_videos_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "playlists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playlist_videos_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      playlists: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_public: boolean | null
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean | null
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean | null
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      posts: {
        Row: {
          channel_id: string
          comment_count: number | null
          content: string
          created_at: string
          id: string
          image_url: string | null
          is_public: boolean | null
          like_count: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          channel_id: string
          comment_count?: number | null
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_public?: boolean | null
          like_count?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          channel_id?: string
          comment_count?: number | null
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_public?: boolean | null
          like_count?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          background_music_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          id: string
          music_enabled: boolean | null
          music_url: string | null
          total_camly_rewards: number
          updated_at: string
          username: string
          wallet_address: string | null
          wallet_type: string | null
        }
        Insert: {
          avatar_url?: string | null
          background_music_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          music_enabled?: boolean | null
          music_url?: string | null
          total_camly_rewards?: number
          updated_at?: string
          username: string
          wallet_address?: string | null
          wallet_type?: string | null
        }
        Update: {
          avatar_url?: string | null
          background_music_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          music_enabled?: boolean | null
          music_url?: string | null
          total_camly_rewards?: number
          updated_at?: string
          username?: string
          wallet_address?: string | null
          wallet_type?: string | null
        }
        Relationships: []
      }
      reward_settings: {
        Row: {
          created_at: string
          id: string
          min_watch_percentage: number
          reward_amount: number
          reward_enabled: boolean
          reward_token: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          min_watch_percentage?: number
          reward_amount?: number
          reward_enabled?: boolean
          reward_token?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          min_watch_percentage?: number
          reward_amount?: number
          reward_enabled?: boolean
          reward_token?: string
          updated_at?: string
        }
        Relationships: []
      }
      reward_transactions: {
        Row: {
          amount: number
          claim_tx_hash: string | null
          claimed: boolean
          claimed_at: string | null
          created_at: string
          id: string
          reward_type: string
          status: string
          tx_hash: string | null
          user_id: string
          video_id: string | null
        }
        Insert: {
          amount: number
          claim_tx_hash?: string | null
          claimed?: boolean
          claimed_at?: string | null
          created_at?: string
          id?: string
          reward_type: string
          status?: string
          tx_hash?: string | null
          user_id: string
          video_id?: string | null
        }
        Update: {
          amount?: number
          claim_tx_hash?: string | null
          claimed?: boolean
          claimed_at?: string | null
          created_at?: string
          id?: string
          reward_type?: string
          status?: string
          tx_hash?: string | null
          user_id?: string
          video_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reward_transactions_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          channel_id: string
          created_at: string
          id: string
          subscriber_id: string
        }
        Insert: {
          channel_id: string
          created_at?: string
          id?: string
          subscriber_id: string
        }
        Update: {
          channel_id?: string
          created_at?: string
          id?: string
          subscriber_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      video_migrations: {
        Row: {
          completed_at: string | null
          created_at: string
          error_message: string | null
          id: string
          new_thumbnail_url: string | null
          new_video_url: string | null
          original_thumbnail_url: string | null
          original_video_url: string
          status: string
          video_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          new_thumbnail_url?: string | null
          new_video_url?: string | null
          original_thumbnail_url?: string | null
          original_video_url: string
          status?: string
          video_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          new_thumbnail_url?: string | null
          new_video_url?: string | null
          original_thumbnail_url?: string | null
          original_video_url?: string
          status?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_migrations_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: true
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      video_watch_progress: {
        Row: {
          created_at: string
          id: string
          last_position_seconds: number | null
          rewarded: boolean
          updated_at: string
          user_id: string
          video_id: string
          watch_percentage: number
        }
        Insert: {
          created_at?: string
          id?: string
          last_position_seconds?: number | null
          rewarded?: boolean
          updated_at?: string
          user_id: string
          video_id: string
          watch_percentage?: number
        }
        Update: {
          created_at?: string
          id?: string
          last_position_seconds?: number | null
          rewarded?: boolean
          updated_at?: string
          user_id?: string
          video_id?: string
          watch_percentage?: number
        }
        Relationships: [
          {
            foreignKeyName: "video_watch_progress_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      videos: {
        Row: {
          category: string | null
          channel_id: string
          comment_count: number | null
          created_at: string
          description: string | null
          dislike_count: number | null
          duration: number | null
          file_size: number | null
          id: string
          is_public: boolean | null
          like_count: number | null
          thumbnail_url: string | null
          title: string
          updated_at: string
          user_id: string
          video_url: string
          view_count: number | null
        }
        Insert: {
          category?: string | null
          channel_id: string
          comment_count?: number | null
          created_at?: string
          description?: string | null
          dislike_count?: number | null
          duration?: number | null
          file_size?: number | null
          id?: string
          is_public?: boolean | null
          like_count?: number | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          user_id: string
          video_url: string
          view_count?: number | null
        }
        Update: {
          category?: string | null
          channel_id?: string
          comment_count?: number | null
          created_at?: string
          description?: string | null
          dislike_count?: number | null
          duration?: number | null
          file_size?: number | null
          id?: string
          is_public?: boolean | null
          like_count?: number | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          video_url?: string
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "videos_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
        ]
      }
      view_logs: {
        Row: {
          created_at: string
          id: string
          is_valid: boolean
          session_id: string | null
          user_id: string
          video_duration_seconds: number | null
          video_id: string
          watch_percentage: number
          watch_time_seconds: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_valid?: boolean
          session_id?: string | null
          user_id: string
          video_duration_seconds?: number | null
          video_id: string
          watch_percentage?: number
          watch_time_seconds?: number
        }
        Update: {
          created_at?: string
          id?: string
          is_valid?: boolean
          session_id?: string | null
          user_id?: string
          video_duration_seconds?: number | null
          video_id?: string
          watch_percentage?: number
          watch_time_seconds?: number
        }
        Relationships: [
          {
            foreignKeyName: "view_logs_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_transactions: {
        Row: {
          amount: number
          created_at: string
          from_address: string
          from_user_id: string | null
          id: string
          status: string
          to_address: string
          to_user_id: string | null
          token_type: string
          tx_hash: string
          video_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          from_address: string
          from_user_id?: string | null
          id?: string
          status?: string
          to_address: string
          to_user_id?: string | null
          token_type: string
          tx_hash: string
          video_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          from_address?: string
          from_user_id?: string | null
          id?: string
          status?: string
          to_address?: string
          to_user_id?: string | null
          token_type?: string
          tx_hash?: string
          video_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      watch_history: {
        Row: {
          completed: boolean | null
          id: string
          last_position_seconds: number | null
          user_id: string
          video_id: string
          watch_time_seconds: number | null
          watched_at: string
        }
        Insert: {
          completed?: boolean | null
          id?: string
          last_position_seconds?: number | null
          user_id: string
          video_id: string
          watch_time_seconds?: number | null
          watched_at?: string
        }
        Update: {
          completed?: boolean | null
          id?: string
          last_position_seconds?: number | null
          user_id?: string
          video_id?: string
          watch_time_seconds?: number | null
          watched_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "watch_history_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      watch_later: {
        Row: {
          added_at: string
          id: string
          user_id: string
          video_id: string
        }
        Insert: {
          added_at?: string
          id?: string
          user_id: string
          video_id: string
        }
        Update: {
          added_at?: string
          id?: string
          user_id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "watch_later_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
