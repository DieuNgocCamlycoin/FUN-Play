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
      action_types: {
        Row: {
          base_impact_score: number | null
          code: string
          created_at: string
          id: string
          is_active: boolean | null
          name: string
          pillar_group: string
        }
        Insert: {
          base_impact_score?: number | null
          code: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          name: string
          pillar_group: string
        }
        Update: {
          base_impact_score?: number | null
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          pillar_group?: string
        }
        Relationships: []
      }
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
      ai_operators: {
        Row: {
          agent_did_id: string
          agent_name: string
          agent_purpose: string | null
          attestation_weight_cap: number
          id: string
          is_active: boolean
          metadata: Json | null
          operator_user_id: string
          registered_at: string
          responsibility_level: string
          revoke_reason: string | null
          revoked_at: string | null
        }
        Insert: {
          agent_did_id: string
          agent_name: string
          agent_purpose?: string | null
          attestation_weight_cap?: number
          id?: string
          is_active?: boolean
          metadata?: Json | null
          operator_user_id: string
          registered_at?: string
          responsibility_level?: string
          revoke_reason?: string | null
          revoked_at?: string | null
        }
        Update: {
          agent_did_id?: string
          agent_name?: string
          agent_purpose?: string | null
          attestation_weight_cap?: number
          id?: string
          is_active?: boolean
          metadata?: Json | null
          operator_user_id?: string
          registered_at?: string
          responsibility_level?: string
          revoke_reason?: string | null
          revoked_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_operators_agent_did_id_fkey"
            columns: ["agent_did_id"]
            isOneToOne: true
            referencedRelation: "did_registry"
            referencedColumns: ["did_id"]
          },
        ]
      }
      ai_trust_evaluations: {
        Row: {
          evaluated_at: string
          fake_probability: number
          id: string
          model: string
          quality_score: number
          signals: Json
          tc_adjustment: number
          user_id: string
        }
        Insert: {
          evaluated_at?: string
          fake_probability?: number
          id?: string
          model?: string
          quality_score?: number
          signals?: Json
          tc_adjustment?: number
          user_id: string
        }
        Update: {
          evaluated_at?: string
          fake_probability?: number
          id?: string
          model?: string
          quality_score?: number
          signals?: Json
          tc_adjustment?: number
          user_id?: string
        }
        Relationships: []
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
      attendance: {
        Row: {
          attendance_confidence: number | null
          attendance_mode: string | null
          check_in_at: string | null
          check_out_at: string | null
          confirmation_status: string
          created_at: string
          duration_minutes: number | null
          event_id: string | null
          group_id: string
          id: string
          leader_confirmed: boolean | null
          linked_action_id: string | null
          participation_factor: number | null
          reflection_submitted: boolean | null
          reflection_text: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          attendance_confidence?: number | null
          attendance_mode?: string | null
          check_in_at?: string | null
          check_out_at?: string | null
          confirmation_status?: string
          created_at?: string
          duration_minutes?: number | null
          event_id?: string | null
          group_id: string
          id?: string
          leader_confirmed?: boolean | null
          linked_action_id?: string | null
          participation_factor?: number | null
          reflection_submitted?: boolean | null
          reflection_text?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          attendance_confidence?: number | null
          attendance_mode?: string | null
          check_in_at?: string | null
          check_out_at?: string | null
          confirmation_status?: string
          created_at?: string
          duration_minutes?: number | null
          event_id?: string | null
          group_id?: string
          id?: string
          leader_confirmed?: boolean | null
          linked_action_id?: string | null
          participation_factor?: number | null
          reflection_submitted?: boolean | null
          reflection_text?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "love_house_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_linked_action_id_fkey"
            columns: ["linked_action_id"]
            isOneToOne: false
            referencedRelation: "user_actions"
            referencedColumns: ["id"]
          },
        ]
      }
      attestation_log: {
        Row: {
          agent_did_id: string | null
          ai_origin: boolean
          attestation_type: string
          comment: string | null
          created_at: string
          from_did: string
          from_user_id: string
          id: string
          status: string
          to_did: string
          to_user_id: string
          weight: number
        }
        Insert: {
          agent_did_id?: string | null
          ai_origin?: boolean
          attestation_type: string
          comment?: string | null
          created_at?: string
          from_did: string
          from_user_id: string
          id?: string
          status?: string
          to_did: string
          to_user_id: string
          weight?: number
        }
        Update: {
          agent_did_id?: string | null
          ai_origin?: boolean
          attestation_type?: string
          comment?: string | null
          created_at?: string
          from_did?: string
          from_user_id?: string
          id?: string
          status?: string
          to_did?: string
          to_user_id?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "attestation_log_agent_did_id_fkey"
            columns: ["agent_did_id"]
            isOneToOne: false
            referencedRelation: "did_registry"
            referencedColumns: ["did_id"]
          },
          {
            foreignKeyName: "attestation_log_from_did_fkey"
            columns: ["from_did"]
            isOneToOne: false
            referencedRelation: "did_registry"
            referencedColumns: ["did_id"]
          },
          {
            foreignKeyName: "attestation_log_to_did_fkey"
            columns: ["to_did"]
            isOneToOne: false
            referencedRelation: "did_registry"
            referencedColumns: ["did_id"]
          },
        ]
      }
      balance_ledger: {
        Row: {
          amount: number
          created_at: string
          entry_type: string
          id: string
          note: string | null
          reference_id: string | null
          reference_table: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          entry_type: string
          id?: string
          note?: string | null
          reference_id?: string | null
          reference_table?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          entry_type?: string
          id?: string
          note?: string | null
          reference_id?: string | null
          reference_table?: string | null
          user_id?: string
        }
        Relationships: []
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
      channel_reports: {
        Row: {
          channel_id: string
          created_at: string
          detail: string | null
          id: string
          reason: string
          reporter_id: string
          status: string
        }
        Insert: {
          channel_id: string
          created_at?: string
          detail?: string | null
          id?: string
          reason: string
          reporter_id: string
          status?: string
        }
        Update: {
          channel_id?: string
          created_at?: string
          detail?: string | null
          id?: string
          reason?: string
          reporter_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "channel_reports_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
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
          report_count: number | null
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
          report_count?: number | null
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
          report_count?: number | null
          subscriber_count?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_message_reactions: {
        Row: {
          created_at: string
          emoji: string
          id: string
          message_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          id?: string
          message_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          chat_id: string
          content: string | null
          created_at: string
          deep_link: string | null
          donation_transaction_id: string | null
          id: string
          is_pinned: boolean
          is_read: boolean
          message_type: string
          pinned_at: string | null
          pinned_by: string | null
          reply_to_id: string | null
          sender_id: string
        }
        Insert: {
          chat_id: string
          content?: string | null
          created_at?: string
          deep_link?: string | null
          donation_transaction_id?: string | null
          id?: string
          is_pinned?: boolean
          is_read?: boolean
          message_type?: string
          pinned_at?: string | null
          pinned_by?: string | null
          reply_to_id?: string | null
          sender_id: string
        }
        Update: {
          chat_id?: string
          content?: string | null
          created_at?: string
          deep_link?: string | null
          donation_transaction_id?: string | null
          id?: string
          is_pinned?: boolean
          is_read?: boolean
          message_type?: string
          pinned_at?: string | null
          pinned_by?: string | null
          reply_to_id?: string | null
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
          {
            foreignKeyName: "chat_messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      claim_requests: {
        Row: {
          activated_at: string | null
          amount: number
          auto_eligible: boolean | null
          auto_processed: boolean
          claim_type: string | null
          created_at: string
          epoch_id: string | null
          error_message: string | null
          gas_fee: number | null
          gov_completed_groups: string[]
          gov_required: boolean
          gov_signatures: Json
          gov_signatures_count: number
          id: string
          last_attempt_at: string | null
          last_error: string | null
          locked_at: string | null
          processed_at: string | null
          processing_attempts: number
          status: string
          token_state: string | null
          tx_hash: string | null
          user_id: string
          wallet_address: string
        }
        Insert: {
          activated_at?: string | null
          amount: number
          auto_eligible?: boolean | null
          auto_processed?: boolean
          claim_type?: string | null
          created_at?: string
          epoch_id?: string | null
          error_message?: string | null
          gas_fee?: number | null
          gov_completed_groups?: string[]
          gov_required?: boolean
          gov_signatures?: Json
          gov_signatures_count?: number
          id?: string
          last_attempt_at?: string | null
          last_error?: string | null
          locked_at?: string | null
          processed_at?: string | null
          processing_attempts?: number
          status?: string
          token_state?: string | null
          tx_hash?: string | null
          user_id: string
          wallet_address: string
        }
        Update: {
          activated_at?: string | null
          amount?: number
          auto_eligible?: boolean | null
          auto_processed?: boolean
          claim_type?: string | null
          created_at?: string
          epoch_id?: string | null
          error_message?: string | null
          gas_fee?: number | null
          gov_completed_groups?: string[]
          gov_required?: boolean
          gov_signatures?: Json
          gov_signatures_count?: number
          id?: string
          last_attempt_at?: string | null
          last_error?: string | null
          locked_at?: string | null
          processed_at?: string | null
          processing_attempts?: number
          status?: string
          token_state?: string | null
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
      community_reviews: {
        Row: {
          action_id: string
          comment: string | null
          created_at: string
          endorse_score: number | null
          flag_score: number | null
          id: string
          reviewer_user_id: string
        }
        Insert: {
          action_id: string
          comment?: string | null
          created_at?: string
          endorse_score?: number | null
          flag_score?: number | null
          id?: string
          reviewer_user_id: string
        }
        Update: {
          action_id?: string
          comment?: string | null
          created_at?: string
          endorse_score?: number | null
          flag_score?: number | null
          id?: string
          reviewer_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_reviews_action_id_fkey"
            columns: ["action_id"]
            isOneToOne: false
            referencedRelation: "user_actions"
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
      daily_checkins: {
        Row: {
          checkin_date: string
          created_at: string
          id: string
          intention: string | null
          light_level_snapshot: string | null
          light_score_snapshot: number | null
          mood: string | null
          streak_count: number
          user_id: string
        }
        Insert: {
          checkin_date?: string
          created_at?: string
          id?: string
          intention?: string | null
          light_level_snapshot?: string | null
          light_score_snapshot?: number | null
          mood?: string | null
          streak_count?: number
          user_id: string
        }
        Update: {
          checkin_date?: string
          created_at?: string
          id?: string
          intention?: string | null
          light_level_snapshot?: string | null
          light_score_snapshot?: number | null
          mood?: string | null
          streak_count?: number
          user_id?: string
        }
        Relationships: []
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
      did_registry: {
        Row: {
          anchor_hash: string | null
          created_at: string
          did_id: string
          entity_type: Database["public"]["Enums"]["did_entity_type"]
          level: Database["public"]["Enums"]["did_level"]
          metadata: Json | null
          operator_user_id: string | null
          status: Database["public"]["Enums"]["did_status"]
          updated_at: string
          user_id: string
          verified_at: string | null
          verified_by: string | null
          verified_org_badge: boolean
        }
        Insert: {
          anchor_hash?: string | null
          created_at?: string
          did_id?: string
          entity_type?: Database["public"]["Enums"]["did_entity_type"]
          level?: Database["public"]["Enums"]["did_level"]
          metadata?: Json | null
          operator_user_id?: string | null
          status?: Database["public"]["Enums"]["did_status"]
          updated_at?: string
          user_id: string
          verified_at?: string | null
          verified_by?: string | null
          verified_org_badge?: boolean
        }
        Update: {
          anchor_hash?: string | null
          created_at?: string
          did_id?: string
          entity_type?: Database["public"]["Enums"]["did_entity_type"]
          level?: Database["public"]["Enums"]["did_level"]
          metadata?: Json | null
          operator_user_id?: string | null
          status?: Database["public"]["Enums"]["did_status"]
          updated_at?: string
          user_id?: string
          verified_at?: string | null
          verified_by?: string | null
          verified_org_badge?: boolean
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
      epoch_config: {
        Row: {
          config_group: string
          config_key: string
          config_value: number
          created_at: string
          description: string | null
          id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          config_group?: string
          config_key: string
          config_value: number
          created_at?: string
          description?: string | null
          id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          config_group?: string
          config_key?: string
          config_value?: number
          created_at?: string
          description?: string | null
          id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      epoch_metrics: {
        Row: {
          adjusted_mint: number
          base_expansion: number
          computed_at: string
          contribution_expansion: number
          created_at: string
          discipline_modulator: number
          ecosystem_expansion: number
          epoch_id: string
          final_mint: number
          guardrail_flags: Json | null
          health_snapshot: Json | null
          id: string
          total_mint: number
        }
        Insert: {
          adjusted_mint?: number
          base_expansion?: number
          computed_at?: string
          contribution_expansion?: number
          created_at?: string
          discipline_modulator?: number
          ecosystem_expansion?: number
          epoch_id: string
          final_mint?: number
          guardrail_flags?: Json | null
          health_snapshot?: Json | null
          id?: string
          total_mint?: number
        }
        Update: {
          adjusted_mint?: number
          base_expansion?: number
          computed_at?: string
          contribution_expansion?: number
          created_at?: string
          discipline_modulator?: number
          ecosystem_expansion?: number
          epoch_id?: string
          final_mint?: number
          guardrail_flags?: Json | null
          health_snapshot?: Json | null
          id?: string
          total_mint?: number
        }
        Relationships: []
      }
      epoch_pools: {
        Row: {
          auto_process_enabled: boolean
          closed_at: string | null
          created_at: string
          epoch_id: string
          gov_required: boolean
          notes: string | null
          pool_total: number
          started_at: string
          updated_at: string
        }
        Insert: {
          auto_process_enabled?: boolean
          closed_at?: string | null
          created_at?: string
          epoch_id: string
          gov_required?: boolean
          notes?: string | null
          pool_total?: number
          started_at?: string
          updated_at?: string
        }
        Update: {
          auto_process_enabled?: boolean
          closed_at?: string | null
          created_at?: string
          epoch_id?: string
          gov_required?: boolean
          notes?: string | null
          pool_total?: number
          started_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          created_at: string
          description: string | null
          end_at: string | null
          event_type: string | null
          host_user_id: string
          id: string
          platform_links: Json | null
          recording_hash: string | null
          source_platform: string | null
          start_at: string
          status: string
          title: string
          updated_at: string
          zoom_meeting_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_at?: string | null
          event_type?: string | null
          host_user_id: string
          id?: string
          platform_links?: Json | null
          recording_hash?: string | null
          source_platform?: string | null
          start_at: string
          status?: string
          title: string
          updated_at?: string
          zoom_meeting_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          end_at?: string | null
          event_type?: string | null
          host_user_id?: string
          id?: string
          platform_links?: Json | null
          recording_hash?: string | null
          source_platform?: string | null
          start_at?: string
          status?: string
          title?: string
          updated_at?: string
          zoom_meeting_id?: string | null
        }
        Relationships: []
      }
      features_user_day: {
        Row: {
          anti_farm_risk: number | null
          avg_rating_weighted: number | null
          checkin_done: boolean | null
          consistency_streak: number | null
          content_pillar_score: number | null
          count_comments: number | null
          count_donations: number | null
          count_help: number | null
          count_likes_given: number | null
          count_posts: number | null
          count_reports_valid: number | null
          count_shares: number | null
          count_videos: number | null
          date: string
          onchain_value_score: number | null
          sequence_count: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          anti_farm_risk?: number | null
          avg_rating_weighted?: number | null
          checkin_done?: boolean | null
          consistency_streak?: number | null
          content_pillar_score?: number | null
          count_comments?: number | null
          count_donations?: number | null
          count_help?: number | null
          count_likes_given?: number | null
          count_posts?: number | null
          count_reports_valid?: number | null
          count_shares?: number | null
          count_videos?: number | null
          date?: string
          onchain_value_score?: number | null
          sequence_count?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          anti_farm_risk?: number | null
          avg_rating_weighted?: number | null
          checkin_done?: boolean | null
          consistency_streak?: number | null
          content_pillar_score?: number | null
          count_comments?: number | null
          count_donations?: number | null
          count_help?: number | null
          count_likes_given?: number | null
          count_posts?: number | null
          count_reports_valid?: number | null
          count_shares?: number | null
          count_videos?: number | null
          date?: string
          onchain_value_score?: number | null
          sequence_count?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      fun_auto_mint_daily: {
        Row: {
          amount_minted: number
          claim_count: number
          created_at: string
          id: string
          mint_date: string
          tier: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_minted?: number
          claim_count?: number
          created_at?: string
          id?: string
          mint_date?: string
          tier?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_minted?: number
          claim_count?: number
          created_at?: string
          id?: string
          mint_date?: string
          tier?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      gov_attesters: {
        Row: {
          created_at: string
          gov_group: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
          wallet_address: string
        }
        Insert: {
          created_at?: string
          gov_group: string
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
          wallet_address: string
        }
        Update: {
          created_at?: string
          gov_group?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
          wallet_address?: string
        }
        Relationships: []
      }
      governance_actions: {
        Row: {
          action_type: string
          created_at: string
          epoch_id: string | null
          executed_at: string | null
          executed_by: string | null
          id: string
          notes: string | null
          parameters: Json | null
          status: string
        }
        Insert: {
          action_type: string
          created_at?: string
          epoch_id?: string | null
          executed_at?: string | null
          executed_by?: string | null
          id?: string
          notes?: string | null
          parameters?: Json | null
          status?: string
        }
        Update: {
          action_type?: string
          created_at?: string
          epoch_id?: string | null
          executed_at?: string | null
          executed_by?: string | null
          id?: string
          notes?: string | null
          parameters?: Json | null
          status?: string
        }
        Relationships: []
      }
      identity_epoch_snapshot: {
        Row: {
          active_sbts: Json | null
          did_id: string | null
          did_level: Database["public"]["Enums"]["did_level"]
          epoch_id: string
          governance_eligible: boolean | null
          id: string
          mint_eligible: boolean | null
          snapshotted_at: string
          state_root_hash: string | null
          sybil_risk: number
          tc: number
          tier: Database["public"]["Enums"]["trust_tier"]
          user_id: string
        }
        Insert: {
          active_sbts?: Json | null
          did_id?: string | null
          did_level: Database["public"]["Enums"]["did_level"]
          epoch_id: string
          governance_eligible?: boolean | null
          id?: string
          mint_eligible?: boolean | null
          snapshotted_at?: string
          state_root_hash?: string | null
          sybil_risk?: number
          tc: number
          tier: Database["public"]["Enums"]["trust_tier"]
          user_id: string
        }
        Update: {
          active_sbts?: Json | null
          did_id?: string | null
          did_level?: Database["public"]["Enums"]["did_level"]
          epoch_id?: string
          governance_eligible?: boolean | null
          id?: string
          mint_eligible?: boolean | null
          snapshotted_at?: string
          state_root_hash?: string | null
          sybil_risk?: number
          tc?: number
          tier?: Database["public"]["Enums"]["trust_tier"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "identity_epoch_snapshot_did_id_fkey"
            columns: ["did_id"]
            isOneToOne: false
            referencedRelation: "did_registry"
            referencedColumns: ["did_id"]
          },
        ]
      }
      identity_events: {
        Row: {
          agent_did_id: string | null
          ai_origin: boolean
          created_at: string
          did_id: string | null
          event_ref: string | null
          event_type: string
          id: string
          payload: Json | null
          risk_delta: number | null
          tc_delta: number | null
          user_id: string
        }
        Insert: {
          agent_did_id?: string | null
          ai_origin?: boolean
          created_at?: string
          did_id?: string | null
          event_ref?: string | null
          event_type: string
          id?: string
          payload?: Json | null
          risk_delta?: number | null
          tc_delta?: number | null
          user_id: string
        }
        Update: {
          agent_did_id?: string | null
          ai_origin?: boolean
          created_at?: string
          did_id?: string | null
          event_ref?: string | null
          event_type?: string
          id?: string
          payload?: Json | null
          risk_delta?: number | null
          tc_delta?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "identity_events_agent_did_id_fkey"
            columns: ["agent_did_id"]
            isOneToOne: false
            referencedRelation: "did_registry"
            referencedColumns: ["did_id"]
          },
          {
            foreignKeyName: "identity_events_did_id_fkey"
            columns: ["did_id"]
            isOneToOne: false
            referencedRelation: "did_registry"
            referencedColumns: ["did_id"]
          },
        ]
      }
      identity_links: {
        Row: {
          created_at: string
          did_id: string
          id: string
          link_type: Database["public"]["Enums"]["identity_link_type"]
          link_value: string
          metadata: Json | null
          verification_state: string
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          did_id: string
          id?: string
          link_type: Database["public"]["Enums"]["identity_link_type"]
          link_value: string
          metadata?: Json | null
          verification_state?: string
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          did_id?: string
          id?: string
          link_type?: Database["public"]["Enums"]["identity_link_type"]
          link_value?: string
          metadata?: Json | null
          verification_state?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "identity_links_did_id_fkey"
            columns: ["did_id"]
            isOneToOne: false
            referencedRelation: "did_registry"
            referencedColumns: ["did_id"]
          },
        ]
      }
      immutable_rules: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          rule_code: string
          rule_value: Json
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          rule_code: string
          rule_value: Json
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          rule_code?: string
          rule_value?: Json
        }
        Relationships: []
      }
      inflation_health_metrics: {
        Row: {
          active_quality_users: number | null
          circulating_supply: number | null
          created_at: string
          details: Json | null
          fraud_pressure_ratio: number | null
          id: string
          locked_stability_ratio: number | null
          locked_supply: number | null
          metric_date: string
          retention_quality_ratio: number | null
          safe_mode_triggered: boolean | null
          supply_growth_rate: number | null
          total_supply: number | null
          utility_absorption_ratio: number | null
          value_expansion_ratio: number | null
        }
        Insert: {
          active_quality_users?: number | null
          circulating_supply?: number | null
          created_at?: string
          details?: Json | null
          fraud_pressure_ratio?: number | null
          id?: string
          locked_stability_ratio?: number | null
          locked_supply?: number | null
          metric_date: string
          retention_quality_ratio?: number | null
          safe_mode_triggered?: boolean | null
          supply_growth_rate?: number | null
          total_supply?: number | null
          utility_absorption_ratio?: number | null
          value_expansion_ratio?: number | null
        }
        Update: {
          active_quality_users?: number | null
          circulating_supply?: number | null
          created_at?: string
          details?: Json | null
          fraud_pressure_ratio?: number | null
          id?: string
          locked_stability_ratio?: number | null
          locked_supply?: number | null
          metric_date?: string
          retention_quality_ratio?: number | null
          safe_mode_triggered?: boolean | null
          supply_growth_rate?: number | null
          total_supply?: number | null
          utility_absorption_ratio?: number | null
          value_expansion_ratio?: number | null
        }
        Relationships: []
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
      light_score_ledger: {
        Row: {
          base_score: number
          computed_at: string
          consistency_multiplier: number
          explain_ref: string | null
          final_light_score: number
          id: string
          integrity_penalty: number
          level: string
          period: string
          period_end: string
          period_start: string
          reputation_weight: number
          rule_version: string
          sequence_multiplier: number
          user_id: string
        }
        Insert: {
          base_score?: number
          computed_at?: string
          consistency_multiplier?: number
          explain_ref?: string | null
          final_light_score?: number
          id?: string
          integrity_penalty?: number
          level?: string
          period: string
          period_end: string
          period_start: string
          reputation_weight?: number
          rule_version?: string
          sequence_multiplier?: number
          user_id: string
        }
        Update: {
          base_score?: number
          computed_at?: string
          consistency_multiplier?: number
          explain_ref?: string | null
          final_light_score?: number
          id?: string
          integrity_penalty?: number
          level?: string
          period?: string
          period_end?: string
          period_start?: string
          reputation_weight?: number
          rule_version?: string
          sequence_multiplier?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_ledger_explain"
            columns: ["explain_ref"]
            isOneToOne: false
            referencedRelation: "score_explanations"
            referencedColumns: ["explain_ref"]
          },
        ]
      }
      light_score_tiers: {
        Row: {
          computed_at: string | null
          consistency_multiplier: number | null
          created_at: string | null
          display_tls: number | null
          governance_weight: number | null
          id: string
          mint_mode: string | null
          raw_lls: number | null
          raw_nls: number | null
          raw_pls: number | null
          raw_tls: number | null
          reliability_multiplier: number | null
          tier_id: string | null
          trust_tier: string | null
          user_id: string
        }
        Insert: {
          computed_at?: string | null
          consistency_multiplier?: number | null
          created_at?: string | null
          display_tls?: number | null
          governance_weight?: number | null
          id?: string
          mint_mode?: string | null
          raw_lls?: number | null
          raw_nls?: number | null
          raw_pls?: number | null
          raw_tls?: number | null
          reliability_multiplier?: number | null
          tier_id?: string | null
          trust_tier?: string | null
          user_id: string
        }
        Update: {
          computed_at?: string | null
          consistency_multiplier?: number | null
          created_at?: string | null
          display_tls?: number | null
          governance_weight?: number | null
          id?: string
          mint_mode?: string | null
          raw_lls?: number | null
          raw_nls?: number | null
          raw_pls?: number | null
          raw_tls?: number | null
          reliability_multiplier?: number | null
          tier_id?: string | null
          trust_tier?: string | null
          user_id?: string
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
      livestream_bans: {
        Row: {
          banned_by: string
          created_at: string
          id: string
          livestream_id: string
          reason: string | null
          user_id: string
        }
        Insert: {
          banned_by: string
          created_at?: string
          id?: string
          livestream_id: string
          reason?: string | null
          user_id: string
        }
        Update: {
          banned_by?: string
          created_at?: string
          id?: string
          livestream_id?: string
          reason?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "livestream_bans_livestream_id_fkey"
            columns: ["livestream_id"]
            isOneToOne: false
            referencedRelation: "livestreams"
            referencedColumns: ["id"]
          },
        ]
      }
      livestream_chat: {
        Row: {
          content: string
          created_at: string
          id: string
          is_deleted: boolean
          livestream_id: string
          message_type: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_deleted?: boolean
          livestream_id: string
          message_type?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_deleted?: boolean
          livestream_id?: string
          message_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "livestream_chat_livestream_id_fkey"
            columns: ["livestream_id"]
            isOneToOne: false
            referencedRelation: "livestreams"
            referencedColumns: ["id"]
          },
        ]
      }
      livestream_reactions: {
        Row: {
          created_at: string
          emoji: string
          id: string
          livestream_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji?: string
          id?: string
          livestream_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          livestream_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "livestream_reactions_livestream_id_fkey"
            columns: ["livestream_id"]
            isOneToOne: false
            referencedRelation: "livestreams"
            referencedColumns: ["id"]
          },
        ]
      }
      livestreams: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          ended_at: string | null
          id: string
          last_heartbeat_at: string | null
          peak_viewers: number
          started_at: string | null
          status: string
          thumbnail_url: string | null
          title: string
          total_donations: number
          updated_at: string
          user_id: string
          viewer_count: number
          vod_video_id: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          ended_at?: string | null
          id?: string
          last_heartbeat_at?: string | null
          peak_viewers?: number
          started_at?: string | null
          status?: string
          thumbnail_url?: string | null
          title: string
          total_donations?: number
          updated_at?: string
          user_id: string
          viewer_count?: number
          vod_video_id?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          ended_at?: string | null
          id?: string
          last_heartbeat_at?: string | null
          peak_viewers?: number
          started_at?: string | null
          status?: string
          thumbnail_url?: string | null
          title?: string
          total_donations?: number
          updated_at?: string
          user_id?: string
          viewer_count?: number
          vod_video_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "livestreams_vod_video_id_fkey"
            columns: ["vod_video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      love_house_groups: {
        Row: {
          actual_count: number | null
          created_at: string
          estimated_participants: number | null
          event_id: string
          expected_count: number | null
          group_name: string | null
          id: string
          leader_user_id: string
          location: string | null
          love_house_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          actual_count?: number | null
          created_at?: string
          estimated_participants?: number | null
          event_id: string
          expected_count?: number | null
          group_name?: string | null
          id?: string
          leader_user_id: string
          location?: string | null
          love_house_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          actual_count?: number | null
          created_at?: string
          estimated_participants?: number | null
          event_id?: string
          expected_count?: number | null
          group_name?: string | null
          id?: string
          leader_user_id?: string
          location?: string | null
          love_house_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "love_house_groups_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
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
      mint_allocations: {
        Row: {
          allocation_amount: number
          anti_whale_capped: boolean
          created_at: string
          eligible: boolean
          epoch_id: string
          finalized_score: number | null
          id: string
          instant_amount: number | null
          level_at_epoch: string | null
          light_score_at_epoch: number | null
          locked_amount: number | null
          onchain_tx_hash: string | null
          preview_score: number | null
          reason_codes: string[] | null
          trust_band: string | null
          user_id: string
          validated_score: number | null
          vesting_schedule_id: string | null
        }
        Insert: {
          allocation_amount?: number
          anti_whale_capped?: boolean
          created_at?: string
          eligible?: boolean
          epoch_id: string
          finalized_score?: number | null
          id?: string
          instant_amount?: number | null
          level_at_epoch?: string | null
          light_score_at_epoch?: number | null
          locked_amount?: number | null
          onchain_tx_hash?: string | null
          preview_score?: number | null
          reason_codes?: string[] | null
          trust_band?: string | null
          user_id: string
          validated_score?: number | null
          vesting_schedule_id?: string | null
        }
        Update: {
          allocation_amount?: number
          anti_whale_capped?: boolean
          created_at?: string
          eligible?: boolean
          epoch_id?: string
          finalized_score?: number | null
          id?: string
          instant_amount?: number | null
          level_at_epoch?: string | null
          light_score_at_epoch?: number | null
          locked_amount?: number | null
          onchain_tx_hash?: string | null
          preview_score?: number | null
          reason_codes?: string[] | null
          trust_band?: string | null
          user_id?: string
          validated_score?: number | null
          vesting_schedule_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mint_allocations_epoch_id_fkey"
            columns: ["epoch_id"]
            isOneToOne: false
            referencedRelation: "mint_epochs"
            referencedColumns: ["epoch_id"]
          },
        ]
      }
      mint_batches: {
        Row: {
          allocation_root: string | null
          approved_at: string | null
          approved_by: string | null
          batch_number: number
          created_at: string
          epoch_id: string
          governance_required: boolean | null
          guardrail_flags: Json | null
          id: string
          status: string
          total_mint: number
          user_count: number
        }
        Insert: {
          allocation_root?: string | null
          approved_at?: string | null
          approved_by?: string | null
          batch_number?: number
          created_at?: string
          epoch_id: string
          governance_required?: boolean | null
          guardrail_flags?: Json | null
          id?: string
          status?: string
          total_mint?: number
          user_count?: number
        }
        Update: {
          allocation_root?: string | null
          approved_at?: string | null
          approved_by?: string | null
          batch_number?: number
          created_at?: string
          epoch_id?: string
          governance_required?: boolean | null
          guardrail_flags?: Json | null
          id?: string
          status?: string
          total_mint?: number
          user_count?: number
        }
        Relationships: []
      }
      mint_epochs: {
        Row: {
          adjusted_mint: number | null
          base_expansion: number | null
          contribution_expansion: number | null
          created_at: string
          discipline_modulator: number | null
          ecosystem_expansion: number | null
          epoch_id: string
          epoch_type: string | null
          final_mint: number | null
          finalized_at: string | null
          mint_pool_amount: number
          onchain_tx_hash: string | null
          period_end: string
          period_start: string
          rules_version: string
          status: string
          window_end: string | null
          window_start: string | null
        }
        Insert: {
          adjusted_mint?: number | null
          base_expansion?: number | null
          contribution_expansion?: number | null
          created_at?: string
          discipline_modulator?: number | null
          ecosystem_expansion?: number | null
          epoch_id?: string
          epoch_type?: string | null
          final_mint?: number | null
          finalized_at?: string | null
          mint_pool_amount?: number
          onchain_tx_hash?: string | null
          period_end: string
          period_start: string
          rules_version?: string
          status?: string
          window_end?: string | null
          window_start?: string | null
        }
        Update: {
          adjusted_mint?: number | null
          base_expansion?: number | null
          contribution_expansion?: number | null
          created_at?: string
          discipline_modulator?: number | null
          ecosystem_expansion?: number | null
          epoch_id?: string
          epoch_type?: string | null
          final_mint?: number | null
          finalized_at?: string | null
          mint_pool_amount?: number
          onchain_tx_hash?: string | null
          period_end?: string
          period_start?: string
          rules_version?: string
          status?: string
          window_end?: string | null
          window_start?: string | null
        }
        Relationships: []
      }
      mint_records: {
        Row: {
          action_id: string
          claimable_now: number | null
          created_at: string
          id: string
          light_score: number
          locked_amount: number | null
          mint_amount_platform: number
          mint_amount_total: number
          mint_amount_user: number
          mint_tx_hash: string | null
          release_mode: string
          status: string
          updated_at: string
          user_id: string
          validation_digest: string | null
        }
        Insert: {
          action_id: string
          claimable_now?: number | null
          created_at?: string
          id?: string
          light_score: number
          locked_amount?: number | null
          mint_amount_platform: number
          mint_amount_total: number
          mint_amount_user: number
          mint_tx_hash?: string | null
          release_mode?: string
          status?: string
          updated_at?: string
          user_id: string
          validation_digest?: string | null
        }
        Update: {
          action_id?: string
          claimable_now?: number | null
          created_at?: string
          id?: string
          light_score?: number
          locked_amount?: number | null
          mint_amount_platform?: number
          mint_amount_total?: number
          mint_amount_user?: number
          mint_tx_hash?: string | null
          release_mode?: string
          status?: string
          updated_at?: string
          user_id?: string
          validation_digest?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mint_records_action_id_fkey"
            columns: ["action_id"]
            isOneToOne: false
            referencedRelation: "user_actions"
            referencedColumns: ["id"]
          },
        ]
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
      org_members: {
        Row: {
          id: string
          invited_by: string | null
          is_active: boolean
          joined_at: string
          metadata: Json | null
          org_did_id: string
          role: string
          user_id: string
        }
        Insert: {
          id?: string
          invited_by?: string | null
          is_active?: boolean
          joined_at?: string
          metadata?: Json | null
          org_did_id: string
          role?: string
          user_id: string
        }
        Update: {
          id?: string
          invited_by?: string | null
          is_active?: boolean
          joined_at?: string
          metadata?: Json | null
          org_did_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_members_org_did_id_fkey"
            columns: ["org_did_id"]
            isOneToOne: false
            referencedRelation: "did_registry"
            referencedColumns: ["did_id"]
          },
        ]
      }
      parameter_change_log: {
        Row: {
          action: string
          changed_at: string
          changed_by: string
          id: string
          new_value: Json | null
          old_value: Json | null
          override_id: string | null
          param_key: string
          param_type: string
          reason: string | null
        }
        Insert: {
          action: string
          changed_at?: string
          changed_by: string
          id?: string
          new_value?: Json | null
          old_value?: Json | null
          override_id?: string | null
          param_key: string
          param_type: string
          reason?: string | null
        }
        Update: {
          action?: string
          changed_at?: string
          changed_by?: string
          id?: string
          new_value?: Json | null
          old_value?: Json | null
          override_id?: string | null
          param_key?: string
          param_type?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "parameter_change_log_override_id_fkey"
            columns: ["override_id"]
            isOneToOne: false
            referencedRelation: "parameter_overrides"
            referencedColumns: ["id"]
          },
        ]
      }
      parameter_overrides: {
        Row: {
          created_at: string
          created_by: string
          expires_at: string | null
          id: string
          is_active: boolean
          override_default: number | null
          override_max: number | null
          override_min: number | null
          param_key: string
          param_type: string
          reason: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          override_default?: number | null
          override_max?: number | null
          override_min?: number | null
          param_key: string
          param_type: string
          reason?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          override_default?: number | null
          override_max?: number | null
          override_min?: number | null
          param_key?: string
          param_type?: string
          reason?: string | null
          updated_at?: string
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
      post_slug_history: {
        Row: {
          created_at: string | null
          id: string
          old_slug: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          old_slug: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          old_slug?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_slug_history_post_id_fkey"
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
          slug: string | null
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
          slug?: string | null
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
          slug?: string | null
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
      pplp_activity_submissions: {
        Row: {
          activity_type: string
          ai_analysis: Json | null
          analyzed_at: string | null
          content: string | null
          created_at: string
          fraud_score: number | null
          id: string
          metrics: Json | null
          platform: string
          proof_link: string | null
          proof_status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          activity_type?: string
          ai_analysis?: Json | null
          analyzed_at?: string | null
          content?: string | null
          created_at?: string
          fraud_score?: number | null
          id?: string
          metrics?: Json | null
          platform?: string
          proof_link?: string | null
          proof_status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          activity_type?: string
          ai_analysis?: Json | null
          analyzed_at?: string | null
          content?: string | null
          created_at?: string
          fraud_score?: number | null
          id?: string
          metrics?: Json | null
          platform?: string
          proof_link?: string | null
          proof_status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      pplp_events: {
        Row: {
          actor_user_id: string
          context_id: string | null
          created_at: string
          event_id: string
          event_type: Database["public"]["Enums"]["pplp_event_type"]
          ingest_hash: string | null
          occurred_at: string
          payload_json: Json | null
          risk_flags: string[] | null
          scoring_tags: string[] | null
          source: string | null
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          actor_user_id: string
          context_id?: string | null
          created_at?: string
          event_id?: string
          event_type: Database["public"]["Enums"]["pplp_event_type"]
          ingest_hash?: string | null
          occurred_at?: string
          payload_json?: Json | null
          risk_flags?: string[] | null
          scoring_tags?: string[] | null
          source?: string | null
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          actor_user_id?: string
          context_id?: string | null
          created_at?: string
          event_id?: string
          event_type?: Database["public"]["Enums"]["pplp_event_type"]
          ingest_hash?: string | null
          occurred_at?: string
          payload_json?: Json | null
          risk_flags?: string[] | null
          scoring_tags?: string[] | null
          source?: string | null
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: []
      }
      pplp_mint_requests: {
        Row: {
          action_hash: string | null
          action_ids: string[] | null
          action_type: string
          amount: number
          amount_wei: string
          block_number: number | null
          created_at: string
          engine_version: string | null
          error_message: string | null
          evidence_hash: string | null
          id: string
          metadata: Json | null
          multisig_completed_groups: string[] | null
          multisig_required_groups: string[] | null
          multisig_signatures: Json | null
          nonce: string | null
          platform_id: string
          recipient_address: string
          source_mint_request_id: string | null
          status: string
          tx_hash: string | null
          updated_at: string
          user_id: string
          vvu_score: number | null
        }
        Insert: {
          action_hash?: string | null
          action_ids?: string[] | null
          action_type: string
          amount: number
          amount_wei: string
          block_number?: number | null
          created_at?: string
          engine_version?: string | null
          error_message?: string | null
          evidence_hash?: string | null
          id?: string
          metadata?: Json | null
          multisig_completed_groups?: string[] | null
          multisig_required_groups?: string[] | null
          multisig_signatures?: Json | null
          nonce?: string | null
          platform_id?: string
          recipient_address: string
          source_mint_request_id?: string | null
          status?: string
          tx_hash?: string | null
          updated_at?: string
          user_id: string
          vvu_score?: number | null
        }
        Update: {
          action_hash?: string | null
          action_ids?: string[] | null
          action_type?: string
          amount?: number
          amount_wei?: string
          block_number?: number | null
          created_at?: string
          engine_version?: string | null
          error_message?: string | null
          evidence_hash?: string | null
          id?: string
          metadata?: Json | null
          multisig_completed_groups?: string[] | null
          multisig_required_groups?: string[] | null
          multisig_signatures?: Json | null
          nonce?: string | null
          platform_id?: string
          recipient_address?: string
          source_mint_request_id?: string | null
          status?: string
          tx_hash?: string | null
          updated_at?: string
          user_id?: string
          vvu_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pplp_mint_requests_source_mint_request_id_fkey"
            columns: ["source_mint_request_id"]
            isOneToOne: false
            referencedRelation: "mint_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      pplp_mint_requests_v2: {
        Row: {
          action_hash: string
          action_name: string
          amount_display: number
          amount_wei: number
          block_number: number | null
          created_at: string
          deadline: number
          digest: string
          error_message: string | null
          evidence_hash: string
          evidence_payload: Json | null
          id: string
          locked_at: string | null
          metadata: Json | null
          minted_at: string | null
          nonce: number
          policy_version: number
          processing_attempts: number
          recipient_address: string
          signatures: Json
          signatures_count: number
          source: string
          status: string
          tx_hash: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          action_hash: string
          action_name?: string
          amount_display: number
          amount_wei: number
          block_number?: number | null
          created_at?: string
          deadline: number
          digest: string
          error_message?: string | null
          evidence_hash: string
          evidence_payload?: Json | null
          id?: string
          locked_at?: string | null
          metadata?: Json | null
          minted_at?: string | null
          nonce: number
          policy_version?: number
          processing_attempts?: number
          recipient_address: string
          signatures?: Json
          signatures_count?: number
          source?: string
          status?: string
          tx_hash?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          action_hash?: string
          action_name?: string
          amount_display?: number
          amount_wei?: number
          block_number?: number | null
          created_at?: string
          deadline?: number
          digest?: string
          error_message?: string | null
          evidence_hash?: string
          evidence_payload?: Json | null
          id?: string
          locked_at?: string | null
          metadata?: Json | null
          minted_at?: string | null
          nonce?: number
          policy_version?: number
          processing_attempts?: number
          recipient_address?: string
          signatures?: Json
          signatures_count?: number
          source?: string
          status?: string
          tx_hash?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      pplp_model_weights: {
        Row: {
          dimension: string
          id: string
          updated_at: string
          updated_by: string | null
          version: number
          weight: number
        }
        Insert: {
          dimension: string
          id?: string
          updated_at?: string
          updated_by?: string | null
          version?: number
          weight?: number
        }
        Update: {
          dimension?: string
          id?: string
          updated_at?: string
          updated_by?: string | null
          version?: number
          weight?: number
        }
        Relationships: []
      }
      pplp_ratings: {
        Row: {
          author_user_id: string
          comment: string | null
          content_id: string
          content_type: string
          created_at: string
          pillar_heal_love: number
          pillar_life_service: number
          pillar_sustain: number
          pillar_truth: number
          pillar_unity_source: number
          rater_user_id: string
          rating_id: string
          weight_applied: number
        }
        Insert: {
          author_user_id: string
          comment?: string | null
          content_id: string
          content_type: string
          created_at?: string
          pillar_heal_love?: number
          pillar_life_service?: number
          pillar_sustain?: number
          pillar_truth?: number
          pillar_unity_source?: number
          rater_user_id: string
          rating_id?: string
          weight_applied?: number
        }
        Update: {
          author_user_id?: string
          comment?: string | null
          content_id?: string
          content_type?: string
          created_at?: string
          pillar_heal_love?: number
          pillar_life_service?: number
          pillar_sustain?: number
          pillar_truth?: number
          pillar_unity_source?: number
          rater_user_id?: string
          rating_id?: string
          weight_applied?: number
        }
        Relationships: []
      }
      pplp_validations: {
        Row: {
          action_id: string
          ai_score: number | null
          community_score: number | null
          created_at: string
          explanation: Json | null
          final_light_score: number | null
          healing_love: number
          id: string
          long_term_value: number
          serving_life: number
          transparent_truth: number
          trust_signal_score: number | null
          unity_over_separation: number
          validated_at: string | null
          validation_status: string
        }
        Insert: {
          action_id: string
          ai_score?: number | null
          community_score?: number | null
          created_at?: string
          explanation?: Json | null
          final_light_score?: number | null
          healing_love?: number
          id?: string
          long_term_value?: number
          serving_life?: number
          transparent_truth?: number
          trust_signal_score?: number | null
          unity_over_separation?: number
          validated_at?: string | null
          validation_status?: string
        }
        Update: {
          action_id?: string
          ai_score?: number | null
          community_score?: number | null
          created_at?: string
          explanation?: Json | null
          final_light_score?: number | null
          healing_love?: number
          id?: string
          long_term_value?: number
          serving_life?: number
          transparent_truth?: number
          trust_signal_score?: number | null
          unity_over_separation?: number
          validated_at?: string | null
          validation_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "pplp_validations_action_id_fkey"
            columns: ["action_id"]
            isOneToOne: false
            referencedRelation: "user_actions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          angelai_url: string | null
          approved_reward: number | null
          auto_mint_fun_enabled: boolean | null
          avatar_url: string | null
          avatar_verified: boolean | null
          background_music_url: string | null
          ban_reason: string | null
          banned: boolean | null
          banned_at: string | null
          bio: string | null
          claim_freeze_until: string | null
          completion_pct: number | null
          consistency_days: number | null
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
          light_level: string | null
          light_score: number
          light_score_details: Json | null
          light_score_v2: number | null
          linkedin_url: string | null
          mantra_ack_at: string | null
          music_enabled: boolean | null
          music_url: string | null
          pending_rewards: number | null
          pplp_accepted_at: string | null
          pplp_version: string | null
          previous_username: string | null
          signup_ip_hash: string | null
          signup_rewarded: boolean | null
          social_avatars: Json | null
          suspicious_score: number | null
          telegram_url: string | null
          tiktok_url: string | null
          total_camly_rewards: number
          total_fun_minted: number | null
          total_light_score: number
          trust_level: number
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
          auto_mint_fun_enabled?: boolean | null
          avatar_url?: string | null
          avatar_verified?: boolean | null
          background_music_url?: string | null
          ban_reason?: string | null
          banned?: boolean | null
          banned_at?: string | null
          bio?: string | null
          claim_freeze_until?: string | null
          completion_pct?: number | null
          consistency_days?: number | null
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
          light_level?: string | null
          light_score?: number
          light_score_details?: Json | null
          light_score_v2?: number | null
          linkedin_url?: string | null
          mantra_ack_at?: string | null
          music_enabled?: boolean | null
          music_url?: string | null
          pending_rewards?: number | null
          pplp_accepted_at?: string | null
          pplp_version?: string | null
          previous_username?: string | null
          signup_ip_hash?: string | null
          signup_rewarded?: boolean | null
          social_avatars?: Json | null
          suspicious_score?: number | null
          telegram_url?: string | null
          tiktok_url?: string | null
          total_camly_rewards?: number
          total_fun_minted?: number | null
          total_light_score?: number
          trust_level?: number
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
          auto_mint_fun_enabled?: boolean | null
          avatar_url?: string | null
          avatar_verified?: boolean | null
          background_music_url?: string | null
          ban_reason?: string | null
          banned?: boolean | null
          banned_at?: string | null
          bio?: string | null
          claim_freeze_until?: string | null
          completion_pct?: number | null
          consistency_days?: number | null
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
          light_level?: string | null
          light_score?: number
          light_score_details?: Json | null
          light_score_v2?: number | null
          linkedin_url?: string | null
          mantra_ack_at?: string | null
          music_enabled?: boolean | null
          music_url?: string | null
          pending_rewards?: number | null
          pplp_accepted_at?: string | null
          pplp_version?: string | null
          previous_username?: string | null
          signup_ip_hash?: string | null
          signup_rewarded?: boolean | null
          social_avatars?: Json | null
          suspicious_score?: number | null
          telegram_url?: string | null
          tiktok_url?: string | null
          total_camly_rewards?: number
          total_fun_minted?: number | null
          total_light_score?: number
          trust_level?: number
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
      proofs: {
        Row: {
          action_id: string
          created_at: string
          external_ref: string | null
          extracted_text: string | null
          file_hash: string | null
          id: string
          proof_type: string
          proof_url: string | null
          raw_metadata: Json | null
        }
        Insert: {
          action_id: string
          created_at?: string
          external_ref?: string | null
          extracted_text?: string | null
          file_hash?: string | null
          id?: string
          proof_type: string
          proof_url?: string | null
          raw_metadata?: Json | null
        }
        Update: {
          action_id?: string
          created_at?: string
          external_ref?: string | null
          extracted_text?: string | null
          file_hash?: string | null
          id?: string
          proof_type?: string
          proof_url?: string | null
          raw_metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "proofs_action_id_fkey"
            columns: ["action_id"]
            isOneToOne: false
            referencedRelation: "user_actions"
            referencedColumns: ["id"]
          },
        ]
      }
      recovery_log: {
        Row: {
          completed_at: string | null
          cooldown_until: string | null
          created_at: string
          did_id: string | null
          guardians: string[] | null
          id: string
          initiated_by: string | null
          payload: Json | null
          recovery_layer: string
          status: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          cooldown_until?: string | null
          created_at?: string
          did_id?: string | null
          guardians?: string[] | null
          id?: string
          initiated_by?: string | null
          payload?: Json | null
          recovery_layer: string
          status?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          cooldown_until?: string | null
          created_at?: string
          did_id?: string | null
          guardians?: string[] | null
          id?: string
          initiated_by?: string | null
          payload?: Json | null
          recovery_layer?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recovery_log_did_id_fkey"
            columns: ["did_id"]
            isOneToOne: false
            referencedRelation: "did_registry"
            referencedColumns: ["did_id"]
          },
        ]
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
      reward_vesting_schedules: {
        Row: {
          claimed_amount: number
          consistency_unlock: number | null
          contribution_unlock: number | null
          created_at: string
          dormant_at: string | null
          epoch_id: string
          id: string
          instant_amount: number
          locked_amount: number
          next_unlock_at: string | null
          token_state: string
          total_amount: number
          unlock_history: Json | null
          unlocked_amount: number
          updated_at: string
          usage_unlock: number | null
          user_id: string
        }
        Insert: {
          claimed_amount?: number
          consistency_unlock?: number | null
          contribution_unlock?: number | null
          created_at?: string
          dormant_at?: string | null
          epoch_id: string
          id?: string
          instant_amount?: number
          locked_amount?: number
          next_unlock_at?: string | null
          token_state?: string
          total_amount?: number
          unlock_history?: Json | null
          unlocked_amount?: number
          updated_at?: string
          usage_unlock?: number | null
          user_id: string
        }
        Update: {
          claimed_amount?: number
          consistency_unlock?: number | null
          contribution_unlock?: number | null
          created_at?: string
          dormant_at?: string | null
          epoch_id?: string
          id?: string
          instant_amount?: number
          locked_amount?: number
          next_unlock_at?: string | null
          token_state?: string
          total_amount?: number
          unlock_history?: Json | null
          unlocked_amount?: number
          updated_at?: string
          usage_unlock?: number | null
          user_id?: string
        }
        Relationships: []
      }
      sbt_issuance_rules: {
        Row: {
          category: Database["public"]["Enums"]["sbt_category"]
          conditions: Json
          created_at: string
          description: string | null
          display_name: string
          id: string
          is_active: boolean
          issue_mode: Database["public"]["Enums"]["sbt_issue_mode"]
          sbt_type: string
          trust_weight: number
        }
        Insert: {
          category: Database["public"]["Enums"]["sbt_category"]
          conditions?: Json
          created_at?: string
          description?: string | null
          display_name: string
          id?: string
          is_active?: boolean
          issue_mode?: Database["public"]["Enums"]["sbt_issue_mode"]
          sbt_type: string
          trust_weight?: number
        }
        Update: {
          category?: Database["public"]["Enums"]["sbt_category"]
          conditions?: Json
          created_at?: string
          description?: string | null
          display_name?: string
          id?: string
          is_active?: boolean
          issue_mode?: Database["public"]["Enums"]["sbt_issue_mode"]
          sbt_type?: string
          trust_weight?: number
        }
        Relationships: []
      }
      sbt_registry: {
        Row: {
          category: Database["public"]["Enums"]["sbt_category"]
          did_id: string
          evidence_hash: string | null
          expires_at: string | null
          issued_at: string
          issuer: string
          metadata: Json | null
          on_chain_token_id: string | null
          on_chain_tx_hash: string | null
          privacy_level: string
          revocation_reason: string | null
          sbt_type: string
          status: Database["public"]["Enums"]["sbt_status"]
          token_id: string
          trust_weight: number
          upgrade_path: string | null
          user_id: string
        }
        Insert: {
          category: Database["public"]["Enums"]["sbt_category"]
          did_id: string
          evidence_hash?: string | null
          expires_at?: string | null
          issued_at?: string
          issuer?: string
          metadata?: Json | null
          on_chain_token_id?: string | null
          on_chain_tx_hash?: string | null
          privacy_level?: string
          revocation_reason?: string | null
          sbt_type: string
          status?: Database["public"]["Enums"]["sbt_status"]
          token_id?: string
          trust_weight?: number
          upgrade_path?: string | null
          user_id: string
        }
        Update: {
          category?: Database["public"]["Enums"]["sbt_category"]
          did_id?: string
          evidence_hash?: string | null
          expires_at?: string | null
          issued_at?: string
          issuer?: string
          metadata?: Json | null
          on_chain_token_id?: string | null
          on_chain_tx_hash?: string | null
          privacy_level?: string
          revocation_reason?: string | null
          sbt_type?: string
          status?: Database["public"]["Enums"]["sbt_status"]
          token_id?: string
          trust_weight?: number
          upgrade_path?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sbt_registry_did_id_fkey"
            columns: ["did_id"]
            isOneToOne: false
            referencedRelation: "did_registry"
            referencedColumns: ["did_id"]
          },
        ]
      }
      score_explanations: {
        Row: {
          created_at: string
          explain_ref: string
          penalties_json: Json
          scoring_version: string
          top_contributors_json: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          explain_ref?: string
          penalties_json?: Json
          scoring_version?: string
          top_contributors_json?: Json
          user_id: string
        }
        Update: {
          created_at?: string
          explain_ref?: string
          penalties_json?: Json
          scoring_version?: string
          top_contributors_json?: Json
          user_id?: string
        }
        Relationships: []
      }
      scoring_rules: {
        Row: {
          created_at: string
          description: string | null
          effective_from: string | null
          effective_to: string | null
          formula_json: Json
          multiplier_config_json: Json
          name: string
          penalty_config_json: Json
          rule_version: string
          status: string
          weight_config_json: Json
        }
        Insert: {
          created_at?: string
          description?: string | null
          effective_from?: string | null
          effective_to?: string | null
          formula_json?: Json
          multiplier_config_json?: Json
          name: string
          penalty_config_json?: Json
          rule_version: string
          status?: string
          weight_config_json?: Json
        }
        Update: {
          created_at?: string
          description?: string | null
          effective_from?: string | null
          effective_to?: string | null
          formula_json?: Json
          multiplier_config_json?: Json
          name?: string
          penalty_config_json?: Json
          rule_version?: string
          status?: string
          weight_config_json?: Json
        }
        Relationships: []
      }
      sequences: {
        Row: {
          created_at: string
          end_at: string | null
          evidence_event_ids: string[] | null
          score_bonus: number
          sequence_id: string
          sequence_type: string
          start_at: string
          state: string
          user_id: string
        }
        Insert: {
          created_at?: string
          end_at?: string | null
          evidence_event_ids?: string[] | null
          score_bonus?: number
          sequence_id?: string
          sequence_type: string
          start_at?: string
          state?: string
          user_id: string
        }
        Update: {
          created_at?: string
          end_at?: string | null
          evidence_event_ids?: string[] | null
          score_bonus?: number
          sequence_id?: string
          sequence_type?: string
          start_at?: string
          state?: string
          user_id?: string
        }
        Relationships: []
      }
      signals_anti_farm: {
        Row: {
          created_at: string
          evidence_json: Json | null
          reviewed_at: string | null
          reviewed_by: string | null
          severity: number
          signal_id: string
          signal_type: string
          status: string
          user_id: string
          window_end: string | null
          window_start: string | null
        }
        Insert: {
          created_at?: string
          evidence_json?: Json | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          severity?: number
          signal_id?: string
          signal_type: string
          status?: string
          user_id: string
          window_end?: string | null
          window_start?: string | null
        }
        Update: {
          created_at?: string
          evidence_json?: Json | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          severity?: number
          signal_id?: string
          signal_type?: string
          status?: string
          user_id?: string
          window_end?: string | null
          window_start?: string | null
        }
        Relationships: []
      }
      smart_activation: {
        Row: {
          activated_at: string | null
          curator_enabled: boolean | null
          earning_enabled: boolean | null
          id: string
          last_check_at: string | null
          mentor_enabled: boolean | null
          proposal_enabled: boolean | null
          user_id: string
          validator_enabled: boolean | null
          voting_enabled: boolean | null
        }
        Insert: {
          activated_at?: string | null
          curator_enabled?: boolean | null
          earning_enabled?: boolean | null
          id?: string
          last_check_at?: string | null
          mentor_enabled?: boolean | null
          proposal_enabled?: boolean | null
          user_id: string
          validator_enabled?: boolean | null
          voting_enabled?: boolean | null
        }
        Update: {
          activated_at?: string | null
          curator_enabled?: boolean | null
          earning_enabled?: boolean | null
          id?: string
          last_check_at?: string | null
          mentor_enabled?: boolean | null
          proposal_enabled?: boolean | null
          user_id?: string
          validator_enabled?: boolean | null
          voting_enabled?: boolean | null
        }
        Relationships: []
      }
      stability_snapshots: {
        Row: {
          computed_at: string
          data_points: number
          id: string
          mean_ls_30d: number
          snapshot_date: string
          stability_index: number
          std_dev: number
          user_id: string
          variance: number
        }
        Insert: {
          computed_at?: string
          data_points?: number
          id?: string
          mean_ls_30d?: number
          snapshot_date?: string
          stability_index?: number
          std_dev?: number
          user_id: string
          variance?: number
        }
        Update: {
          computed_at?: string
          data_points?: number
          id?: string
          mean_ls_30d?: number
          snapshot_date?: string
          stability_index?: number
          std_dev?: number
          user_id?: string
          variance?: number
        }
        Relationships: []
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
      system_phase_state: {
        Row: {
          auto_switch_enabled: boolean
          created_at: string
          current_phase: string
          id: string
          is_current: boolean
          kpi_snapshot: Json
          previous_phase: string | null
          switch_reason: string | null
          switched_at: string
          switched_by: string | null
        }
        Insert: {
          auto_switch_enabled?: boolean
          created_at?: string
          current_phase?: string
          id?: string
          is_current?: boolean
          kpi_snapshot?: Json
          previous_phase?: string | null
          switch_reason?: string | null
          switched_at?: string
          switched_by?: string | null
        }
        Update: {
          auto_switch_enabled?: boolean
          created_at?: string
          current_phase?: string
          id?: string
          is_current?: boolean
          kpi_snapshot?: Json
          previous_phase?: string | null
          switch_reason?: string | null
          switched_at?: string
          switched_by?: string | null
        }
        Relationships: []
      }
      treasury_flows: {
        Row: {
          amount: number
          authorized_by: string | null
          created_at: string
          epoch_id: string | null
          from_vault: string | null
          id: string
          reason: string | null
          to_vault: string | null
        }
        Insert: {
          amount: number
          authorized_by?: string | null
          created_at?: string
          epoch_id?: string | null
          from_vault?: string | null
          id?: string
          reason?: string | null
          to_vault?: string | null
        }
        Update: {
          amount?: number
          authorized_by?: string | null
          created_at?: string
          epoch_id?: string | null
          from_vault?: string | null
          id?: string
          reason?: string | null
          to_vault?: string | null
        }
        Relationships: []
      }
      treasury_vault_balances: {
        Row: {
          balance: number
          created_at: string
          id: string
          last_inflow_at: string | null
          last_outflow_at: string | null
          updated_at: string
          vault_name: string
        }
        Insert: {
          balance?: number
          created_at?: string
          id?: string
          last_inflow_at?: string | null
          last_outflow_at?: string | null
          updated_at?: string
          vault_name: string
        }
        Update: {
          balance?: number
          created_at?: string
          id?: string
          last_inflow_at?: string | null
          last_outflow_at?: string | null
          updated_at?: string
          vault_name?: string
        }
        Relationships: []
      }
      trust_edges: {
        Row: {
          created_at: string
          from_user_id: string
          id: string
          reason: string | null
          to_user_id: string
          updated_at: string
          weight: number
        }
        Insert: {
          created_at?: string
          from_user_id: string
          id?: string
          reason?: string | null
          to_user_id: string
          updated_at?: string
          weight?: number
        }
        Update: {
          created_at?: string
          from_user_id?: string
          id?: string
          reason?: string | null
          to_user_id?: string
          updated_at?: string
          weight?: number
        }
        Relationships: []
      }
      trust_profile: {
        Row: {
          bs: number | null
          cleanliness: number | null
          did_id: string | null
          fraud_risk: number
          hs: number | null
          last_computed_at: string
          os: number | null
          permission_flags: Json | null
          rf: number | null
          ss: number | null
          sybil_risk: number
          tc: number
          tier: Database["public"]["Enums"]["trust_tier"]
          updated_at: string
          user_id: string
          vs: number | null
        }
        Insert: {
          bs?: number | null
          cleanliness?: number | null
          did_id?: string | null
          fraud_risk?: number
          hs?: number | null
          last_computed_at?: string
          os?: number | null
          permission_flags?: Json | null
          rf?: number | null
          ss?: number | null
          sybil_risk?: number
          tc?: number
          tier?: Database["public"]["Enums"]["trust_tier"]
          updated_at?: string
          user_id: string
          vs?: number | null
        }
        Update: {
          bs?: number | null
          cleanliness?: number | null
          did_id?: string | null
          fraud_risk?: number
          hs?: number | null
          last_computed_at?: string
          os?: number | null
          permission_flags?: Json | null
          rf?: number | null
          ss?: number | null
          sybil_risk?: number
          tc?: number
          tier?: Database["public"]["Enums"]["trust_tier"]
          updated_at?: string
          user_id?: string
          vs?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "trust_profile_did_id_fkey"
            columns: ["did_id"]
            isOneToOne: false
            referencedRelation: "did_registry"
            referencedColumns: ["did_id"]
          },
        ]
      }
      user_actions: {
        Row: {
          action_type_id: string
          anti_abuse_factor: number | null
          created_at: string
          description: string | null
          id: string
          iis_score: number | null
          impact_multiplier: number | null
          raw_metadata: Json | null
          source_platform: string | null
          source_url: string | null
          status: string
          submitted_at: string
          title: string
          updated_at: string
          user_id: string
          vvu_score: number | null
        }
        Insert: {
          action_type_id: string
          anti_abuse_factor?: number | null
          created_at?: string
          description?: string | null
          id?: string
          iis_score?: number | null
          impact_multiplier?: number | null
          raw_metadata?: Json | null
          source_platform?: string | null
          source_url?: string | null
          status?: string
          submitted_at?: string
          title: string
          updated_at?: string
          user_id: string
          vvu_score?: number | null
        }
        Update: {
          action_type_id?: string
          anti_abuse_factor?: number | null
          created_at?: string
          description?: string | null
          id?: string
          iis_score?: number | null
          impact_multiplier?: number | null
          raw_metadata?: Json | null
          source_platform?: string | null
          source_url?: string | null
          status?: string
          submitted_at?: string
          title?: string
          updated_at?: string
          user_id?: string
          vvu_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_actions_action_type_id_fkey"
            columns: ["action_type_id"]
            isOneToOne: false
            referencedRelation: "action_types"
            referencedColumns: ["id"]
          },
        ]
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
      user_epoch_scores: {
        Row: {
          burst_penalty: number | null
          consistency_factor: number | null
          created_at: string
          cross_window_bonus: number | null
          epoch_id: string
          finalized_score: number | null
          fraud_factor: number | null
          id: string
          preview_score: number | null
          trust_band: string | null
          trust_factor: number | null
          trust_ramp: number | null
          updated_at: string
          user_id: string
          utility_factor: number | null
          validated_score: number | null
          weighted_score: number | null
        }
        Insert: {
          burst_penalty?: number | null
          consistency_factor?: number | null
          created_at?: string
          cross_window_bonus?: number | null
          epoch_id: string
          finalized_score?: number | null
          fraud_factor?: number | null
          id?: string
          preview_score?: number | null
          trust_band?: string | null
          trust_factor?: number | null
          trust_ramp?: number | null
          updated_at?: string
          user_id: string
          utility_factor?: number | null
          validated_score?: number | null
          weighted_score?: number | null
        }
        Update: {
          burst_penalty?: number | null
          consistency_factor?: number | null
          created_at?: string
          cross_window_bonus?: number | null
          epoch_id?: string
          finalized_score?: number | null
          fraud_factor?: number | null
          id?: string
          preview_score?: number | null
          trust_band?: string | null
          trust_factor?: number | null
          trust_ramp?: number | null
          updated_at?: string
          user_id?: string
          utility_factor?: number | null
          validated_score?: number | null
          weighted_score?: number | null
        }
        Relationships: []
      }
      user_identity_proofs: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          metadata: Json | null
          proof_hash: string | null
          proof_type: string
          provider: string
          updated_at: string
          user_id: string
          verified: boolean
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          proof_hash?: string | null
          proof_type: string
          provider?: string
          updated_at?: string
          user_id: string
          verified?: boolean
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          proof_hash?: string | null
          proof_type?: string
          provider?: string
          updated_at?: string
          user_id?: string
          verified?: boolean
          verified_at?: string | null
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
          detail: string | null
          id: string
          reason: string
          reporter_id: string
          status: string
          video_id: string
        }
        Insert: {
          created_at?: string
          detail?: string | null
          id?: string
          reason?: string
          reporter_id: string
          status?: string
          video_id: string
        }
        Update: {
          created_at?: string
          detail?: string | null
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
      video_slug_history: {
        Row: {
          created_at: string
          id: string
          old_slug: string
          user_id: string
          video_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          old_slug: string
          user_id: string
          video_id: string
        }
        Update: {
          created_at?: string
          id?: string
          old_slug?: string
          user_id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_slug_history_video_id_fkey"
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
      vvu_ledger: {
        Row: {
          action_id: string | null
          anti_abuse_factor: number | null
          base_value: number | null
          created_at: string | null
          erp: number | null
          event_type: string
          final_vvu: number | null
          id: string
          iis: number | null
          impact_multiplier: number | null
          layer_scores: Json | null
          quality_score: number | null
          trust_weight: number | null
          user_id: string
        }
        Insert: {
          action_id?: string | null
          anti_abuse_factor?: number | null
          base_value?: number | null
          created_at?: string | null
          erp?: number | null
          event_type: string
          final_vvu?: number | null
          id?: string
          iis?: number | null
          impact_multiplier?: number | null
          layer_scores?: Json | null
          quality_score?: number | null
          trust_weight?: number | null
          user_id: string
        }
        Update: {
          action_id?: string | null
          anti_abuse_factor?: number | null
          base_value?: number | null
          created_at?: string | null
          erp?: number | null
          event_type?: string
          final_vvu?: number | null
          id?: string
          iis?: number | null
          impact_multiplier?: number | null
          layer_scores?: Json | null
          quality_score?: number | null
          trust_weight?: number | null
          user_id?: string
        }
        Relationships: []
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
      zk_commitments: {
        Row: {
          commitment_hash: string
          commitment_type: string
          created_at: string
          did_id: string | null
          expires_at: string | null
          id: string
          is_active: boolean
          merkle_leaf_index: number | null
          merkle_root_id: string | null
          metadata: Json | null
          salt_hash: string
          user_id: string
        }
        Insert: {
          commitment_hash: string
          commitment_type: string
          created_at?: string
          did_id?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          merkle_leaf_index?: number | null
          merkle_root_id?: string | null
          metadata?: Json | null
          salt_hash: string
          user_id: string
        }
        Update: {
          commitment_hash?: string
          commitment_type?: string
          created_at?: string
          did_id?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          merkle_leaf_index?: number | null
          merkle_root_id?: string | null
          metadata?: Json | null
          salt_hash?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "zk_commitments_did_id_fkey"
            columns: ["did_id"]
            isOneToOne: false
            referencedRelation: "did_registry"
            referencedColumns: ["did_id"]
          },
          {
            foreignKeyName: "zk_commitments_merkle_root_fk"
            columns: ["merkle_root_id"]
            isOneToOne: false
            referencedRelation: "zk_merkle_roots"
            referencedColumns: ["id"]
          },
        ]
      }
      zk_merkle_roots: {
        Row: {
          algorithm: string
          anchor_tx_hash: string | null
          commitment_type: string
          epoch_id: string | null
          id: string
          is_active: boolean
          leaf_count: number
          metadata: Json | null
          published_at: string
          root_hash: string
          tree_depth: number
        }
        Insert: {
          algorithm?: string
          anchor_tx_hash?: string | null
          commitment_type: string
          epoch_id?: string | null
          id?: string
          is_active?: boolean
          leaf_count?: number
          metadata?: Json | null
          published_at?: string
          root_hash: string
          tree_depth?: number
        }
        Update: {
          algorithm?: string
          anchor_tx_hash?: string | null
          commitment_type?: string
          epoch_id?: string | null
          id?: string
          is_active?: boolean
          leaf_count?: number
          metadata?: Json | null
          published_at?: string
          root_hash?: string
          tree_depth?: number
        }
        Relationships: []
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
      aggregate_features_user_day: {
        Args: { p_date?: string }
        Returns: number
      }
      approve_user_reward: {
        Args: { p_admin_id: string; p_note?: string; p_user_id: string }
        Returns: number
      }
      atomic_increment_reward: {
        Args: { p_amount: number; p_auto_approve: boolean; p_user_id: string }
        Returns: Json
      }
      auto_issue_all_sbts: { Args: { _user_id: string }; Returns: number }
      backfill_features_user_day: {
        Args: { p_days_back?: number }
        Returns: number
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
      claim_is_chain_ready: { Args: { p_claim_id: string }; Returns: boolean }
      compute_stability_index: { Args: { _user_id: string }; Returns: number }
      evaluate_phase_switch: { Args: never; Returns: Json }
      evaluate_sbt_rule: {
        Args: { _rule_id: string; _user_id: string }
        Returns: boolean
      }
      finalize_livestream_vod: {
        Args: { p_livestream_id: string; p_title?: string; p_video_url: string }
        Returns: string
      }
      freeze_user_rewards: {
        Args: { p_admin_id: string; p_user_id: string }
        Returns: undefined
      }
      fun_auto_mint_refund: {
        Args: { p_amount: number; p_user_id: string }
        Returns: undefined
      }
      fun_auto_mint_reserve: {
        Args: { p_amount: number; p_tier: string; p_user_id: string }
        Returns: boolean
      }
      fun_auto_mint_tier_cap: { Args: { p_tier: string }; Returns: number }
      get_admin_dashboard_stats: { Args: never; Returns: Json }
      get_founder_dashboard_stats: { Args: never; Returns: Json }
      get_fun_money_system_stats: { Args: never; Returns: Json }
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
          total_camly_rewards: number
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
      get_suspended_wallet_history: {
        Args: never
        Returns: {
          source: string
          user_id: string
          wallet_address: string
        }[]
      }
      get_transaction_stats: {
        Args: { p_wallet_address?: string }
        Returns: Json
      }
      get_trust_graph_stats: { Args: { p_user_id: string }; Returns: Json }
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
      issue_sbt_if_eligible: {
        Args: { _rule_id: string; _user_id: string }
        Returns: string
      }
      log_identity_event: {
        Args: {
          _event_ref?: string
          _event_type: string
          _payload?: Json
          _risk_delta?: number
          _tc_delta?: number
          _user_id: string
        }
        Returns: string
      }
      recompute_sybil_risk: { Args: { _user_id: string }; Returns: number }
      recompute_trust_profile: {
        Args: { _user_id: string }
        Returns: undefined
      }
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
      tier_from_tc: {
        Args: { _tc: number }
        Returns: Database["public"]["Enums"]["trust_tier"]
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
      update_livestream_viewers: {
        Args: { p_count: number; p_livestream_id: string }
        Returns: undefined
      }
      wipe_user_rewards: {
        Args: { p_admin_id: string; p_user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user" | "owner"
      did_entity_type:
        | "human"
        | "organization"
        | "ai_agent"
        | "validator"
        | "merchant"
      did_level: "L0" | "L1" | "L2" | "L3" | "L4"
      did_status:
        | "pending"
        | "basic"
        | "verified"
        | "trusted"
        | "restricted"
        | "suspended"
      identity_link_type:
        | "wallet"
        | "social"
        | "device"
        | "organization"
        | "referrer"
        | "mentor"
      pplp_event_type:
        | "LOGIN"
        | "LIGHT_CHECKIN"
        | "PROFILE_COMPLETED"
        | "PPLP_ACCEPTED"
        | "MANTRA_ACK"
        | "POST_CREATED"
        | "COMMENT_CREATED"
        | "VIDEO_UPLOADED"
        | "COURSE_PUBLISHED"
        | "LIKE_GIVEN"
        | "SHARE_GIVEN"
        | "BOOKMARK_GIVEN"
        | "HELP_NEWBIE"
        | "ANSWER_QUESTION"
        | "MENTOR_SESSION"
        | "REPORT_SUBMITTED"
        | "MEDIATION_JOINED"
        | "RESOLUTION_ACCEPTED"
        | "DONATION_MADE"
        | "REWARD_SENT"
        | "GOV_VOTE_CAST"
        | "BUG_REPORTED"
        | "PR_MERGED"
        | "PROPOSAL_SUBMITTED"
        | "ONCHAIN_TX_VERIFIED"
        | "PPLP_RATING_SUBMITTED"
      sbt_category:
        | "identity"
        | "trust"
        | "contribution"
        | "credential"
        | "milestone"
        | "legacy"
      sbt_issue_mode: "auto" | "semi_auto" | "governance"
      sbt_status: "active" | "frozen" | "revoked" | "archived"
      trust_tier: "T0" | "T1" | "T2" | "T3" | "T4"
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
      did_entity_type: [
        "human",
        "organization",
        "ai_agent",
        "validator",
        "merchant",
      ],
      did_level: ["L0", "L1", "L2", "L3", "L4"],
      did_status: [
        "pending",
        "basic",
        "verified",
        "trusted",
        "restricted",
        "suspended",
      ],
      identity_link_type: [
        "wallet",
        "social",
        "device",
        "organization",
        "referrer",
        "mentor",
      ],
      pplp_event_type: [
        "LOGIN",
        "LIGHT_CHECKIN",
        "PROFILE_COMPLETED",
        "PPLP_ACCEPTED",
        "MANTRA_ACK",
        "POST_CREATED",
        "COMMENT_CREATED",
        "VIDEO_UPLOADED",
        "COURSE_PUBLISHED",
        "LIKE_GIVEN",
        "SHARE_GIVEN",
        "BOOKMARK_GIVEN",
        "HELP_NEWBIE",
        "ANSWER_QUESTION",
        "MENTOR_SESSION",
        "REPORT_SUBMITTED",
        "MEDIATION_JOINED",
        "RESOLUTION_ACCEPTED",
        "DONATION_MADE",
        "REWARD_SENT",
        "GOV_VOTE_CAST",
        "BUG_REPORTED",
        "PR_MERGED",
        "PROPOSAL_SUBMITTED",
        "ONCHAIN_TX_VERIFIED",
        "PPLP_RATING_SUBMITTED",
      ],
      sbt_category: [
        "identity",
        "trust",
        "contribution",
        "credential",
        "milestone",
        "legacy",
      ],
      sbt_issue_mode: ["auto", "semi_auto", "governance"],
      sbt_status: ["active", "frozen", "revoked", "archived"],
      trust_tier: ["T0", "T1", "T2", "T3", "T4"],
    },
  },
} as const
