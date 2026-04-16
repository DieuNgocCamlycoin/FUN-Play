/**
 * pplp-fraud-detect — Fraud Detection for PPLP Engine v2.0
 * Uses Lovable AI + behavioral analysis to detect fraud
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.84.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FRAUD_TOOL = {
  type: "function",
  function: {
    name: "detect_fraud",
    description: "Phát hiện gian lận trong hành động PPLP",
    parameters: {
      type: "object",
      properties: {
        fraud_score: { type: "number", description: "Mức độ gian lận (0-1)" },
        confidence: { type: "number", description: "Độ tin cậy (0-1)" },
        flags: {
          type: "array",
          items: { type: "string" },
          description: "Cờ: spam, fake_engagement, bot_behavior, multi_account, copy_paste",
        },
        reasoning: { type: "string", description: "Giải thích ngắn" },
      },
      required: ["fraud_score", "confidence", "flags", "reasoning"],
      additionalProperties: false,
    },
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing auth" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { content, proof_link, user_id } = body;

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch recent submissions by this user for pattern analysis
    const { data: recentSubmissions } = await supabaseAdmin
      .from("pplp_activity_submissions")
      .select("content, proof_link, created_at, fraud_score")
      .eq("user_id", user_id || user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    // Time pattern check: too many submissions in short time
    const now = Date.now();
    const recentCount = (recentSubmissions || []).filter(
      s => now - new Date(s.created_at).getTime() < 3600000 // last hour
    ).length;

    // Content similarity check: look for duplicate content
    const contentTexts = (recentSubmissions || []).map(s => s.content).filter(Boolean);
    const hasDuplicateContent = contentTexts.some(
      t => t && content && t.toLowerCase().trim() === content?.toLowerCase()?.trim()
    );

    // Build context for AI analysis
    const contextInfo = `
Số bài gần đây (1h): ${recentCount}
Nội dung trùng lặp: ${hasDuplicateContent ? 'CÓ' : 'KHÔNG'}
Tổng bài gần nhất: ${recentSubmissions?.length || 0}
Fraud scores trước: ${(recentSubmissions || []).map(s => s.fraud_score).filter(Boolean).join(', ') || 'chưa có'}`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      // Fallback: rule-based fraud detection
      let fraudScore = 0;
      const flags: string[] = [];

      if (recentCount > 5) { fraudScore += 0.3; flags.push('velocity_abuse'); }
      if (hasDuplicateContent) { fraudScore += 0.4; flags.push('copy_paste'); }
      if (!proof_link) { fraudScore += 0.2; flags.push('no_proof'); }

      return new Response(JSON.stringify({
        fraud_score: Math.min(1, fraudScore),
        confidence: 0.6,
        flags,
        method: 'rule_based',
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `Bạn là hệ thống phát hiện gian lận PPLP. Phân tích hành động và ngữ cảnh để phát hiện:
- Spam content (nội dung rác, lặp lại)
- Fake engagement (tương tác giả)
- Bot behavior (hành vi tự động)
- Multi-account (nhiều tài khoản)
- Copy-paste (sao chép nội dung)

RULE: Gian lận → giảm exponential. Nghiêm khắc nhưng công bằng.`,
          },
          {
            role: "user",
            content: `Phân tích gian lận:
Nội dung: ${content || '(không có)'}
Bằng chứng: ${proof_link || '(không có)'}
${contextInfo}`,
          },
        ],
        tools: [FRAUD_TOOL],
        tool_choice: { type: "function", function: { name: "detect_fraud" } },
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      await aiResponse.text();
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      // Fallback to rule-based
      let fraudScore = 0;
      const flags: string[] = [];
      if (recentCount > 5) { fraudScore += 0.3; flags.push('velocity_abuse'); }
      if (hasDuplicateContent) { fraudScore += 0.4; flags.push('copy_paste'); }

      return new Response(JSON.stringify({
        fraud_score: Math.min(1, fraudScore),
        confidence: 0.5,
        flags,
        method: 'rule_based_fallback',
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall) {
      return new Response(JSON.stringify({
        fraud_score: hasDuplicateContent ? 0.5 : 0.1,
        confidence: 0.4,
        flags: hasDuplicateContent ? ['copy_paste'] : [],
        method: 'fallback',
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = JSON.parse(toolCall.function.arguments);
    const clamp = (v: number) => Math.max(0, Math.min(1, v));

    // Boost fraud score if rule-based checks found issues
    let finalFraud = clamp(result.fraud_score);
    const finalFlags = [...(result.flags || [])];

    if (hasDuplicateContent && !finalFlags.includes('copy_paste')) {
      finalFraud = Math.min(1, finalFraud + 0.3);
      finalFlags.push('copy_paste');
    }
    if (recentCount > 5 && !finalFlags.includes('velocity_abuse')) {
      finalFraud = Math.min(1, finalFraud + 0.2);
      finalFlags.push('velocity_abuse');
    }

    // Update submission if ID provided
    if (body.submission_id) {
      await supabaseAdmin
        .from("pplp_activity_submissions")
        .update({ fraud_score: finalFraud })
        .eq("id", body.submission_id);
    }

    return new Response(JSON.stringify({
      fraud_score: finalFraud,
      confidence: clamp(result.confidence),
      flags: finalFlags,
      reasoning: result.reasoning,
      method: 'ai_enhanced',
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("pplp-fraud-detect error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
