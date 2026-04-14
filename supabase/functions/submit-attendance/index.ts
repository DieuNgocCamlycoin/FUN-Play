/**
 * submit-attendance — User check-in/out + participation_factor calculation
 * PRD Section 9.5
 * 
 * Auto-creates a user_action when confirmed, linking to PPLP pipeline.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.84.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Minimum duration (minutes) to count as meaningful participation
const MIN_DURATION_THRESHOLD = 15;
const GOOD_DURATION_THRESHOLD = 30;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const authHeader = req.headers.get("Authorization");
    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader || "" } } }
    );

    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { group_id, action, reflection_text, leader_confirm_user_id } = body;

    if (!group_id || !action) {
      return new Response(JSON.stringify({ error: "group_id and action (check_in|check_out|confirm|reflect) required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify group exists
    const { data: group } = await supabaseAdmin
      .from("love_house_groups")
      .select("id, event_id, leader_user_id")
      .eq("id", group_id)
      .single();

    if (!group) {
      return new Response(JSON.stringify({ error: "Group not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // === CHECK-IN ===
    if (action === "check_in") {
      const { data: existing } = await supabaseAdmin
        .from("attendance")
        .select("id")
        .eq("group_id", group_id)
        .eq("user_id", user.id)
        .single();

      if (existing) {
        return new Response(JSON.stringify({ error: "Already checked in" }), {
          status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: attendance, error } = await supabaseAdmin
        .from("attendance")
        .insert({
          group_id,
          user_id: user.id,
          check_in_at: new Date().toISOString(),
          confirmation_status: "checked_in",
          participation_factor: 0.0,
        })
        .select("id, check_in_at, confirmation_status")
        .single();

      if (error) throw error;

      // Update group actual_count
      await supabaseAdmin.rpc("increment_field", { table_name: "love_house_groups", row_id: group_id, field_name: "actual_count" }).catch(() => {
        // Fallback: manual update
        supabaseAdmin.from("love_house_groups").update({ actual_count: (group as any).actual_count + 1 }).eq("id", group_id);
      });

      return new Response(JSON.stringify({ attendance, message: "Checked in successfully" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // === CHECK-OUT ===
    if (action === "check_out") {
      const { data: attendance } = await supabaseAdmin
        .from("attendance")
        .select("*")
        .eq("group_id", group_id)
        .eq("user_id", user.id)
        .single();

      if (!attendance) {
        return new Response(JSON.stringify({ error: "Not checked in" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const checkOutAt = new Date();
      const checkInAt = new Date(attendance.check_in_at);
      const durationMinutes = Math.round((checkOutAt.getTime() - checkInAt.getTime()) / 60000);

      // Calculate participation_factor based on PRD Section 9.5
      const pf = calculateParticipationFactor(durationMinutes, attendance.leader_confirmed, attendance.reflection_submitted);

      const { data: updated, error } = await supabaseAdmin
        .from("attendance")
        .update({
          check_out_at: checkOutAt.toISOString(),
          duration_minutes: durationMinutes,
          confirmation_status: pf >= 0.5 ? "confirmed" : "partial",
          participation_factor: pf,
        })
        .eq("id", attendance.id)
        .select("id, duration_minutes, participation_factor, confirmation_status")
        .single();

      if (error) throw error;

      // Auto-create user_action if participation confirmed
      let linkedAction = null;
      if (pf >= 0.5) {
        linkedAction = await createLinkedAction(supabaseAdmin, user.id, group, attendance.id, durationMinutes, pf);
      }

      return new Response(JSON.stringify({ attendance: updated, linked_action: linkedAction }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // === LEADER CONFIRM ===
    if (action === "confirm") {
      if (user.id !== group.leader_user_id) {
        return new Response(JSON.stringify({ error: "Only group leader can confirm attendance" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!leader_confirm_user_id) {
        return new Response(JSON.stringify({ error: "leader_confirm_user_id required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: attendance } = await supabaseAdmin
        .from("attendance")
        .select("*")
        .eq("group_id", group_id)
        .eq("user_id", leader_confirm_user_id)
        .single();

      if (!attendance) {
        return new Response(JSON.stringify({ error: "Attendance record not found" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const pf = calculateParticipationFactor(attendance.duration_minutes || 0, true, attendance.reflection_submitted);

      const { data: updated, error } = await supabaseAdmin
        .from("attendance")
        .update({
          leader_confirmed: true,
          participation_factor: pf,
          confirmation_status: pf >= 0.5 ? "confirmed" : "partial",
        })
        .eq("id", attendance.id)
        .select("id, participation_factor, confirmation_status, leader_confirmed")
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({ attendance: updated }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // === SUBMIT REFLECTION ===
    if (action === "reflect") {
      if (!reflection_text || String(reflection_text).trim().length < 10) {
        return new Response(JSON.stringify({ error: "Reflection must be at least 10 characters" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: attendance } = await supabaseAdmin
        .from("attendance")
        .select("*")
        .eq("group_id", group_id)
        .eq("user_id", user.id)
        .single();

      if (!attendance) {
        return new Response(JSON.stringify({ error: "Attendance record not found" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const pf = calculateParticipationFactor(attendance.duration_minutes || 0, attendance.leader_confirmed, true);

      const { data: updated, error } = await supabaseAdmin
        .from("attendance")
        .update({
          reflection_submitted: true,
          reflection_text: String(reflection_text).slice(0, 2000),
          participation_factor: pf,
          confirmation_status: pf >= 0.5 ? "confirmed" : "partial",
        })
        .eq("id", attendance.id)
        .select("id, participation_factor, confirmation_status, reflection_submitted")
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({ attendance: updated }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action. Use: check_in, check_out, confirm, reflect" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("submit-attendance error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

/**
 * PRD Section 9.5 — Participation Factor (0.0–1.0)
 * Signals:
 * - duration >= MIN_DURATION_THRESHOLD: +0.3
 * - duration >= GOOD_DURATION_THRESHOLD: +0.2 (total 0.5 for duration)
 * - leader_confirmed: +0.3
 * - reflection_submitted: +0.2
 */
