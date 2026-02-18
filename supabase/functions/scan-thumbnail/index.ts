import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const adminSupabase = createClient(supabaseUrl, serviceRoleKey);

    // Check admin role
    const { data: roleCheck } = await adminSupabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (!roleCheck) {
      return new Response(JSON.stringify({ error: 'Admin only' }), { 
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Fetch videos with 100+ views that haven't been scanned
    const { data: videos, error: fetchError } = await adminSupabase
      .from('videos')
      .select('id, title, thumbnail_url, view_count')
      .eq('thumbnail_scanned', false)
      .gte('view_count', 100)
      .not('thumbnail_url', 'is', null)
      .order('view_count', { ascending: false })
      .limit(10);

    if (fetchError) throw fetchError;
    if (!videos || videos.length === 0) {
      return new Response(JSON.stringify({ success: true, scanned: 0, message: 'No videos to scan' }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    const results: any[] = [];

    for (const video of videos) {
      try {
        const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              {
                role: 'system',
                content: 'You are a thumbnail quality checker. Analyze the image and respond with JSON: {"quality": "good"|"suspicious"|"junk", "reason": "brief reason"}. Flag as "junk" if: black screen, solid color, placeholder/test image, corrupted. Flag as "suspicious" if: very low quality, irrelevant stock photo. Otherwise "good".'
              },
              {
                role: 'user',
                content: [
                  { type: 'text', text: `Analyze this video thumbnail for quality. Video title: "${video.title}"` },
                  { type: 'image_url', image_url: { url: video.thumbnail_url } }
                ]
              }
            ],
          }),
        });

        if (!response.ok) {
          console.error(`AI scan failed for ${video.id}: ${response.status}`);
          continue;
        }

        const aiData = await response.json();
        const content = aiData.choices?.[0]?.message?.content || '';
        
        // Parse JSON from response
        let scanResult = 'unknown';
        try {
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            scanResult = `${parsed.quality}: ${parsed.reason}`;
            
            // Auto-hide junk thumbnails
            if (parsed.quality === 'junk') {
              await adminSupabase
                .from('videos')
                .update({ is_hidden: true, thumbnail_scanned: true, thumbnail_scan_result: scanResult })
                .eq('id', video.id);
            } else {
              await adminSupabase
                .from('videos')
                .update({ thumbnail_scanned: true, thumbnail_scan_result: scanResult })
                .eq('id', video.id);
            }
          }
        } catch {
          scanResult = content.slice(0, 200);
          await adminSupabase
            .from('videos')
            .update({ thumbnail_scanned: true, thumbnail_scan_result: scanResult })
            .eq('id', video.id);
        }

        results.push({ id: video.id, title: video.title, result: scanResult });
      } catch (err) {
        console.error(`Error scanning video ${video.id}:`, err);
      }
    }

    return new Response(JSON.stringify({ success: true, scanned: results.length, results }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  } catch (error) {
    console.error('scan-thumbnail error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), { 
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});
