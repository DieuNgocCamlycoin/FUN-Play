import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// 🌟 Primary: ANGEL AI from angel.fun.rich
async function tryAngelAI(messages: any[]): Promise<{ content: string | null; provider: string }> {
  const ANGEL_AI_API_KEY = Deno.env.get("ANGEL_AI_API_KEY");
  if (!ANGEL_AI_API_KEY) {
    console.log("ANGEL_AI_API_KEY not configured, skipping ANGEL AI");
    return { content: null, provider: "" };
  }

  try {
    console.log("🌟 Trying ANGEL AI from angel.fun.rich...");
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
      console.error("ANGEL AI error:", response.status, errorText);
      return { content: null, provider: "" };
    }

    // Handle SSE streaming response from angel.fun.rich
    const text = await response.text();
    console.log("🌟 ANGEL AI raw response (first 200 chars):", text.slice(0, 200));
    
    // Check if it's SSE format (starts with "data:")
    if (text.startsWith("data:") || text.includes("\ndata:")) {
      let fullContent = "";
      const lines = text.split("\n");
      
      for (const line of lines) {
        if (line.startsWith("data:")) {
          const jsonStr = line.slice(5).trim(); // Remove "data:" prefix
          if (jsonStr === "[DONE]" || jsonStr === "") continue;
          
          try {
            const parsed = JSON.parse(jsonStr);
            // Handle OpenAI-style streaming format
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              fullContent += delta;
            }
            // Also check for direct response format
            if (parsed.response) {
              fullContent = parsed.response;
              break;
            }
          } catch {
            // Skip non-JSON lines
            continue;
          }
        }
      }
      
      if (fullContent) {
        console.log("🌟 ANGEL AI responded successfully (SSE)!");
        return { content: fullContent, provider: "angel-ai" };
      }
    }
    
    // Try parsing as regular JSON
    try {
      const data = JSON.parse(text);
      const content = data.response || data.choices?.[0]?.message?.content;
      if (content) {
        console.log("🌟 ANGEL AI responded successfully (JSON)!");
        return { content, provider: "angel-ai" };
      }
    } catch {
      console.error("ANGEL AI: Unable to parse response");
    }
    
    return { content: null, provider: "" };
  } catch (error) {
    console.error("ANGEL AI exception:", error);
    return { content: null, provider: "" };
  }
}

// Fallback 1: Grok (xAI)
async function tryGrok(messages: any[]): Promise<{ content: string | null; provider: string }> {
  const XAI_API_KEY = Deno.env.get("XAI_API_KEY");
  if (!XAI_API_KEY) {
    console.log("XAI_API_KEY not configured, skipping Grok");
    return { content: null, provider: "" };
  }

  try {
    console.log("🚀 Trying Grok (xAI)...");
    const response = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${XAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "grok-3",
        messages,
        max_tokens: 2048,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Grok error:", response.status, errorText);
      return { content: null, provider: "" };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (content) {
      console.log("🚀 Grok responded successfully!");
      return { content, provider: "grok" };
    }
    return { content: null, provider: "" };
  } catch (error) {
    console.error("Grok exception:", error);
    return { content: null, provider: "" };
  }
}

// Fallback 2: Lovable AI (Gemini)
async function tryLovableAI(messages: any[]): Promise<{ content: string | null; provider: string }> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    console.log("LOVABLE_API_KEY not configured");
    return { content: null, provider: "" };
  }

  try {
    console.log("✨ Trying Lovable AI (Gemini)...");
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Lovable AI error:", response.status, errorText);
      return { content: null, provider: "" };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (content) {
      console.log("✨ Lovable AI responded successfully!");
      return { content, provider: "lovable-ai" };
    }
    return { content: null, provider: "" };
  } catch (error) {
    console.error("Lovable AI exception:", error);
    return { content: null, provider: "" };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    console.log("📨 Received messages:", JSON.stringify(messages).slice(0, 200));

    // Try providers in order: ANGEL AI -> Grok -> Lovable AI
    let result: { content: string | null; provider: string } = { content: null, provider: "" };

    // 1. Try ANGEL AI first (PRIMARY - from angel.fun.rich)
    result = await tryAngelAI(messages);

    // 2. Fallback to Grok
    if (!result.content) {
      result = await tryGrok(messages);
    }

    // 3. Final fallback to Lovable AI
    if (!result.content) {
      result = await tryLovableAI(messages);
    }

    // If all providers failed
    if (!result.content) {
      console.error("❌ All AI providers failed!");
      return new Response(
        JSON.stringify({ 
          error: "Ôi! Angel đang nghỉ ngơi chút! Thử lại sau nhé bạn yêu! ♡",
          provider: "none"
        }), 
        {
          status: 503,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`✅ Response from ${result.provider}:`, result.content.slice(0, 100));

    return new Response(
      JSON.stringify({ 
        response: result.content, 
        provider: result.provider,
        success: true 
      }), 
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("Angel AI Proxy error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Lỗi không xác định",
        provider: "none"
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
