import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// --- S3 signing helpers (same as r2-upload) ---
async function hmacSha256(key: Uint8Array, message: string): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey('raw', key.buffer as ArrayBuffer, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(message)));
}

async function sha256(message: string): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(message));
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function getSignatureKey(secretKey: string, dateStamp: string, region: string, service: string): Promise<Uint8Array> {
  const kDate = await hmacSha256(new TextEncoder().encode('AWS4' + secretKey), dateStamp);
  const kRegion = await hmacSha256(kDate, region);
  const kService = await hmacSha256(kRegion, service);
  return await hmacSha256(kService, 'aws4_request');
}

async function deleteR2Object(accessKeyId: string, secretAccessKey: string, bucket: string, key: string, endpoint: string): Promise<boolean> {
  try {
    const now = new Date();
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '').substring(0, 15) + 'Z';
    const dateStamp = amzDate.substring(0, 8);
    const region = 'auto';
    const service = 's3';

    const endpointUrl = new URL(endpoint);
    const host = `${bucket}.${endpointUrl.hostname}`;
    const canonicalUri = '/' + key.split('/').map(encodeURIComponent).join('/');
    const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;

    const signedHeaders = 'host;x-amz-content-sha256;x-amz-date';
    const canonicalHeaders = `host:${host}\nx-amz-content-sha256:UNSIGNED-PAYLOAD\nx-amz-date:${amzDate}\n`;

    const canonicalRequest = ['DELETE', canonicalUri, '', canonicalHeaders, signedHeaders, 'UNSIGNED-PAYLOAD'].join('\n');
    const hashedCanonicalRequest = await sha256(canonicalRequest);
    const stringToSign = ['AWS4-HMAC-SHA256', amzDate, credentialScope, hashedCanonicalRequest].join('\n');

    const signingKey = await getSignatureKey(secretAccessKey, dateStamp, region, service);
    const signature = toHex(await hmacSha256(signingKey, stringToSign));
    const authorizationHeader = `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

    const resp = await fetch(`https://${host}${canonicalUri}`, {
      method: 'DELETE',
      headers: { 'Authorization': authorizationHeader, 'x-amz-date': amzDate, 'x-amz-content-sha256': 'UNSIGNED-PAYLOAD', 'Host': host },
    });
    // S3 DELETE returns 204 on success, 404 if not found (both OK)
    return resp.status === 204 || resp.status === 200 || resp.status === 404;
  } catch (e) {
    console.error(`Failed to delete R2 object ${key}:`, e.message);
    return false;
  }
}

