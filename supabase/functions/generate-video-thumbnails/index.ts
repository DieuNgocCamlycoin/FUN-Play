import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { S3Client, PutObjectCommand } from "https://esm.sh/@aws-sdk/client-s3@3.614.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize S3 client for Cloudflare R2
function getS3Client() {
  return new S3Client({
    region: 'auto',
    endpoint: Deno.env.get('R2_ENDPOINT')!,
    credentials: {
      accessKeyId: Deno.env.get('R2_ACCESS_KEY_ID')!,
      secretAccessKey: Deno.env.get('R2_SECRET_ACCESS_KEY')!,
    },
  });
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const { action, videoId, limit = 10 } = await req.json();

    if (action === 'list') {
      // List videos with NULL thumbnails
      const { data: videos, error } = await supabaseAdmin
        .from('videos')
        .select('id, title, video_url, thumbnail_url, user_id')
        .is('thumbnail_url', null)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          count: videos?.length || 0,
          videos 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'generate' && videoId) {
      // Get video details
      const { data: video, error: videoError } = await supabaseAdmin
        .from('videos')
        .select('id, video_url, user_id, title')
        .eq('id', videoId)
        .single();

      if (videoError || !video) {
        return new Response(
          JSON.stringify({ error: 'Video not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if video URL is from R2
      const isR2Video = video.video_url?.includes('r2.dev') || video.video_url?.includes('cloudflare');
      
      if (!isR2Video) {
        return new Response(
          JSON.stringify({ 
            error: 'Video is not hosted on R2, cannot generate thumbnail server-side',
            video_url: video.video_url
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // For now, we'll return a message that thumbnail generation needs to be done client-side
      // Server-side video frame extraction requires ffmpeg which is not available in Deno Deploy
      return new Response(
        JSON.stringify({ 
          success: false,
          message: 'Server-side thumbnail generation requires ffmpeg. Please use client-side extraction.',
          video_id: videoId,
          video_url: video.video_url
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'update' && videoId) {
      // Update thumbnail URL for a video (after client-side generation)
      const { thumbnailUrl } = await req.json();
      
      const { error: updateError } = await supabaseAdmin
        .from('videos')
        .update({ thumbnail_url: thumbnailUrl })
        .eq('id', videoId);

      if (updateError) {
        return new Response(
          JSON.stringify({ error: updateError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, videoId, thumbnailUrl }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action. Use: list, generate, or update' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
