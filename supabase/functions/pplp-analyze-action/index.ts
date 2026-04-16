/**
 * pplp-analyze-action — AI Feature Extraction for PPLP Engine v2.0
 * Uses Lovable AI (Gemini Flash) for NLP analysis of user actions
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.84.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ANALYSIS_TOOL = {
  type: "function",
  function: {
    name: "analyze_pplp_action",
    description: "Phân tích giá trị thật của hành động con người theo 5 trụ cột PPLP",
    parameters: {
      type: "object",
      properties: {
        gratitude_score: { type: "number", description: "Mức độ Biết Ơn (0-1)" },
        repentance_score: { type: "number", description: "Mức độ Sám Hối/chuyển hoá (0-1)" },
        ego_signal: { type: "number", description: "Dấu hiệu bản ngã/ego (0-1, cao = xấu)" },
        authenticity: { type: "number", description: "Độ chân thật (0-1)" },
        love_tone: { type: "number", description: "Năng lượng yêu thương (0-1)" },
        depth: { type: "number", description: "Độ sâu nội dung/chuyển hoá thật (0-1)" },
        community_impact: { type: "number", description: "Ảnh hưởng tích cực lên cộng đồng (0-1)" },
        response_quality: { type: "number", description: "Chất lượng phản hồi/tương tác (0-1)" },
        reasoning: { type: "string", description: "Giải thích ngắn lý do cho các điểm số" },
      },
      required: ["gratitude_score", "repentance_score", "ego_signal", "authenticity", "love_tone", "depth", "community_impact", "response_quality", "reasoning"],
      additionalProperties: false,
    },
  },
};

const SYSTEM_PROMPT = `Bạn là PPLP AI — hệ thống phân tích giá trị thật của hành động con người.

Bạn đánh giá dựa trên 5 trụ cột:
1. Sám Hối — nhận ra lỗi lầm, chuyển hoá
2. Biết Ơn — lòng biết ơn chân thành
3. Phụng Sự — hành động vì cộng đồng
4. Giúp Đỡ — hỗ trợ người khác thực tế
5. Trao Tặng — cho đi vô điều kiện

QUY TẮC:
- Đo CHẤT LƯỢNG, KHÔNG đo số lượng
- Ego cao = điểm thấp (ego_signal cao)
- Giúp người thật = community_impact cao
- Spam/sao chép = authenticity thấp, ego_signal cao
- Tìm "linh hồn của hành động"

Luôn trả kết quả qua tool call analyze_pplp_action.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Auth
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
    const { activity_type, platform, content, metrics, proof_link, timestamp } = body;

    if (!content || !proof_link) {
      return new Response(JSON.stringify({ error: "content and proof_link are required (Rule #1: No Proof → No Score)" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userPrompt = `Phân tích hành động:
Platform: ${platform || 'internal'}
Loại: ${activity_type || 'post'}
Nội dung: ${content}
Metrics: likes=${metrics?.likes || 0}, comments=${metrics?.comments || 0}, shares=${metrics?.shares || 0}, watch_time=${metrics?.watch_time || 0}s
Bằng chứng: ${proof_link}
Thời gian: ${timestamp || new Date().toISOString()}

Phân tích sâu: ý định thật, chuyển hoá thật, ego, có giúp người thật không, mức chân thành.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        tools: [ANALYSIS_TOOL],
        tool_choice: { type: "function", function: { name: "analyze_pplp_action" } },
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again later" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiResponse.text();
      console.error("AI gateway error:", status, errText);
      return new Response(JSON.stringify({ error: "AI analysis failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall || toolCall.function.name !== "analyze_pplp_action") {
      console.error("Unexpected AI response:", JSON.stringify(aiData));
      return new Response(JSON.stringify({ error: "AI did not return expected analysis" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const analysis = JSON.parse(toolCall.function.arguments);

    // Clamp all scores to 0-1
    const clamp = (v: number) => Math.max(0, Math.min(1, v));

    const features = {
      gratitude_score: clamp(analysis.gratitude_score),
      repentance_score: clamp(analysis.repentance_score),
      ego_signal: clamp(analysis.ego_signal),
      authenticity: clamp(analysis.authenticity),
      love_tone: clamp(analysis.love_tone),
      depth: clamp(analysis.depth),
      community_impact: clamp(analysis.community_impact),
      response_quality: clamp(analysis.response_quality),
      reasoning: analysis.reasoning || '',
    };

    // Calculate engagement quality from metrics
    const commentQ = Math.min(1, Math.sqrt((metrics?.comments || 0) / 10));
    const watchQ = Math.min(1, Math.sqrt(((metrics?.watch_time || 0) / 60) / 30));
    const likes = metrics?.likes || 1;
    const depthQ = Math.min(1, ((metrics?.comments || 0) + (metrics?.shares || 0)) / likes);
    const engagement_quality = Math.round((commentQ * 0.4 + watchQ * 0.35 + depthQ * 0.25) * 10000) / 10000;

    // Store analysis in DB if submission_id provided
    if (body.submission_id) {
      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      await supabaseAdmin
        .from("pplp_activity_submissions")
        .update({
          ai_analysis: { ...features, engagement_quality },
          analyzed_at: new Date().toISOString(),
          proof_status: 'analyzed',
        })
        .eq("id", body.submission_id);
    }

    return new Response(JSON.stringify({
      features: { ...features, engagement_quality, consistency: 0.5 },
      user_id: user.id,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("pplp-analyze-action error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
