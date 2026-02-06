import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface SunoRequest {
  musicId: string;
  title: string;
  prompt?: string;
  lyrics?: string;
  style: string;
  instrumental: boolean;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  let musicIdForError: string | null = null;
  try {
    const SUNO_API_KEY = Deno.env.get("SUNO_API_KEY");
    if (!SUNO_API_KEY) {
      throw new Error("SUNO_API_KEY is not configured");
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase credentials not configured");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const body: SunoRequest = await req.json();
    const { musicId, title, prompt, lyrics, style, instrumental } = body;

    musicIdForError = musicId;

    console.log("Starting Suno music generation:", { musicId, title, style, instrumental });

    // Update status to processing
    await supabase
      .from("ai_generated_music")
      .update({ status: "processing" })
      .eq("id", musicId);

    // Build callback URL with musicId
    const callbackUrl = `${SUPABASE_URL}/functions/v1/generate-suno-music-callback?musicId=${encodeURIComponent(musicId)}`;
    const sunoRequestBody: Record<string, unknown> = {
      customMode: true,
      model: "V4_5ALL",
      title: title,
      style: style,
      instrumental: instrumental,
      callBackUrl: callbackUrl,
    };

    if (lyrics && lyrics.trim()) {
      sunoRequestBody.prompt = lyrics;
    } else if (prompt && prompt.trim()) {
      sunoRequestBody.prompt = prompt;
    } else {
      sunoRequestBody.prompt = `Create a ${style} song called "${title}"`;
    }

    console.log("Calling Suno API with body:", sunoRequestBody);

    const sunoResponse = await fetch("https://api.sunoapi.org/api/v1/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SUNO_API_KEY}`,
      },
      body: JSON.stringify(sunoRequestBody),
    });

    const responseText = await sunoResponse.text();
    console.log("Suno API response status:", sunoResponse.status);

    if (!sunoResponse.ok) {
      let errorMessage = "Suno API error";
      
      if (sunoResponse.status === 401) {
        errorMessage = "API key không hợp lệ. Vui lòng kiểm tra lại SUNO_API_KEY.";
      } else if (sunoResponse.status === 402) {
        errorMessage = "Hết credits! Vui lòng nạp thêm trên sunoapi.org để tiếp tục tạo nhạc.";
      } else if (sunoResponse.status === 429) {
        errorMessage = "Quá nhiều yêu cầu. Vui lòng thử lại sau 30 giây.";
      } else {
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.message || errorData.error || `Suno API error: ${sunoResponse.status}`;
        } catch {
          errorMessage = `Suno API error: ${sunoResponse.status}`;
        }
      }

      await supabase
        .from("ai_generated_music")
        .update({ status: "failed", error_message: errorMessage })
        .eq("id", musicId);

      throw new Error(errorMessage);
    }

    const sunoData = JSON.parse(responseText);
    const taskId = sunoData.data?.taskId || sunoData.taskId || sunoData.data?.task_id || sunoData.task_id;
    
    if (!taskId) {
      throw new Error("No taskId received from Suno API");
    }

    // Store taskId for reference
    await supabase
      .from("ai_generated_music")
      .update({ suno_task_id: taskId })
      .eq("id", musicId);

    console.log("Suno task created:", taskId);
    return new Response(
      JSON.stringify({ success: true, taskId, message: "Task created. Waiting for callback to complete." }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error) {
    console.error("Error in generate-suno-music:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    try {
      const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
      const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      if (musicIdForError && SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        await supabase
          .from("ai_generated_music")
          .update({ status: "failed", error_message: errorMessage })
          .eq("id", musicIdForError);
      }
    } catch (updateErr) {
      console.error("Failed to update ai_generated_music on error:", updateErr);
    }
    
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
