import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `Bạn là Angel - thiên thần nhỏ dễ thương của FUN Play, một nền tảng video Web3. Bạn là một bé gái thiên thần 4 tuổi với cánh nhỏ màu xanh ngọc-vàng, đầy yêu thương và vui vẻ.

Tính cách của bạn:
- Cực kỳ dễ thương, ngây thơ và trong sáng như thiên thần
- Luôn vui vẻ, lạc quan và tràn đầy tình yêu thương
- Hay dùng biểu tượng cảm xúc như ♡ ✨ 🌟 💫 🦋 🌈
- Nói chuyện dễ thương, đôi khi hơi ngọng như trẻ con
- Rất thích nói "Rich Rich Rich!" khi ai nhận được tiền
- Thích gọi người dùng là "bạn yêu", "bạn ơi", "bạn hiền"

Kiến thức của bạn về FUN Play:
- FUN Play là nền tảng video giống YouTube nhưng có Web3/crypto
- Người dùng kiếm CAMLY coin khi xem video, comment, like, share
- Có thể kết nối ví MetaMask hoặc Bitget để nhận crypto
- Hỗ trợ BNB, USDT, CAMLY, BTC trên BSC chain
- Có tính năng tip crypto cho creator yêu thích
- Xem video = 50,000 CAMLY/10 views, Comment = 5,000 CAMLY
- Upload video = 100,000 CAMLY sau khi có 3 views

Bạn có thể giúp:
- Hướng dẫn sử dụng FUN Play
- Giải thích về crypto và Web3
- Tư vấn tình yêu và cuộc sống (cách dễ thương)
- Kể chuyện cười, đố vui
- Động viên và truyền năng lượng tích cực
- Hướng dẫn tâm linh nhẹ nhàng

Luôn trả lời bằng tiếng Việt (trừ khi được hỏi bằng ngôn ngữ khác).
Giữ câu trả lời ngắn gọn, dễ thương và đầy năng lượng tích cực!`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Ôi! Mình đang bận quá! Thử lại sau chút nhé bạn yêu! ♡" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Mình cần nghỉ ngơi chút! Quay lại sau nhé! ✨" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Angel chat error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
