import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const PPLP_SYSTEM_PROMPT = `Bạn là Angel AI - Thiên thần kiểm duyệt nội dung cho nền tảng FUN Play, hoạt động theo Hiến pháp Ánh sáng và Protocol PPLP (Purpose, Peace, Love, Purity).

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
- ❌ Thông tin sai lệch nguy hiểm`;

interface ModerationResult {
  approved: boolean;
  reason: string;
  score: number;
}

/**
 * 🌟 PRIMARY: Angel AI from angel.fun.rich
 */
async function tryAngelAI(content: string, contentType: string): Promise<ModerationResult | null> {
  const ANGEL_AI_API_KEY = Deno.env.get("ANGEL_AI_API_KEY");
  if (!ANGEL_AI_API_KEY) {
    console.log("[moderate] ANGEL_AI_API_KEY not configured, skipping Angel AI");
    return null;
  }

  try {
    console.log("🌟 [moderate] Trying Angel AI from angel.fun.rich...");
    
    const contentLabel = contentType === 'comment' ? 'bình luận' : contentType === 'video_title' ? 'tiêu đề video' : 'mô tả video';
    
    const messages = [
      {
        role: "system",
        content: `${PPLP_SYSTEM_PROMPT}

Bạn đang kiểm duyệt một ${contentLabel}.

Trả lời bằng JSON với format:
{"approved": true/false, "reason": "lý do ngắn gọn", "score": 1-10}

score: 1 = vi phạm nghiêm trọng, 5 = trung tính, 10 = rất tích cực
approved = false nếu score < 3`
      },
      {
        role: "user",
        content: `Kiểm duyệt nội dung sau:\n\n"${content}"`
      }
    ];

    const response = await fetch(
      "https://ssjoetiitctqzapymtzl.supabase.co/functions/v1/angel-chat",
      {
        method: "POST",
        headers: {
          "x-api-key": ANGEL_AI_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[moderate] Angel AI error:", response.status, errorText);
      return null;
    }

    const text = await response.text();
    console.log("🌟 [moderate] Angel AI raw (first 300):", text.slice(0, 300));

    // Parse SSE or JSON response
    let fullContent = "";

    if (text.startsWith("data:") || text.includes("\ndata:")) {
      const lines = text.split("\n");
      for (const line of lines) {
        if (line.startsWith("data:")) {
          const jsonStr = line.slice(5).trim();
          if (jsonStr === "[DONE]" || jsonStr === "") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) fullContent += delta;
            if (parsed.response) { fullContent = parsed.response; break; }
          } catch { continue; }
        }
      }
    } else {
      try {
        const data = JSON.parse(text);
        fullContent = data.response || data.choices?.[0]?.message?.content || "";
      } catch {
        console.error("[moderate] Angel AI: Unable to parse response");
        return null;
      }
    }

    if (!fullContent) return null;

    // Extract JSON from Angel AI response
    const result = extractModerationResult(fullContent);
    if (result) {
      console.log("🌟 [moderate] Angel AI moderation result:", JSON.stringify(result));
      return result;
    }

    return null;
  } catch (error) {
    console.error("[moderate] Angel AI exception:", error);
    return null;
  }
}

/**
 * ✨ FALLBACK: Lovable AI (Gemini)
 */
async function tryLovableAI(content: string, contentType: string): Promise<ModerationResult | null> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    console.warn("[moderate] LOVABLE_API_KEY not configured, auto-approving");
    return null;
  }

  try {
    console.log("✨ [moderate] Fallback to Lovable AI (Gemini)...");

    const contentLabel = contentType === 'comment' ? 'bình luận' : contentType === 'video_title' ? 'tiêu đề video' : 'mô tả video';

    const systemPrompt = `${PPLP_SYSTEM_PROMPT}

Bạn đang kiểm duyệt một ${contentLabel}.

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
          { role: "user", content: `Kiểm duyệt nội dung sau:\n\n"${content}"` },
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
      console.error("[moderate] Lovable AI error:", response.status);
      await response.text(); // consume
      return null;
    }

    const data = await response.json();

    // Extract tool call result
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      try {
        const result = JSON.parse(toolCall.function.arguments);
        console.log("✨ [moderate] Lovable AI moderation result:", JSON.stringify(result));
        return {
          approved: result.approved ?? true,
          reason: result.reason ?? 'OK',
          score: result.score ?? 7,
        };
      } catch {}
    }

    // Fallback: message content
    const messageContent = data.choices?.[0]?.message?.content;
    if (messageContent) {
      const result = extractModerationResult(messageContent);
      if (result) return result;
    }

    return null;
  } catch (error) {
    console.error("[moderate] Lovable AI exception:", error);
    return null;
  }
}

/**
 * Extract moderation JSON from free-text AI response
 */
function extractModerationResult(text: string): ModerationResult | null {
  try {
    const jsonMatch = text.match(/\{[\s\S]*?"approved"[\s\S]*?"score"[\s\S]*?\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        approved: parsed.approved ?? true,
        reason: parsed.reason ?? 'OK',
        score: typeof parsed.score === 'number' ? parsed.score : 7,
      };
    }
  } catch {}

  // Try simpler match
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if ('approved' in parsed || 'score' in parsed) {
        return {
          approved: parsed.approved ?? true,
          reason: parsed.reason ?? 'OK',
          score: typeof parsed.score === 'number' ? parsed.score : 7,
        };
      }
    }
  } catch {}

  return null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content, contentType } = await req.json();

    if (!content || typeof content !== 'string') {
      return new Response(
        JSON.stringify({ approved: true, reason: 'No content to moderate', score: 10, provider: 'skip' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const trimmed = content.trim();
    if (trimmed.length === 0) {
      return new Response(
        JSON.stringify({ approved: true, reason: 'Empty content', score: 10, provider: 'skip' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1️⃣ PRIMARY: Angel AI from angel.fun.rich
    let result = await tryAngelAI(trimmed, contentType);
    let provider = 'angel-ai';

    // 2️⃣ FALLBACK: Lovable AI (Gemini)
    if (!result) {
      result = await tryLovableAI(trimmed, contentType);
      provider = 'lovable-ai';
    }

    // 3️⃣ FAIL-OPEN: Auto-approve if all AI unavailable
    if (!result) {
      console.warn("[moderate] All AI providers failed, auto-approving");
      result = { approved: true, reason: 'Moderation unavailable, auto-approved', score: 7 };
      provider = 'auto';
    }

    console.log(`✅ [moderate] Final result (${provider}):`, JSON.stringify(result));

    return new Response(
      JSON.stringify({ ...result, provider }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("[moderate] Error:", error);
    return new Response(
      JSON.stringify({ approved: true, reason: 'Error occurred, auto-approved', score: 7, provider: 'error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