function extractR2Key(url: string, publicUrl: string): string | null {
  if (!url) return null;
  try {
    // URL format: https://pub-xxx.r2.dev/user_id/videos/filename.mp4
    const u = new URL(url);
    // Return path without leading slash
    return u.pathname.startsWith('/') ? u.pathname.substring(1) : u.pathname;
  } catch {
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const R2_ACCESS_KEY_ID = Deno.env.get('R2_ACCESS_KEY_ID') ?? '';
    const R2_SECRET_ACCESS_KEY = Deno.env.get('R2_SECRET_ACCESS_KEY') ?? '';
    const R2_BUCKET_NAME = Deno.env.get('R2_BUCKET_NAME') ?? '';
    const R2_ENDPOINT = Deno.env.get('R2_ENDPOINT') ?? '';
    const R2_PUBLIC_URL = Deno.env.get('R2_PUBLIC_URL') ?? '';

    // Auth check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false }
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Admin check
    const { data: isAdmin } = await supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const body = await req.json().catch(() => ({}));
    const dryRun = body.dryRun === true;
    const batchSize = Math.min(body.batchSize || 50, 50);

    // Get banned user IDs
    const { data: bannedProfiles } = await supabase
      .from('profiles')
      .select('id')
      .eq('banned', true);

    if (!bannedProfiles || bannedProfiles.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, deleted: 0, remaining: 0, totalBannedUsers: 0, 
        message: 'Không có user bị ban nào' 
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const bannedUserIds = bannedProfiles.map(p => p.id);

    const { data: videos, error: videosError } = await supabase
      .from('videos')
      .select('id, video_url, thumbnail_url, file_size, user_id')
      .in('user_id', bannedUserIds)
      .limit(batchSize);

    if (videosError) {
      console.error('Error fetching videos:', videosError);
      return new Response(JSON.stringify({ error: 'Failed to fetch videos' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (!videos || videos.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, deleted: 0, remaining: 0, 
        totalBannedUsers: bannedProfiles.length,
        message: 'Tất cả video của user bị ban đã được dọn dẹp' 
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (dryRun) {
      const totalSize = videos.reduce((sum, v) => sum + (v.file_size || 0), 0);
      // Count total
      const { count: totalCount } = await supabase
        .from('videos')
        .select('id', { count: 'exact', head: true })
        .in('user_id', bannedUserIds);

      return new Response(JSON.stringify({
        dryRun: true,
        totalBannedUsers: bannedProfiles.length,
        totalVideos: totalCount || 0,
        batchSize: videos.length,
        estimatedSizeBytes: totalSize,
        sampleVideos: videos.slice(0, 5).map(v => ({ id: v.id, url: v.video_url, size: v.file_size })),
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Process deletion
    let deletedCount = 0;
    let freedBytes = 0;
    let r2DeletedCount = 0;
    const errors: string[] = [];

    for (const video of videos) {
      try {
        const videoIds = [video.id];

        // Delete related records in correct order (fire all in parallel)
        await Promise.all([
          supabase.from('likes').delete().in('video_id', videoIds),
          supabase.from('comment_logs').delete().in('video_id', videoIds),
          supabase.from('watch_history').delete().in('video_id', videoIds),
          supabase.from('content_hashes').delete().in('video_id', videoIds),
          supabase.from('reward_actions').delete().in('video_id', videoIds),
          supabase.from('video_migrations').delete().in('video_id', videoIds),
          supabase.from('playlist_videos').delete().in('video_id', videoIds),
          supabase.from('meditation_playlist_videos').delete().in('video_id', videoIds),
        ]);

        // Delete comments (needs comment_likes deleted first)
        const { data: comments } = await supabase.from('comments').select('id').eq('video_id', video.id);
        if (comments && comments.length > 0) {
          const commentIds = comments.map(c => c.id);
          await supabase.from('comment_likes').delete().in('comment_id', commentIds);
          await supabase.from('comments').delete().eq('video_id', video.id);
        }

        // Delete reward_transactions referencing this video
        await supabase.from('reward_transactions').delete().eq('video_id', video.id);

        // Delete R2 files
        const videoKey = extractR2Key(video.video_url, R2_PUBLIC_URL);
        if (videoKey) {
          const ok = await deleteR2Object(R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, videoKey, R2_ENDPOINT);
          if (ok) r2DeletedCount++;
        }

        if (video.thumbnail_url) {
          const thumbKey = extractR2Key(video.thumbnail_url, R2_PUBLIC_URL);
          if (thumbKey) {
            await deleteR2Object(R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, thumbKey, R2_ENDPOINT);
          }
        }

        // Finally delete the video record
        const { error: delError } = await supabase.from('videos').delete().eq('id', video.id);
        if (delError) {
          errors.push(`Video ${video.id}: ${delError.message}`);
        } else {
          deletedCount++;
          freedBytes += video.file_size || 0;
        }
      } catch (e) {
        errors.push(`Video ${video.id}: ${e.message}`);
      }
    }

    // Count remaining
    const { count: remaining } = await supabase
      .from('videos')
      .select('id', { count: 'exact', head: true })
      .in('user_id', bannedUserIds);

    console.log(`Cleanup batch done: ${deletedCount} deleted, ${remaining || 0} remaining, ${r2DeletedCount} R2 files removed, ${freedBytes} bytes freed`);

    return new Response(JSON.stringify({
      success: true,
      deleted: deletedCount,
      r2FilesDeleted: r2DeletedCount,
      freedBytes,
      remaining: remaining || 0,
      totalBannedUsers: bannedProfiles.length,
      errors: errors.length > 0 ? errors : undefined,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (e) {
    console.error('Cleanup error:', e);
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