function calculateParticipationFactor(durationMinutes: number, leaderConfirmed: boolean, reflectionSubmitted: boolean): number {
  let pf = 0;

  if (durationMinutes >= MIN_DURATION_THRESHOLD) pf += 0.3;
  if (durationMinutes >= GOOD_DURATION_THRESHOLD) pf += 0.2;
  if (leaderConfirmed) pf += 0.3;
  if (reflectionSubmitted) pf += 0.2;

  return Math.min(1.0, Math.round(pf * 100) / 100);
}

/**
 * Auto-create a user_action linked to this attendance for PPLP pipeline
 */
async function createLinkedAction(supabase: any, userId: string, group: any, attendanceId: string, durationMinutes: number, participationFactor: number) {
  try {
    // Get event details
    const { data: event } = await supabase
      .from("events")
      .select("title, platform_links")
      .eq("id", group.event_id)
      .single();

    // Find INNER_WORK or CHANNELING action type
    const { data: actionType } = await supabase
      .from("action_types")
      .select("id")
      .eq("code", "INNER_WORK")
      .eq("is_active", true)
      .single();

    if (!actionType) return null;

    const { data: action, error } = await supabase
      .from("user_actions")
      .insert({
        user_id: userId,
        action_type_id: actionType.id,
        title: `Attended: ${event?.title || "Love House Session"}`,
        description: `Participated for ${durationMinutes} minutes. Participation factor: ${participationFactor}`,
        status: "submitted",
        source_platform: "love_house",
        raw_metadata: {
          attendance_id: attendanceId,
          group_id: group.id,
          event_id: group.event_id,
          duration_minutes: durationMinutes,
          participation_factor: participationFactor,
        },
      })
      .select("id")
      .single();

    if (error) {
      console.error("Failed to create linked action:", error);
      return null;
    }

    // Link attendance to action
    await supabase
      .from("attendance")
      .update({ linked_action_id: action.id })
      .eq("id", attendanceId);

    // Auto-attach proof
    await supabase
      .from("proofs")
      .insert({
        action_id: action.id,
        proof_type: "system_log",
        proof_url: null,
        external_ref: `attendance:${attendanceId}`,
        raw_metadata: {
          type: "attendance_verification",
          duration_minutes: durationMinutes,
          participation_factor: participationFactor,
        },
      });

    return { action_id: action.id };
  } catch (e) {
    console.error("createLinkedAction error:", e);
    return null;
  }
}
