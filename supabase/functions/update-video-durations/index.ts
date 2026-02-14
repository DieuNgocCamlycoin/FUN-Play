import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Parse MP4 boxes to find moov/mvhd and extract duration
function parseMp4Duration(buffer: ArrayBuffer): number | null {
  const view = new DataView(buffer);
  const len = buffer.byteLength;
  
  // Recursively search for mvhd box
  function searchBoxes(start: number, end: number): number | null {
    let offset = start;
    while (offset + 8 <= end) {
      let boxSize: number;
      try { boxSize = view.getUint32(offset); } catch { break; }
      
      if (boxSize === 0) break; // box extends to EOF, skip
      if (boxSize === 1 && offset + 16 <= end) {
        // 64-bit extended size - skip these for now
        break;
      }
      if (boxSize < 8) break;
      
      const boxEnd = Math.min(offset + boxSize, end);
      const type = String.fromCharCode(
        view.getUint8(offset + 4), view.getUint8(offset + 5),
        view.getUint8(offset + 6), view.getUint8(offset + 7)
      );

      if (type === 'mvhd') {
        return parseMvhd(offset + 8, boxEnd);
      }
      
      // Recurse into container boxes
      if (['moov', 'trak', 'mdia', 'udta'].includes(type)) {
        const nested = searchBoxes(offset + 8, boxEnd);
        if (nested !== null) return nested;
      }
      
      offset = boxEnd;
    }
    return null;
  }
  
  function parseMvhd(start: number, end: number): number | null {
    if (start + 4 > end) return null;
    const version = view.getUint8(start);
    
    if (version === 0 && start + 20 <= end) {
      const timescale = view.getUint32(start + 12);
      const duration = view.getUint32(start + 16);
      if (timescale > 0 && duration > 0) return Math.round(duration / timescale);
    } else if (version === 1 && start + 28 <= end) {
      const timescale = view.getUint32(start + 20);
      const durationHi = view.getUint32(start + 24);
      const durationLo = view.getUint32(start + 28);
      const duration = durationHi * 0x100000000 + durationLo;
      if (timescale > 0 && duration > 0) return Math.round(duration / timescale);
    }
    return null;
  }
  
  return searchBoxes(0, len);
}

async function extractDuration(url: string): Promise<number | null> {
  try {
    // Try fetching first 512KB (covers most web-optimized MP4s with moov at start)
    const resp1 = await fetch(url, { headers: { Range: 'bytes=0-524287' } });
    if (resp1.ok || resp1.status === 206) {
      const buf = await resp1.arrayBuffer();
      const dur = parseMp4Duration(buf);
      if (dur !== null) return dur;
    }

    // If not found, try the end of the file (moov at end)
    const headResp = await fetch(url, { method: 'HEAD' });
    const size = parseInt(headResp.headers.get('content-length') || '0');
    if (size > 524288) {
      const endStart = Math.max(0, size - 1048576); // last 1MB
      const resp2 = await fetch(url, { headers: { Range: `bytes=${endStart}-${size - 1}` } });
      if (resp2.ok || resp2.status === 206) {
        const buf2 = await resp2.arrayBuffer();
        const dur2 = parseMp4Duration(buf2);
        if (dur2 !== null) return dur2;
      }
    }

    // Fallback: download up to 5MB of the file
    const resp3 = await fetch(url, { headers: { Range: 'bytes=0-5242879' } });
    if (resp3.ok || resp3.status === 206) {
      const buf3 = await resp3.arrayBuffer();
      return parseMp4Duration(buf3);
    }

    return null;
  } catch (e) {
    console.error(`Duration extraction error for ${url}:`, e.message);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const userSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    const { data: { user }, error: authError } = await userSupabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const adminSupabase = createClient(supabaseUrl, serviceRoleKey);
    const { data: roles } = await adminSupabase
      .from('user_roles').select('role')
      .eq('user_id', user.id).eq('role', 'admin').limit(1);

    if (!roles || roles.length === 0) {
      return new Response(JSON.stringify({ error: 'Admin only' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { limit = 20 } = await req.json().catch(() => ({}));

    const { data: videos, error: queryError } = await adminSupabase
      .from('videos').select('id, video_url')
      .is('duration', null).not('video_url', 'is', null)
      .limit(limit);

    if (queryError) {
      return new Response(JSON.stringify({ error: queryError.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!videos || videos.length === 0) {
      return new Response(JSON.stringify({ message: 'No videos with NULL duration', updated: 0, total: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    let updated = 0, failed = 0;
    const results: Array<{ id: string; duration: number | null; error?: string }> = [];

    for (const video of videos) {
      try {
        const duration = await extractDuration(video.video_url);
        if (duration && duration > 0) {
          const { error: updateErr } = await adminSupabase
            .from('videos').update({ duration }).eq('id', video.id);
          if (updateErr) {
            results.push({ id: video.id, duration: null, error: updateErr.message });
            failed++;
          } else {
            results.push({ id: video.id, duration });
            updated++;
          }
        } else {
          results.push({ id: video.id, duration: null, error: 'Could not extract duration from MP4' });
          failed++;
        }
      } catch (e) {
        results.push({ id: video.id, duration: null, error: e.message });
        failed++;
      }
    }

    return new Response(JSON.stringify({
      total: videos.length, updated, failed,
      results: results.slice(0, 30),
      message: `Updated ${updated}/${videos.length} video durations.`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error("Update durations error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
