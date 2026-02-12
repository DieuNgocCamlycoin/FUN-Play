import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content, contentType } = await req.json();
    // contentType: "video_title", "video_description", "comment"

    if (!content || typeof content !== 'string') {
      return new Response(
        JSON.stringify({ approved: true, reason: 'No content to moderate', score: 10 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const trimmed = content.trim();
    if (trimmed.length === 0) {
      return new Response(
        JSON.stringify({ approved: true, reason: 'Empty content', score: 10 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      // If no API key, auto-approve (fail open)
      console.warn("LOVABLE_API_KEY not configured, auto-approving content");
      return new Response(
        JSON.stringify({ approved: true, reason: 'Moderation unavailable', score: 10 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const systemPrompt = `Bạn là Angel AI - Thiên thần kiểm duyệt nội dung cho nền tảng FUN Play, hoạt động theo Hiến pháp Ánh sáng và Protocol PPLP (Purpose, Peace, Love, Purity).

Tiêu chuẩn PPLP cho nội dung:
- ✅ Tích cực, yêu thương, hướng thiện, lan tỏa ánh sáng
- ✅ Giáo dục, chia sẻ kiến thức hữu ích
- ✅ Thiền định, tâm linh, sức khỏe tinh thần
- ✅ Nghệ thuật, sáng tạo, giải trí lành mạnh
- ✅ Cộng đồng, kết nối, giúp đỡ nhau
- ❌ Bạo lực, thù ghét, kích động
- ❌ Nội dung khiêu dâm, đồi trụy
- ❌ Lừa đảo, scam, quảng cáo spam
- ❌ Ngôn từ tục tĩu, xúc phạm nặng nề
- ❌ Thông tin sai lệch nguy hiểm

Bạn đang kiểm duyệt một ${contentType === 'comment' ? 'bình luận' : contentType === 'video_title' ? 'tiêu đề video' : 'mô tả video'}.

Trả lời bằng JSON với format:
{"approved": true/false, "reason": "lý do ngắn gọn", "score": 1-10}

score: 1 = vi phạm nghiêm trọng, 5 = trung tính, 10 = rất tích cực
approved = false nếu score < 3`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Kiểm duyệt nội dung sau:\n\n"${trimmed}"` },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "moderate_result",
              description: "Return content moderation result",
              parameters: {
                type: "object",
                properties: {
                  approved: { type: "boolean", description: "Whether content is approved" },
                  reason: { type: "string", description: "Brief reason in Vietnamese" },
                  score: { type: "number", description: "Score 1-10" },
                },
                required: ["approved", "reason", "score"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "moderate_result" } },
      }),
    });

    if (!response.ok) {
      const status = response.status;
      console.error("AI gateway error:", status);
      // Fail open on AI errors
      return new Response(
        JSON.stringify({ approved: true, reason: 'Moderation service temporarily unavailable', score: 7 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    
    // Extract tool call result
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      try {
        const result = JSON.parse(toolCall.function.arguments);
        return new Response(
          JSON.stringify({
            approved: result.approved ?? true,
            reason: result.reason ?? 'OK',
            score: result.score ?? 7,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (parseError) {
        console.error("Failed to parse tool call result:", parseError);
      }
    }

    // Fallback: try to extract from message content
    const messageContent = data.choices?.[0]?.message?.content;
    if (messageContent) {
      try {
        const jsonMatch = messageContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const result = JSON.parse(jsonMatch[0]);
          return new Response(
            JSON.stringify({
              approved: result.approved ?? true,
              reason: result.reason ?? 'OK',
              score: result.score ?? 7,
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      } catch {}
    }

    // Default: approve if can't parse
    return new Response(
      JSON.stringify({ approved: true, reason: 'Unable to parse moderation result', score: 7 }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Moderation error:", error);
    return new Response(
      JSON.stringify({ approved: true, reason: 'Error occurred, auto-approved', score: 7 }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
