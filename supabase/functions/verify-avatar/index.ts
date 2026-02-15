import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;
    const { avatarUrl } = await req.json();

    if (!avatarUrl) {
      return new Response(JSON.stringify({ error: "Missing avatarUrl" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use Gemini to analyze if the image contains a real human face
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this profile picture. Does it contain a clear, real photograph of a human face (not a cartoon, anime, logo, AI-generated avatar, or random image)? 
                
Reply with ONLY one word: YES or NO.

Rules:
- YES: Real photo of a person's face (selfie, portrait, headshot)
- NO: Cartoon, anime, logo, text, animal, landscape, abstract art, AI-generated face, default avatar, or any non-real-person image`,
              },
              {
                type: "image_url",
                image_url: { url: avatarUrl },
              },
            ],
          },
        ],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "AI rate limit, try again later", verified: false }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      return new Response(JSON.stringify({ error: "AI analysis failed", verified: false }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const aiAnswer = (aiData.choices?.[0]?.message?.content || "").trim().toUpperCase();
    const isVerified = aiAnswer.startsWith("YES");

    console.log(`Avatar verification for user ${userId}: AI says "${aiAnswer}" → verified=${isVerified}`);

    // Update profile with verification result using service role
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({ avatar_verified: isVerified })
      .eq("id", userId);

    if (updateError) {
      console.error("Failed to update avatar_verified:", updateError);
      return new Response(JSON.stringify({ error: "Failed to update verification status", verified: false }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ verified: isVerified, message: isVerified 
      ? "Ảnh đại diện đã được xác minh thành công! ✅" 
      : "Vui lòng sử dụng ảnh chân dung thật của bạn để xác minh." 
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("verify-avatar error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error", verified: false }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
