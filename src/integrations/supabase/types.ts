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
      admin_rate_limits: {
        Row: {
          action: string
          admin_id: string
          id: string
          request_count: number | null
          window_start: string
        }
        Insert: {
          action: string
          admin_id: string
          id?: string
          request_count?: number | null
          window_start?: string
        }
        Update: {
          action?: string
          admin_id?: string
          id?: string
          request_count?: number | null
          window_start?: string
        }
        Relationships: []
      }
      ai_generated_music: {
        Row: {
          audio_url: string | null
          created_at: string
          duration: number | null
          error_message: string | null
          id: string
          instrumental: boolean | null
          is_public: boolean | null
          like_count: number | null
          lyrics: string | null
          metadata: Json | null
          play_count: number | null
          prompt: string | null
          status: string
          style: string | null
          suno_song_id: string | null
          suno_task_id: string | null
          thumbnail_url: string | null
          title: string
          updated_at: string
          user_id: string
          voice_type: string | null
        }
        Insert: {
          audio_url?: string | null
          created_at?: string
          duration?: number | null
          error_message?: string | null
          id?: string
          instrumental?: boolean | null
          is_public?: boolean | null
          like_count?: number | null
          lyrics?: string | null
          metadata?: Json | null
          play_count?: number | null
          prompt?: string | null
          status?: string
          style?: string | null
          suno_song_id?: string | null
          suno_task_id?: string | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          user_id: string
          voice_type?: string | null
        }
        Update: {
          audio_url?: string | null
          created_at?: string
          duration?: number | null
          error_message?: string | null
          id?: string
          instrumental?: boolean | null
          is_public?: boolean | null
          like_count?: number | null
          lyrics?: string | null
          metadata?: Json | null
          play_count?: number | null
          prompt?: string | null
          status?: string
          style?: string | null
          suno_song_id?: string | null
          suno_task_id?: string | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          voice_type?: string | null
        }
        Relationships: []
      }
      ai_music_likes: {
        Row: {
          created_at: string
          id: string
          music_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          music_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          music_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_music_likes_music_id_fkey"
            columns: ["music_id"]
            isOneToOne: false
            referencedRelation: "ai_generated_music"
            referencedColumns: ["id"]
          },
        ]
      }
      angel_chat_messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          provider: string | null
          role: string
          session_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          provider?: string | null
          role: string
          session_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          provider?: string | null
          role?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "angel_chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "angel_chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      angel_chat_sessions: {
        Row: {
          created_at: string | null
          id: string
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      api_keys: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          key_hash: string
          last_used_at: string | null
          platform_name: string
          rate_limit_per_minute: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          key_hash: string
          last_used_at?: string | null
          platform_name: string
          rate_limit_per_minute?: number
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          key_hash?: string
          last_used_at?: string | null
          platform_name?: string
          rate_limit_per_minute?: number
        }
        Relationships: []
      }
      api_rate_limits: {
        Row: {
          api_key_id: string
          id: string
          request_count: number
          window_start: string
        }
        Insert: {
          api_key_id: string
          id?: string
          request_count?: number
          window_start?: string
        }
        Update: {
          api_key_id?: string
          id?: string
          request_count?: number
          window_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_rate_limits_api_key_id_fkey"
            columns: ["api_key_id"]
            isOneToOne: false
            referencedRelation: "api_keys"
            referencedColumns: ["id"]
          },
        ]
      }
      blacklisted_wallets: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          is_permanent: boolean | null
          reason: string | null
          user_id: string | null
          wallet_address: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_permanent?: boolean | null
          reason?: string | null
          user_id?: string | null
          wallet_address: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_permanent?: boolean | null
          reason?: string | null
          user_id?: string | null
          wallet_address?: string
        }
        Relationships: []
      }
      bounty_submissions: {
        Row: {
          admin_note: string | null
          approved_at: string | null
          approved_by: string | null
          category: string
          contact_info: string | null
          contribution_type: string
          created_at: string
          description: string
          id: string
          image_url: string | null
          name: string | null
          reward_amount: number
          status: string
          title: string
          updated_at: string
          upvote_count: number
          user_id: string | null
        }
        Insert: {
          admin_note?: string | null
          approved_at?: string | null
          approved_by?: string | null
          category?: string
          contact_info?: string | null
          contribution_type?: string
          created_at?: string
          description: string
          id?: string
          image_url?: string | null
          name?: string | null
          reward_amount?: number
          status?: string
          title: string
          updated_at?: string
          upvote_count?: number
          user_id?: string | null
        }
        Update: {
          admin_note?: string | null
          approved_at?: string | null
          approved_by?: string | null
          category?: string
          contact_info?: string | null
          contribution_type?: string
          created_at?: string
          description?: string
          id?: string
          image_url?: string | null
          name?: string | null
          reward_amount?: number
          status?: string
          title?: string
          updated_at?: string
          upvote_count?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bounty_submissions_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "mv_top_ranking"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bounty_submissions_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bounty_submissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "mv_top_ranking"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bounty_submissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bounty_upvotes: {
        Row: {
          created_at: string
          id: string
          submission_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          submission_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          submission_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bounty_upvotes_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "bounty_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      channels: {
        Row: {
          banner_url: string | null
          created_at: string
          description: string | null
          id: string
          is_verified: boolean | null
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
          is_verified?: boolean | null
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
          is_verified?: boolean | null
          name?: string
          subscriber_count?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          chat_id: string
          content: string | null
          created_at: string
          deep_link: string | null
          donation_transaction_id: string | null
          id: string
          is_read: boolean
          message_type: string
          sender_id: string
        }
        Insert: {
          chat_id: string
          content?: string | null
          created_at?: string
          deep_link?: string | null
          donation_transaction_id?: string | null
          id?: string
          is_read?: boolean
          message_type?: string
          sender_id: string
        }
        Update: {
          chat_id?: string
          content?: string | null
          created_at?: string
          deep_link?: string | null
          donation_transaction_id?: string | null
          id?: string
          is_read?: boolean
          message_type?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "user_chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_donation_transaction_id_fkey"
            columns: ["donation_transaction_id"]
            isOneToOne: false
            referencedRelation: "donation_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      claim_requests: {
        Row: {
          amount: number
          claim_type: string | null
          created_at: string
          error_message: string | null
          gas_fee: number | null
          id: string
          processed_at: string | null
          status: string
          tx_hash: string | null
          user_id: string
          wallet_address: string
        }
        Insert: {
          amount: number
          claim_type?: string | null
          created_at?: string
          error_message?: string | null
          gas_fee?: number | null
          id?: string
          processed_at?: string | null
          status?: string
          tx_hash?: string | null
          user_id: string
          wallet_address: string
        }
        Update: {
          amount?: number
          claim_type?: string | null
          created_at?: string
          error_message?: string | null
          gas_fee?: number | null
          id?: string
          processed_at?: string | null
          status?: string
          tx_hash?: string | null
          user_id?: string
          wallet_address?: string
        }
        Relationships: []
      }
      comment_likes: {
        Row: {
          comment_id: string
          created_at: string | null
          id: string
          is_dislike: boolean | null
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string | null
          id?: string
          is_dislike?: boolean | null
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string | null
          id?: string
          is_dislike?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
        ]
      }
      comment_logs: {
        Row: {
          comment_id: string
          content_hash: string | null
          created_at: string
          id: string
          is_rewarded: boolean
          is_valid: boolean
          session_id: string | null
          user_id: string
          video_id: string
        }
        Insert: {
          comment_id: string
          content_hash?: string | null
          created_at?: string
          id?: string
          is_rewarded?: boolean
          is_valid?: boolean
          session_id?: string | null
          user_id: string
          video_id: string
        }
        Update: {
          comment_id?: string
          content_hash?: string | null
          created_at?: string
          id?: string
          is_rewarded?: boolean
          is_valid?: boolean
          session_id?: string | null
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
            foreignKeyName: "comment_logs_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "user_sessions"
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
          dislike_count: number | null
          edited_at: string | null
          hearted_at: string | null
          hearted_by: string | null
          id: string
          is_deleted: boolean | null
          is_edited: boolean | null
          is_hearted: boolean | null
          is_pinned: boolean | null
          like_count: number | null
          parent_comment_id: string | null
          updated_at: string
          user_id: string
          video_id: string
        }
        Insert: {
          content: string
          created_at?: string
          dislike_count?: number | null
          edited_at?: string | null
          hearted_at?: string | null
          hearted_by?: string | null
          id?: string
          is_deleted?: boolean | null
          is_edited?: boolean | null
          is_hearted?: boolean | null
          is_pinned?: boolean | null
          like_count?: number | null
          parent_comment_id?: string | null
          updated_at?: string
          user_id: string
          video_id: string
        }
        Update: {
          content?: string
          created_at?: string
          dislike_count?: number | null
          edited_at?: string | null
          hearted_at?: string | null
          hearted_by?: string | null
          id?: string
          is_deleted?: boolean | null
          is_edited?: boolean | null
          is_hearted?: boolean | null
          is_pinned?: boolean | null
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
      content_hashes: {
        Row: {
          content_hash: string
          created_at: string | null
          file_size: number | null
          id: string
          video_id: string | null
        }
        Insert: {
          content_hash: string
          created_at?: string | null
          file_size?: number | null
          id?: string
          video_id?: string | null
        }
        Update: {
          content_hash?: string
          created_at?: string | null
          file_size?: number | null
          id?: string
          video_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_hashes_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_claim_records: {
        Row: {
          claim_count: number | null
          created_at: string | null
          date: string
          id: string
          total_claimed: number | null
          user_id: string
        }
        Insert: {
          claim_count?: number | null
          created_at?: string | null
          date?: string
          id?: string
          total_claimed?: number | null
          user_id: string
        }
        Update: {
          claim_count?: number | null
          created_at?: string | null
          date?: string
          id?: string
          total_claimed?: number | null
          user_id?: string
        }
        Relationships: []
      }
      daily_reward_limits: {
        Row: {
          comment_count: number | null
          comment_rewards_earned: number
          created_at: string
          date: string
          id: string
          like_count: number | null
          like_rewards_earned: number
          long_video_count: number | null
          share_count: number | null
          share_rewards_earned: number
          short_video_count: number | null
          updated_at: string
          upload_rewards_earned: number
          uploads_count: number
          user_id: string
          view_count: number | null
          view_rewards_earned: number
        }
        Insert: {
          comment_count?: number | null
          comment_rewards_earned?: number
          created_at?: string
          date?: string
          id?: string
          like_count?: number | null
          like_rewards_earned?: number
          long_video_count?: number | null
          share_count?: number | null
          share_rewards_earned?: number
          short_video_count?: number | null
          updated_at?: string
          upload_rewards_earned?: number
          uploads_count?: number
          user_id: string
          view_count?: number | null
          view_rewards_earned?: number
        }
        Update: {
          comment_count?: number | null
          comment_rewards_earned?: number
          created_at?: string
          date?: string
          id?: string
          like_count?: number | null
          like_rewards_earned?: number
          long_video_count?: number | null
          share_count?: number | null
          share_rewards_earned?: number
          short_video_count?: number | null
          updated_at?: string
          upload_rewards_earned?: number
          uploads_count?: number
          user_id?: string
          view_count?: number | null
          view_rewards_earned?: number
        }
        Relationships: []
      }
      donate_tokens: {
        Row: {
          chain: string
          contract_address: string | null
          created_at: string
          decimals: number
          icon_url: string | null
          id: string
          is_enabled: boolean
          name: string
          priority: number
          symbol: string
        }
        Insert: {
          chain: string
          contract_address?: string | null
          created_at?: string
          decimals?: number
          icon_url?: string | null
          id?: string
          is_enabled?: boolean
          name: string
          priority?: number
          symbol: string
        }
        Update: {
          chain?: string
          contract_address?: string | null
          created_at?: string
          decimals?: number
          icon_url?: string | null
          id?: string
          is_enabled?: boolean
          name?: string
          priority?: number
          symbol?: string
        }
        Relationships: []
      }
      donation_transactions: {
        Row: {
          amount: number
          amount_usd: number | null
          block_number: number | null
          chain: string
          context_id: string | null
          context_type: string
          created_at: string
          explorer_url: string | null
          fee_amount: number
          id: string
          message: string | null
          metadata: Json | null
          receipt_public_id: string
          receiver_id: string
          sender_id: string
          status: string
          token_id: string
          tx_hash: string | null
        }
        Insert: {
          amount: number
          amount_usd?: number | null
          block_number?: number | null
          chain: string
          context_id?: string | null
          context_type?: string
          created_at?: string
          explorer_url?: string | null
          fee_amount?: number
          id?: string
          message?: string | null
          metadata?: Json | null
          receipt_public_id?: string
          receiver_id: string
          sender_id: string
          status?: string
          token_id: string
          tx_hash?: string | null
        }
        Update: {
          amount?: number
          amount_usd?: number | null
          block_number?: number | null
          chain?: string
          context_id?: string | null
          context_type?: string
          created_at?: string
          explorer_url?: string | null
          fee_amount?: number
          id?: string
          message?: string | null
          metadata?: Json | null
          receipt_public_id?: string
          receiver_id?: string
          sender_id?: string
          status?: string
          token_id?: string
          tx_hash?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "donation_transactions_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "donate_tokens"
            referencedColumns: ["id"]
          },
        ]
      }
      internal_wallets: {
        Row: {
          balance: number
          id: string
          token_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          id?: string
          token_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          id?: string
          token_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "internal_wallets_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "donate_tokens"
            referencedColumns: ["id"]
          },
        ]
      }
      ip_tracking: {
        Row: {
          action_type: string
          created_at: string | null
          device_fingerprint: string | null
          id: string
          ip_hash: string
          user_id: string | null
          wallet_address: string | null
        }
        Insert: {
          action_type: string
          created_at?: string | null
          device_fingerprint?: string | null
          id?: string
          ip_hash: string
          user_id?: string | null
          wallet_address?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string | null
          device_fingerprint?: string | null
          id?: string
          ip_hash?: string
          user_id?: string | null
          wallet_address?: string | null
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
      mint_requests: {
        Row: {
          action_evidence: Json
          action_hash: string | null
          action_type: string
          attester_address: string | null
          base_reward_atomic: string
          block_number: number | null
          calculated_amount_atomic: string
          calculated_amount_formatted: string | null
          chain_id: number | null
          contract_address: string | null
          created_at: string | null
          decision_reason: string | null
          evidence_hash: string | null
          id: string
          light_score: number
          minted_at: string | null
          multiplier_i: number
          multiplier_k: number
          multiplier_q: number
          multiplier_ux: number
          nonce_used: number | null
          pillar_scores: Json
          platform_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          tx_hash: string | null
          unity_score: number
          unity_signals: Json | null
          updated_at: string | null
          user_id: string
          user_wallet_address: string
        }
        Insert: {
          action_evidence: Json
          action_hash?: string | null
          action_type: string
          attester_address?: string | null
          base_reward_atomic: string
          block_number?: number | null
          calculated_amount_atomic: string
          calculated_amount_formatted?: string | null
          chain_id?: number | null
          contract_address?: string | null
          created_at?: string | null
          decision_reason?: string | null
          evidence_hash?: string | null
          id?: string
          light_score: number
          minted_at?: string | null
          multiplier_i: number
          multiplier_k: number
          multiplier_q: number
          multiplier_ux: number
          nonce_used?: number | null
          pillar_scores: Json
          platform_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          tx_hash?: string | null
          unity_score: number
          unity_signals?: Json | null
          updated_at?: string | null
          user_id: string
          user_wallet_address: string
        }
        Update: {
          action_evidence?: Json
          action_hash?: string | null
          action_type?: string
          attester_address?: string | null
          base_reward_atomic?: string
          block_number?: number | null
          calculated_amount_atomic?: string
          calculated_amount_formatted?: string | null
          chain_id?: number | null
          contract_address?: string | null
          created_at?: string | null
          decision_reason?: string | null
          evidence_hash?: string | null
          id?: string
          light_score?: number
          minted_at?: string | null
          multiplier_i?: number
          multiplier_k?: number
          multiplier_q?: number
          multiplier_ux?: number
          nonce_used?: number | null
          pillar_scores?: Json
          platform_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          tx_hash?: string | null
          unity_score?: number
          unity_signals?: Json | null
          updated_at?: string | null
          user_id?: string
          user_wallet_address?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_status: string | null
          action_type: string | null
          actor_id: string | null
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          message: string | null
          metadata: Json | null
          thumbnail_url: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          action_status?: string | null
          action_type?: string | null
          actor_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string | null
          metadata?: Json | null
          thumbnail_url?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          action_status?: string | null
          action_type?: string | null
          actor_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string | null
          metadata?: Json | null
          thumbnail_url?: string | null
          title?: string
          type?: string
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
      post_comment_likes: {
        Row: {
          comment_id: string
          created_at: string
          emoji: string
          id: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          emoji?: string
          id?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          emoji?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comment_likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "post_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      post_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          is_deleted: boolean
          like_count: number
          parent_id: string | null
          post_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_deleted?: boolean
          like_count?: number
          parent_id?: string | null
          post_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_deleted?: boolean
          like_count?: number
          parent_id?: string | null
          post_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "post_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string
          emoji: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          channel_id: string
          comment_count: number | null
          content: string
          created_at: string
          donation_transaction_id: string | null
          gif_url: string | null
          id: string
          image_url: string | null
          images: string[] | null
          is_public: boolean | null
          like_count: number | null
          post_type: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          channel_id: string
          comment_count?: number | null
          content: string
          created_at?: string
          donation_transaction_id?: string | null
          gif_url?: string | null
          id?: string
          image_url?: string | null
          images?: string[] | null
          is_public?: boolean | null
          like_count?: number | null
          post_type?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          channel_id?: string
          comment_count?: number | null
          content?: string
          created_at?: string
          donation_transaction_id?: string | null
          gif_url?: string | null
          id?: string
          image_url?: string | null
          images?: string[] | null
          is_public?: boolean | null
          like_count?: number | null
          post_type?: string | null
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
          {
            foreignKeyName: "posts_donation_transaction_id_fkey"
            columns: ["donation_transaction_id"]
            isOneToOne: false
            referencedRelation: "donation_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          angelai_url: string | null
          approved_reward: number | null
          avatar_url: string | null
          avatar_verified: boolean | null
          background_music_url: string | null
          ban_reason: string | null
          banned: boolean | null
          banned_at: string | null
          bio: string | null
          claim_freeze_until: string | null
          created_at: string
          display_name: string | null
          facebook_url: string | null
          first_upload_rewarded: boolean | null
          funplay_url: string | null
          id: string
          instagram_url: string | null
          last_claim_at: string | null
          last_fun_mint_at: string | null
          last_light_score_update: string | null
          last_wallet_change_at: string | null
          light_score: number
          light_score_details: Json | null
          linkedin_url: string | null
          music_enabled: boolean | null
          music_url: string | null
          pending_rewards: number | null
          previous_username: string | null
          signup_ip_hash: string | null
          signup_rewarded: boolean | null
          social_avatars: Json | null
          suspicious_score: number | null
          telegram_url: string | null
          tiktok_url: string | null
          total_camly_rewards: number
          total_fun_minted: number | null
          twitter_url: string | null
          updated_at: string
          username: string
          violation_level: number | null
          wallet_address: string | null
          wallet_change_count_30d: number | null
          wallet_connect_rewarded: boolean | null
          wallet_risk_status: string | null
          wallet_type: string | null
          youtube_url: string | null
          zalo_url: string | null
        }
        Insert: {
          angelai_url?: string | null
          approved_reward?: number | null
          avatar_url?: string | null
          avatar_verified?: boolean | null
          background_music_url?: string | null
          ban_reason?: string | null
          banned?: boolean | null
          banned_at?: string | null
          bio?: string | null
          claim_freeze_until?: string | null
          created_at?: string
          display_name?: string | null
          facebook_url?: string | null
          first_upload_rewarded?: boolean | null
          funplay_url?: string | null
          id: string
          instagram_url?: string | null
          last_claim_at?: string | null
          last_fun_mint_at?: string | null
          last_light_score_update?: string | null
          last_wallet_change_at?: string | null
          light_score?: number
          light_score_details?: Json | null
          linkedin_url?: string | null
          music_enabled?: boolean | null
          music_url?: string | null
          pending_rewards?: number | null
          previous_username?: string | null
          signup_ip_hash?: string | null
          signup_rewarded?: boolean | null
          social_avatars?: Json | null
          suspicious_score?: number | null
          telegram_url?: string | null
          tiktok_url?: string | null
          total_camly_rewards?: number
          total_fun_minted?: number | null
          twitter_url?: string | null
          updated_at?: string
          username: string
          violation_level?: number | null
          wallet_address?: string | null
          wallet_change_count_30d?: number | null
          wallet_connect_rewarded?: boolean | null
          wallet_risk_status?: string | null
          wallet_type?: string | null
          youtube_url?: string | null
          zalo_url?: string | null
        }
        Update: {
          angelai_url?: string | null
          approved_reward?: number | null
          avatar_url?: string | null
          avatar_verified?: boolean | null
          background_music_url?: string | null
          ban_reason?: string | null
          banned?: boolean | null
          banned_at?: string | null
          bio?: string | null
          claim_freeze_until?: string | null
          created_at?: string
          display_name?: string | null
          facebook_url?: string | null
          first_upload_rewarded?: boolean | null
          funplay_url?: string | null
          id?: string
          instagram_url?: string | null
          last_claim_at?: string | null
          last_fun_mint_at?: string | null
          last_light_score_update?: string | null
          last_wallet_change_at?: string | null
          light_score?: number
          light_score_details?: Json | null
          linkedin_url?: string | null
          music_enabled?: boolean | null
          music_url?: string | null
          pending_rewards?: number | null
          previous_username?: string | null
          signup_ip_hash?: string | null
          signup_rewarded?: boolean | null
          social_avatars?: Json | null
          suspicious_score?: number | null
          telegram_url?: string | null
          tiktok_url?: string | null
          total_camly_rewards?: number
          total_fun_minted?: number | null
          twitter_url?: string | null
          updated_at?: string
          username?: string
          violation_level?: number | null
          wallet_address?: string | null
          wallet_change_count_30d?: number | null
          wallet_connect_rewarded?: boolean | null
          wallet_risk_status?: string | null
          wallet_type?: string | null
          youtube_url?: string | null
          zalo_url?: string | null
        }
        Relationships: []
      }
      reward_actions: {
        Row: {
          action_type: string
          id: string
          rewarded_at: string | null
          user_id: string
          video_id: string
        }
        Insert: {
          action_type: string
          id?: string
          rewarded_at?: string | null
          user_id: string
          video_id: string
        }
        Update: {
          action_type?: string
          id?: string
          rewarded_at?: string | null
          user_id?: string
          video_id?: string
        }
        Relationships: []
      }
      reward_amount_fix_backup_20260214: {
        Row: {
          amount: number | null
          approved: boolean | null
          claimed: boolean | null
          created_at: string | null
          id: string | null
          reward_type: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          amount?: number | null
          approved?: boolean | null
          claimed?: boolean | null
          created_at?: string | null
          id?: string | null
          reward_type?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number | null
          approved?: boolean | null
          claimed?: boolean | null
          created_at?: string | null
          id?: string | null
          reward_type?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      reward_approvals: {
        Row: {
          admin_id: string | null
          admin_note: string | null
          amount: number
          created_at: string | null
          id: string
          reviewed_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          admin_id?: string | null
          admin_note?: string | null
          amount: number
          created_at?: string | null
          id?: string
          reviewed_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          admin_id?: string | null
          admin_note?: string | null
          amount?: number
          created_at?: string | null
          id?: string
          reviewed_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      reward_bans: {
        Row: {
          created_at: string | null
          created_by: string | null
          expires_at: string | null
          id: string
          reason: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          reason: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          reason?: string
          user_id?: string
        }
        Relationships: []
      }
      reward_config: {
        Row: {
          config_key: string
          config_text: string | null
          config_value: number
          description: string | null
          id: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          config_key: string
          config_text?: string | null
          config_value: number
          description?: string | null
          id?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          config_key?: string
          config_text?: string | null
          config_value?: number
          description?: string | null
          id?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      reward_config_history: {
        Row: {
          changed_at: string | null
          changed_by: string | null
          config_id: string | null
          config_key: string
          id: string
          new_value: number
          old_value: number | null
        }
        Insert: {
          changed_at?: string | null
          changed_by?: string | null
          config_id?: string | null
          config_key: string
          id?: string
          new_value: number
          old_value?: number | null
        }
        Update: {
          changed_at?: string | null
          changed_by?: string | null
          config_id?: string | null
          config_key?: string
          id?: string
          new_value?: number
          old_value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "reward_config_history_config_id_fkey"
            columns: ["config_id"]
            isOneToOne: false
            referencedRelation: "reward_config"
            referencedColumns: ["id"]
          },
        ]
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
      reward_snapshot_20260213: {
        Row: {
          amount: number | null
          approved: boolean | null
          approved_at: string | null
          approved_by: string | null
          claim_tx_hash: string | null
          claimed: boolean | null
          claimed_at: string | null
          created_at: string | null
          id: string | null
          reward_type: string | null
          status: string | null
          tx_hash: string | null
          user_id: string | null
          video_id: string | null
        }
        Insert: {
          amount?: number | null
          approved?: boolean | null
          approved_at?: string | null
          approved_by?: string | null
          claim_tx_hash?: string | null
          claimed?: boolean | null
          claimed_at?: string | null
          created_at?: string | null
          id?: string | null
          reward_type?: string | null
          status?: string | null
          tx_hash?: string | null
          user_id?: string | null
          video_id?: string | null
        }
        Update: {
          amount?: number | null
          approved?: boolean | null
          approved_at?: string | null
          approved_by?: string | null
          claim_tx_hash?: string | null
          claimed?: boolean | null
          claimed_at?: string | null
          created_at?: string | null
          id?: string | null
          reward_type?: string | null
          status?: string | null
          tx_hash?: string | null
          user_id?: string | null
          video_id?: string | null
        }
        Relationships: []
      }
      reward_transactions: {
        Row: {
          amount: number
          approved: boolean | null
          approved_at: string | null
          approved_by: string | null
          claim_tx_hash: string | null
          claimed: boolean
          claimed_at: string | null
          created_at: string
          escrow_release_at: string | null
          id: string
          reward_type: string
          status: string
          tx_hash: string | null
          user_id: string
          video_id: string | null
        }
        Insert: {
          amount: number
          approved?: boolean | null
          approved_at?: string | null
          approved_by?: string | null
          claim_tx_hash?: string | null
          claimed?: boolean
          claimed_at?: string | null
          created_at?: string
          escrow_release_at?: string | null
          id?: string
          reward_type: string
          status?: string
          tx_hash?: string | null
          user_id: string
          video_id?: string | null
        }
        Update: {
          amount?: number
          approved?: boolean | null
          approved_at?: string | null
          approved_by?: string | null
          claim_tx_hash?: string | null
          claimed?: boolean
          claimed_at?: string | null
          created_at?: string
          escrow_release_at?: string | null
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
      sync_cursors: {
        Row: {
          chain_id: number | null
          created_at: string | null
          id: string
          last_block_number: number | null
          last_cursor: string | null
          last_sync_at: string | null
          token_contract: string
          total_synced: number | null
          wallet_address: string
        }
        Insert: {
          chain_id?: number | null
          created_at?: string | null
          id?: string
          last_block_number?: number | null
          last_cursor?: string | null
          last_sync_at?: string | null
          token_contract: string
          total_synced?: number | null
          wallet_address: string
        }
        Update: {
          chain_id?: number | null
          created_at?: string | null
          id?: string
          last_block_number?: number | null
          last_cursor?: string | null
          last_sync_at?: string | null
          token_contract?: string
          total_synced?: number | null
          wallet_address?: string
        }
        Relationships: []
      }
      user_chats: {
        Row: {
          created_at: string
          id: string
          updated_at: string
          user1_id: string
          user2_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          updated_at?: string
          user1_id: string
          user2_id: string
        }
        Update: {
          created_at?: string
          id?: string
          updated_at?: string
          user1_id?: string
          user2_id?: string
        }
        Relationships: []
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
      user_sessions: {
        Row: {
          id: string
          ip_hash: string | null
          is_active: boolean | null
          last_activity: string | null
          session_token: string
          started_at: string | null
          user_agent_hash: string | null
          user_id: string
        }
        Insert: {
          id?: string
          ip_hash?: string | null
          is_active?: boolean | null
          last_activity?: string | null
          session_token: string
          started_at?: string | null
          user_agent_hash?: string | null
          user_id: string
        }
        Update: {
          id?: string
          ip_hash?: string | null
          is_active?: boolean | null
          last_activity?: string | null
          session_token?: string
          started_at?: string | null
          user_agent_hash?: string | null
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
      video_reports: {
        Row: {
          created_at: string
          id: string
          reason: string
          reporter_id: string
          status: string
          video_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          reason?: string
          reporter_id: string
          status?: string
          video_id: string
        }
        Update: {
          created_at?: string
          id?: string
          reason?: string
          reporter_id?: string
          status?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_reports_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
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
          approval_status: string | null
          category: string | null
          channel_id: string
          comment_count: number | null
          created_at: string
          description: string | null
          dislike_count: number | null
          duration: number | null
          file_size: number | null
          id: string
          is_hidden: boolean | null
          is_public: boolean | null
          like_count: number | null
          report_count: number | null
          slug: string | null
          sub_category: string | null
          thumbnail_scan_result: string | null
          thumbnail_scanned: boolean | null
          thumbnail_url: string | null
          title: string
          updated_at: string
          upload_rewarded: boolean | null
          user_id: string
          video_url: string
          view_count: number | null
        }
        Insert: {
          approval_status?: string | null
          category?: string | null
          channel_id: string
          comment_count?: number | null
          created_at?: string
          description?: string | null
          dislike_count?: number | null
          duration?: number | null
          file_size?: number | null
          id?: string
          is_hidden?: boolean | null
          is_public?: boolean | null
          like_count?: number | null
          report_count?: number | null
          slug?: string | null
          sub_category?: string | null
          thumbnail_scan_result?: string | null
          thumbnail_scanned?: boolean | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          upload_rewarded?: boolean | null
          user_id: string
          video_url: string
          view_count?: number | null
        }
        Update: {
          approval_status?: string | null
          category?: string | null
          channel_id?: string
          comment_count?: number | null
          created_at?: string
          description?: string | null
          dislike_count?: number | null
          duration?: number | null
          file_size?: number | null
          id?: string
          is_hidden?: boolean | null
          is_public?: boolean | null
          like_count?: number | null
          report_count?: number | null
          slug?: string | null
          sub_category?: string | null
          thumbnail_scan_result?: string | null
          thumbnail_scanned?: boolean | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          upload_rewarded?: boolean | null
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
          session_ref: string | null
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
          session_ref?: string | null
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
          session_ref?: string | null
          user_id?: string
          video_duration_seconds?: number | null
          video_id?: string
          watch_percentage?: number
          watch_time_seconds?: number
        }
        Relationships: [
          {
            foreignKeyName: "view_logs_session_ref_fkey"
            columns: ["session_ref"]
            isOneToOne: false
            referencedRelation: "user_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "view_logs_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_change_log: {
        Row: {
          created_at: string | null
          id: string
          ip_hash: string | null
          new_wallet: string | null
          old_wallet: string | null
          reason: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          ip_hash?: string | null
          new_wallet?: string | null
          old_wallet?: string | null
          reason?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          ip_hash?: string | null
          new_wallet?: string | null
          old_wallet?: string | null
          reason?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_change_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "mv_top_ranking"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_change_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_history: {
        Row: {
          created_by: string | null
          ended_at: string | null
          id: string
          is_active: boolean | null
          started_at: string | null
          user_id: string
          wallet_address: string
        }
        Insert: {
          created_by?: string | null
          ended_at?: string | null
          id?: string
          is_active?: boolean | null
          started_at?: string | null
          user_id: string
          wallet_address: string
        }
        Update: {
          created_by?: string | null
          ended_at?: string | null
          id?: string
          is_active?: boolean | null
          started_at?: string | null
          user_id?: string
          wallet_address?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "mv_top_ranking"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_links: {
        Row: {
          id: string
          is_primary: boolean | null
          last_sync_at: string | null
          linked_at: string | null
          platform: string
          sync_status: string | null
          user_id: string
          wallet_address: string
        }
        Insert: {
          id?: string
          is_primary?: boolean | null
          last_sync_at?: string | null
          linked_at?: string | null
          platform?: string
          sync_status?: string | null
          user_id: string
          wallet_address: string
        }
        Update: {
          id?: string
          is_primary?: boolean | null
          last_sync_at?: string | null
          linked_at?: string | null
          platform?: string
          sync_status?: string | null
          user_id?: string
          wallet_address?: string
        }
        Relationships: []
      }
      wallet_transactions: {
        Row: {
          amount: number
          block_number: number | null
          block_timestamp: string | null
          chain_id: number | null
          created_at: string
          from_address: string
          from_user_id: string | null
          id: string
          log_index: number | null
          status: string
          to_address: string
          to_user_id: string | null
          token_contract: string | null
          token_type: string
          tx_hash: string
          video_id: string | null
        }
        Insert: {
          amount: number
          block_number?: number | null
          block_timestamp?: string | null
          chain_id?: number | null
          created_at?: string
          from_address: string
          from_user_id?: string | null
          id?: string
          log_index?: number | null
          status?: string
          to_address: string
          to_user_id?: string | null
          token_contract?: string | null
          token_type: string
          tx_hash: string
          video_id?: string | null
        }
        Update: {
          amount?: number
          block_number?: number | null
          block_timestamp?: string | null
          chain_id?: number | null
          created_at?: string
          from_address?: string
          from_user_id?: string | null
          id?: string
          log_index?: number | null
          status?: string
          to_address?: string
          to_user_id?: string | null
          token_contract?: string | null
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
      mv_top_ranking: {
        Row: {
          avatar_url: string | null
          display_name: string | null
          id: string | null
          total_camly_rewards: number | null
          username: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_admin_role: {
        Args: { p_owner_id: string; p_target_user_id: string }
        Returns: boolean
      }
      approve_user_reward: {
        Args: { p_admin_id: string; p_note?: string; p_user_id: string }
        Returns: number
      }
      atomic_increment_reward: {
        Args: { p_amount: number; p_auto_approve: boolean; p_user_id: string }
        Returns: Json
      }
      ban_user_permanently: {
        Args: { p_admin_id: string; p_reason?: string; p_user_id: string }
        Returns: boolean
      }
      bulk_approve_all_rewards: { Args: { p_admin_id: string }; Returns: Json }
      bulk_delete_videos_and_ban_users: {
        Args: { p_admin_id: string; p_video_ids: string[] }
        Returns: Json
      }
      bulk_delete_videos_only: {
        Args: { p_admin_id: string; p_video_ids: string[] }
        Returns: Json
      }
      bulk_notify_system_usernames: {
        Args: { p_admin_id: string }
        Returns: number
      }
      calculate_user_light_score: { Args: { p_user_id: string }; Returns: Json }
      check_admin_rate_limit: {
        Args: { p_action: string; p_admin_id: string; p_max_requests?: number }
        Returns: Json
      }
      freeze_user_rewards: {
        Args: { p_admin_id: string; p_user_id: string }
        Returns: undefined
      }
      get_admin_dashboard_stats: { Args: never; Returns: Json }
      get_honobar_stats: { Args: never; Returns: Json }
      get_ip_abuse_clusters: {
        Args: { min_accounts?: number }
        Returns: {
          account_count: number
          distinct_wallets: number
          ip_hash: string
          total_pending: number
          users: Json
        }[]
      }
      get_public_suspended_list: {
        Args: never
        Returns: {
          avatar_url: string
          ban_reason: string
          banned_at: string
          display_name: string
          user_id: string
          username: string
          violation_level: number
        }[]
      }
      get_public_users_directory: {
        Args: never
        Returns: {
          available_camly: number
          avatar_url: string
          avatar_verified: boolean
          bounty_rewards: number
          claimed_camly: number
          comment_rewards: number
          comments_count: number
          created_at: string
          display_name: string
          id: string
          like_rewards: number
          likes_count: number
          manual_rewards: number
          mint_count: number
          minted_total: number
          posts_count: number
          recv_count: number
          recv_total: number
          sent_count: number
          sent_total: number
          share_rewards: number
          shares_count: number
          signup_rewards: number
          total_camly: number
          total_views: number
          upload_rewards: number
          username: string
          videos_count: number
          view_rewards: number
        }[]
      }
      get_transaction_stats: {
        Args: { p_wallet_address?: string }
        Returns: Json
      }
      get_user_activity_summary: { Args: { p_user_id: string }; Returns: Json }
      get_users_directory_stats: {
        Args: never
        Returns: {
          approved_reward: number
          avatar_url: string
          avatar_verified: boolean
          banned: boolean
          bounty_rewards: number
          comment_rewards: number
          comments_count: number
          created_at: string
          display_name: string
          donations_received_count: number
          donations_received_total: number
          donations_sent_count: number
          donations_sent_total: number
          like_rewards: number
          likes_count: number
          manual_rewards: number
          mint_requests_count: number
          minted_fun_total: number
          pending_rewards: number
          posts_count: number
          share_rewards: number
          shares_count: number
          signup_rewards: number
          total_camly_rewards: number
          upload_rewards: number
          user_id: string
          username: string
          videos_count: number
          view_rewards: number
          views_count: number
          wallet_address: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_completed_profile: {
        Args: { p: Database["public"]["Tables"]["profiles"]["Row"] }
        Returns: boolean
      }
      is_owner: { Args: { _user_id: string }; Returns: boolean }
      refresh_mv_top_ranking: { Args: never; Returns: undefined }
      reject_user_reward: {
        Args: { p_admin_id: string; p_note?: string; p_user_id: string }
        Returns: number
      }
      release_escrow_rewards: {
        Args: never
        Returns: {
          amount: number
          user_id: string
          video_id: string
        }[]
      }
      remove_admin_role: {
        Args: { p_owner_id: string; p_target_user_id: string }
        Returns: boolean
      }
      request_wallet_change: {
        Args: {
          p_ip_hash?: string
          p_new_wallet: string
          p_reason?: string
          p_user_agent?: string
          p_user_id: string
        }
        Returns: Json
      }
      restore_user_rewards: {
        Args: { p_admin_id: string; p_user_id: string }
        Returns: Json
      }
      revoke_escrow_reward: { Args: { p_video_id: string }; Returns: undefined }
      sync_reward_totals: {
        Args: never
        Returns: {
          new_approved: number
          new_pending: number
          new_total: number
          old_approved: number
          old_pending: number
          old_total: number
          user_id: string
        }[]
      }
      toggle_user_avatar_verified: {
        Args: { p_admin_id: string; p_user_id: string }
        Returns: boolean
      }
      trace_wallet_detective: {
        Args: { p_admin_id: string; p_wallet_address: string }
        Returns: {
          avatar_url: string
          avatar_verified: boolean
          banned: boolean
          created_at: string
          display_name: string
          total_amount: number
          tx_count: number
          user_id: string
          username: string
          wallet_address: string
        }[]
      }
      unapprove_user_reward: {
        Args: { p_admin_id: string; p_note?: string; p_user_id: string }
        Returns: number
      }
      unban_user: {
        Args: { p_admin_id: string; p_user_id: string }
        Returns: boolean
      }
      wipe_user_rewards: {
        Args: { p_admin_id: string; p_user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user" | "owner"
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
      app_role: ["admin", "moderator", "user", "owner"],
    },
  },
} as const
