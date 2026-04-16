/**
 * Mint Epoch Engine — Orchestrator v2.0
 * 
 * Dispatches to the correct sub-job based on action:
 * - micro_preview: 7-day rolling preview
 * - validation: 14-day rolling validation
 * - mint_finalize: 28-day rolling mint
 * - vesting_release: daily unlock check
 * - inflation_health: daily health metrics
 * - auto: runs all in sequence
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    let action = "auto";
    try {
      const body = await req.json();
      action = body.action || "auto";
    } catch {
      // default
    }

    console.log(`[mint-epoch-engine] Orchestrator action: ${action}`);

    const results: Record<string, any> = {};

    const callFunction = async (fnName: string) => {
      try {
        const resp = await fetch(`${supabaseUrl}/functions/v1/${fnName}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${serviceKey}`,
          },
          body: JSON.stringify({}),
        });
        return await resp.json();
      } catch (err: any) {
        console.error(`[orchestrator] ${fnName} failed:`, err.message);
        return { error: err.message };
      }
    };

    if (action === "auto" || action === "micro_preview") {
      results.micro_preview = await callFunction("epoch-micro-preview");
    }

    if (action === "auto" || action === "validation") {
      results.validation = await callFunction("epoch-validation-window");
    }

    if (action === "auto" || action === "mint_finalize") {
      results.mint_finalize = await callFunction("epoch-mint-finalize");
    }

    if (action === "auto" || action === "vesting_release") {
      results.vesting_release = await callFunction("epoch-vesting-release");
    }

    if (action === "auto" || action === "inflation_health") {
      results.inflation_health = await callFunction("inflation-health");
    }

    // Legacy support: "create" and "finalize" map to mint_finalize
    if (action === "create" || action === "finalize") {
      results.mint_finalize = await callFunction("epoch-mint-finalize");
    }

    return new Response(
      JSON.stringify({ success: true, action, results }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("[mint-epoch-engine] Error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
