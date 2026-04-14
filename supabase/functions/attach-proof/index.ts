import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.84.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing auth" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = await req.json();
    const { action_id, proof_type, proof_url, file_hash, external_ref, metadata } = body;

    if (!action_id || !proof_type) {
      return new Response(JSON.stringify({ error: "action_id and proof_type required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Validate proof_type
    const validTypes = ["link", "video", "image", "document", "onchain_tx", "system_log", "manual_attestation"];
    if (!validTypes.includes(proof_type)) {
      return new Response(JSON.stringify({ error: `Invalid proof_type. Must be: ${validTypes.join(", ")}` }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // No Proof → No Score: proof_url required for link/video/image
    if (["link", "video", "image"].includes(proof_type) && !proof_url) {
      return new Response(JSON.stringify({ error: "🚫 No Proof → No Score → No Mint. proof_url required." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Verify action belongs to user
    const { data: action, error: actionErr } = await supabase
      .from("user_actions")
      .select("id, user_id, status")
      .eq("id", action_id)
      .single();

    if (actionErr || !action || action.user_id !== user.id) {
      return new Response(JSON.stringify({ error: "Action not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Duplicate proof detection (cross-action)
    if (proof_url) {
      const { count } = await supabase
        .from("proofs")
        .select("id", { count: "exact", head: true })
        .eq("proof_url", proof_url);

      if ((count ?? 0) > 0) {
        return new Response(JSON.stringify({ error: "⚠️ This proof URL has already been used" }), { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    // Duplicate file_hash detection
    if (file_hash) {
      const { count } = await supabase
        .from("proofs")
        .select("id", { count: "exact", head: true })
        .eq("file_hash", file_hash);

      if ((count ?? 0) > 0) {
        return new Response(JSON.stringify({ error: "⚠️ This proof file has already been submitted (duplicate hash)" }), { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    // Insert proof
    const { data: proof, error: insertErr } = await supabase
      .from("proofs")
      .insert({
        action_id,
        proof_type,
        proof_url: proof_url || null,
        file_hash: file_hash || null,
        external_ref: external_ref || null,
        raw_metadata: metadata || {},
      })
      .select("id")
      .single();

    if (insertErr) {
      console.error("Insert proof error:", insertErr);
      return new Response(JSON.stringify({ error: "Failed to attach proof" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // hasMinimumProof gate: count qualifying proofs for this action
    const { count: proofCount } = await supabase
      .from("proofs")
      .select("id", { count: "exact", head: true })
      .eq("action_id", action_id);

    const qualifyingProofTypes = ["link", "video", "image", "document", "onchain_tx"];
    const { count: qualifyingCount } = await supabase
      .from("proofs")
      .select("id", { count: "exact", head: true })
      .eq("action_id", action_id)
      .in("proof_type", qualifyingProofTypes);

    // Only move to under_review if at least 1 qualifying proof exists
    const hasMinimumProof = (qualifyingCount ?? 0) >= 1;
    const newStatus = hasMinimumProof ? "under_review" : "proof_pending";

    // Only update if status should change
    if (action.status === "proof_pending" || (action.status !== "under_review" && hasMinimumProof)) {
      await supabase
        .from("user_actions")
        .update({ status: newStatus })
        .eq("id", action_id);
    }

    return new Response(JSON.stringify({ 
      proof_id: proof.id, 
      action_status: newStatus,
      total_proofs: proofCount ?? 0,
      has_minimum_proof: hasMinimumProof,
    }), {
      status: 201,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("attach-proof error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
