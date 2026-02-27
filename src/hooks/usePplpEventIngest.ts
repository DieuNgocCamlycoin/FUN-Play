import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type PplpEventType =
  | "LOGIN" | "LIGHT_CHECKIN" | "PROFILE_COMPLETED" | "PPLP_ACCEPTED" | "MANTRA_ACK"
  | "POST_CREATED" | "COMMENT_CREATED" | "VIDEO_UPLOADED" | "COURSE_PUBLISHED"
  | "LIKE_GIVEN" | "SHARE_GIVEN" | "BOOKMARK_GIVEN"
  | "HELP_NEWBIE" | "ANSWER_QUESTION" | "MENTOR_SESSION"
  | "REPORT_SUBMITTED" | "MEDIATION_JOINED" | "RESOLUTION_ACCEPTED"
  | "DONATION_MADE" | "REWARD_SENT" | "GOV_VOTE_CAST"
  | "BUG_REPORTED" | "PR_MERGED" | "PROPOSAL_SUBMITTED"
  | "ONCHAIN_TX_VERIFIED" | "PPLP_RATING_SUBMITTED";

interface PplpEvent {
  event_type: PplpEventType;
  target_type?: string;
  target_id?: string;
  context_id?: string;
  payload_json?: Record<string, unknown>;
  source?: string;
  scoring_tags?: string[];
}

export function usePplpEventIngest() {
  const { user } = useAuth();

  const ingestEvent = useCallback(
    async (event: PplpEvent) => {
      if (!user) return;
      try {
        const { data, error } = await supabase.functions.invoke("ingest-pplp-event", {
          body: event,
        });
        if (error) console.warn("[PPLP Ingest] Error:", error);
        return data;
      } catch (e) {
        console.warn("[PPLP Ingest] Failed:", e);
      }
    },
    [user]
  );

  const ingestBatch = useCallback(
    async (events: PplpEvent[]) => {
      if (!user || events.length === 0) return;
      try {
        const { data, error } = await supabase.functions.invoke("ingest-pplp-event", {
          body: events,
        });
        if (error) console.warn("[PPLP Ingest] Batch error:", error);
        return data;
      } catch (e) {
        console.warn("[PPLP Ingest] Batch failed:", e);
      }
    },
    [user]
  );

  return { ingestEvent, ingestBatch };
}
