import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// R2 Configuration
const R2_ENDPOINT = Deno.env.get('R2_ENDPOINT') || '';
const R2_ACCESS_KEY_ID = Deno.env.get('R2_ACCESS_KEY_ID') || '';
const R2_SECRET_ACCESS_KEY = Deno.env.get('R2_SECRET_ACCESS_KEY') || '';
const R2_BUCKET_NAME = Deno.env.get('R2_BUCKET_NAME') || '';
const R2_PUBLIC_URL = Deno.env.get('R2_PUBLIC_URL') || '';

// AWS Signature V4 helpers
async function hmacSha256(key: ArrayBuffer, data: string): Promise<ArrayBuffer> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const encoder = new TextEncoder();
  return await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(data));
}

async function sha256(data: Uint8Array | ArrayBuffer): Promise<string> {
  let buffer: ArrayBuffer;
  if (data instanceof Uint8Array) {
    buffer = new ArrayBuffer(data.length);
    new Uint8Array(buffer).set(data);
  } else {
    buffer = data;
  }
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

async function getSignatureKey(
  key: string, dateStamp: string, regionName: string, serviceName: string
): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  const kDateInput = encoder.encode('AWS4' + key);
  const kDate = await hmacSha256(kDateInput.buffer.slice(kDateInput.byteOffset, kDateInput.byteOffset + kDateInput.byteLength), dateStamp);
  const kRegion = await hmacSha256(kDate, regionName);
  const kService = await hmacSha256(kRegion, serviceName);
  return await hmacSha256(kService, 'aws4_request');
}

async function uploadToR2(
  fileData: ArrayBuffer,
  fileName: string,
  contentType: string
): Promise<string> {
  const method = 'PUT';
  const service = 's3';
  const region = 'auto';
  
  // Parse endpoint
  const endpointUrl = new URL(R2_ENDPOINT);
  const host = endpointUrl.hostname;
  const objectKey = fileName;
  
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const dateStamp = amzDate.slice(0, 8);
  
  const payloadHash = await sha256(fileData);
  
  const canonicalHeaders = 
    `content-type:${contentType}\n` +
    `host:${host}\n` +
    `x-amz-content-sha256:${payloadHash}\n` +
    `x-amz-date:${amzDate}\n`;
  
  const signedHeaders = 'content-type;host;x-amz-content-sha256;x-amz-date';
  
  const canonicalRequest = 
    `${method}\n` +
    `/${R2_BUCKET_NAME}/${objectKey}\n` +
    `\n` +
    `${canonicalHeaders}\n` +
    `${signedHeaders}\n` +
    `${payloadHash}`;
  
  const algorithm = 'AWS4-HMAC-SHA256';
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const canonicalRequestHash = await sha256(new TextEncoder().encode(canonicalRequest));
  
  const stringToSign = 
    `${algorithm}\n` +
    `${amzDate}\n` +
    `${credentialScope}\n` +
    `${canonicalRequestHash}`;
  
  const signingKey = await getSignatureKey(R2_SECRET_ACCESS_KEY, dateStamp, region, service);
  const signatureBuffer = await hmacSha256(signingKey, stringToSign);
  const signature = toHex(signatureBuffer);
  
  const authorizationHeader = 
    `${algorithm} ` +
    `Credential=${R2_ACCESS_KEY_ID}/${credentialScope}, ` +
    `SignedHeaders=${signedHeaders}, ` +
    `Signature=${signature}`;
  
  const url = `${R2_ENDPOINT}/${R2_BUCKET_NAME}/${objectKey}`;
  
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': contentType,
      'Host': host,
      'x-amz-content-sha256': payloadHash,
      'x-amz-date': amzDate,
      'Authorization': authorizationHeader,
    },
    body: fileData,
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`R2 upload failed: ${response.status} - ${errorText}`);
  }
  
  return `${R2_PUBLIC_URL}/${objectKey}`;
}

async function migrateVideo(
  supabaseAdmin: any,
  videoId: string,
  originalVideoUrl: string,
  originalThumbnailUrl: string | null,
  userId: string
): Promise<{ newVideoUrl: string | null; newThumbnailUrl: string | null }> {
  let newVideoUrl: string | null = null;
  let newThumbnailUrl: string | null = null;
  
  // Migrate video file
  if (originalVideoUrl && !originalVideoUrl.includes('r2.dev') && !originalVideoUrl.includes('youtube.com') && !originalVideoUrl.includes('youtu.be')) {
    console.log(`Downloading video from: ${originalVideoUrl}`);
    
    const videoResponse = await fetch(originalVideoUrl);
    if (!videoResponse.ok) {
      throw new Error(`Failed to download video: ${videoResponse.status}`);
    }
    
    const videoData = await videoResponse.arrayBuffer();
    const contentType = videoResponse.headers.get('content-type') || 'video/mp4';
    
    // Extract original filename
    const urlParts = originalVideoUrl.split('/');
    const originalFileName = urlParts[urlParts.length - 1].split('?')[0];
    const timestamp = Date.now();
    const newFileName = `${userId}/videos/migrated-${timestamp}-${originalFileName}`;
    
    console.log(`Uploading video to R2: ${newFileName}`);
    newVideoUrl = await uploadToR2(videoData, newFileName, contentType);
    console.log(`Video migrated successfully: ${newVideoUrl}`);
  }
  
  // Migrate thumbnail file
  if (originalThumbnailUrl && !originalThumbnailUrl.includes('r2.dev')) {
    console.log(`Downloading thumbnail from: ${originalThumbnailUrl}`);
    
    const thumbResponse = await fetch(originalThumbnailUrl);
    if (thumbResponse.ok) {
      const thumbData = await thumbResponse.arrayBuffer();
      const contentType = thumbResponse.headers.get('content-type') || 'image/jpeg';
      
      const urlParts = originalThumbnailUrl.split('/');
      const originalFileName = urlParts[urlParts.length - 1].split('?')[0];
      const timestamp = Date.now();
      const newFileName = `${userId}/thumbnails/migrated-${timestamp}-${originalFileName}`;
      
      console.log(`Uploading thumbnail to R2: ${newFileName}`);
      newThumbnailUrl = await uploadToR2(thumbData, newFileName, contentType);
      console.log(`Thumbnail migrated successfully: ${newThumbnailUrl}`);
    }
  }
  
  return { newVideoUrl, newThumbnailUrl };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Verify admin access
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    // Verify user is admin
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const { data: isAdmin } = await supabaseClient.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });
    
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Use service role for admin operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    const { action, videoId, batchSize = 5 } = await req.json();
    
    if (action === 'get-pending') {
      // Get videos that need migration
      const { data: videos, error } = await supabaseAdmin
        .from('videos')
        .select('id, video_url, thumbnail_url, user_id, title')
        .not('video_url', 'like', '%r2.dev%')
        .not('video_url', 'like', '%youtube.com%')
        .not('video_url', 'like', '%youtu.be%')
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      // Also get migration status
      const { data: migrations } = await supabaseAdmin
        .from('video_migrations')
        .select('video_id, status');
      
      const migrationMap = new Map(migrations?.map(m => [m.video_id, m.status]) || []);
      
      const pendingVideos = videos?.filter(v => {
        const status = migrationMap.get(v.id);
        return !status || status === 'pending' || status === 'failed';
      }) || [];
      
      return new Response(
        JSON.stringify({ 
          videos: pendingVideos,
          totalPending: pendingVideos.length 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (action === 'get-stats') {
      // Get migration statistics
      const { data: allMigrations } = await supabaseAdmin
        .from('video_migrations')
        .select('status');
      
      const stats = {
        pending: 0,
        migrating: 0,
        completed: 0,
        failed: 0
      };
      
      allMigrations?.forEach(m => {
        if (stats.hasOwnProperty(m.status)) {
          stats[m.status as keyof typeof stats]++;
        }
      });
      
      // Count videos still in Supabase Storage
      const { count: supabaseCount } = await supabaseAdmin
        .from('videos')
        .select('id', { count: 'exact', head: true })
        .not('video_url', 'like', '%r2.dev%')
        .not('video_url', 'like', '%youtube.com%')
        .not('video_url', 'like', '%youtu.be%');
      
      // Count videos already in R2
      const { count: r2Count } = await supabaseAdmin
        .from('videos')
        .select('id', { count: 'exact', head: true })
        .like('video_url', '%r2.dev%');
      
      return new Response(
        JSON.stringify({ 
          ...stats,
          supabaseStorageCount: supabaseCount || 0,
          r2Count: r2Count || 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (action === 'migrate-single') {
      if (!videoId) {
        return new Response(
          JSON.stringify({ error: 'videoId required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Get video details
      const { data: video, error: videoError } = await supabaseAdmin
        .from('videos')
        .select('id, video_url, thumbnail_url, user_id, title')
        .eq('id', videoId)
        .single();
      
      if (videoError || !video) {
        return new Response(
          JSON.stringify({ error: 'Video not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Create or update migration record
      await supabaseAdmin
        .from('video_migrations')
        .upsert({
          video_id: video.id,
          original_video_url: video.video_url,
          original_thumbnail_url: video.thumbnail_url,
          status: 'migrating'
        }, { onConflict: 'video_id' });
      
      try {
        const { newVideoUrl, newThumbnailUrl } = await migrateVideo(
          supabaseAdmin,
          video.id,
          video.video_url,
          video.thumbnail_url,
          video.user_id
        );
        
        // Update video record with new URLs
        const updateData: any = {};
        if (newVideoUrl) updateData.video_url = newVideoUrl;
        if (newThumbnailUrl) updateData.thumbnail_url = newThumbnailUrl;
        
        if (Object.keys(updateData).length > 0) {
          await supabaseAdmin
            .from('videos')
            .update(updateData)
            .eq('id', video.id);
        }
        
        // Update migration record
        await supabaseAdmin
          .from('video_migrations')
          .update({
            new_video_url: newVideoUrl,
            new_thumbnail_url: newThumbnailUrl,
            status: 'completed',
            completed_at: new Date().toISOString()
          })
          .eq('video_id', video.id);
        
        return new Response(
          JSON.stringify({ 
            success: true,
            videoId: video.id,
            newVideoUrl,
            newThumbnailUrl
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (migrationError: any) {
        console.error(`Migration failed for video ${video.id}:`, migrationError);
        
        await supabaseAdmin
          .from('video_migrations')
          .update({
            status: 'failed',
            error_message: migrationError.message
          })
          .eq('video_id', video.id);
        
        return new Response(
          JSON.stringify({ 
            success: false,
            videoId: video.id,
            error: migrationError.message
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }
    
    if (action === 'migrate-batch') {
      // Get pending videos for batch migration
      const { data: videos, error } = await supabaseAdmin
        .from('videos')
        .select('id, video_url, thumbnail_url, user_id, title')
        .not('video_url', 'like', '%r2.dev%')
        .not('video_url', 'like', '%youtube.com%')
        .not('video_url', 'like', '%youtu.be%')
        .order('created_at', { ascending: true })
        .limit(batchSize);
      
      if (error) throw error;
      
      // Filter out already migrating/completed
      const { data: existingMigrations } = await supabaseAdmin
        .from('video_migrations')
        .select('video_id, status')
        .in('video_id', videos?.map(v => v.id) || []);
      
      const migrationMap = new Map(existingMigrations?.map(m => [m.video_id, m.status]) || []);
      
      const toMigrate = videos?.filter(v => {
        const status = migrationMap.get(v.id);
        return !status || status === 'pending' || status === 'failed';
      }) || [];
      
      const results = [];
      
      for (const video of toMigrate) {
        // Create or update migration record
        await supabaseAdmin
          .from('video_migrations')
          .upsert({
            video_id: video.id,
            original_video_url: video.video_url,
            original_thumbnail_url: video.thumbnail_url,
            status: 'migrating'
          }, { onConflict: 'video_id' });
        
        try {
          const { newVideoUrl, newThumbnailUrl } = await migrateVideo(
            supabaseAdmin,
            video.id,
            video.video_url,
            video.thumbnail_url,
            video.user_id
          );
          
          // Update video record
          const updateData: any = {};
          if (newVideoUrl) updateData.video_url = newVideoUrl;
          if (newThumbnailUrl) updateData.thumbnail_url = newThumbnailUrl;
          
          if (Object.keys(updateData).length > 0) {
            await supabaseAdmin
              .from('videos')
              .update(updateData)
              .eq('id', video.id);
          }
          
          // Update migration record
          await supabaseAdmin
            .from('video_migrations')
            .update({
              new_video_url: newVideoUrl,
              new_thumbnail_url: newThumbnailUrl,
              status: 'completed',
              completed_at: new Date().toISOString()
            })
            .eq('video_id', video.id);
          
          results.push({ videoId: video.id, success: true, newVideoUrl, newThumbnailUrl });
        } catch (migrationError: any) {
          console.error(`Migration failed for video ${video.id}:`, migrationError);
          
          await supabaseAdmin
            .from('video_migrations')
            .update({
              status: 'failed',
              error_message: migrationError.message
            })
            .eq('video_id', video.id);
          
          results.push({ videoId: video.id, success: false, error: migrationError.message });
        }
      }
      
      return new Response(
        JSON.stringify({ 
          results,
          migratedCount: results.filter(r => r.success).length,
          failedCount: results.filter(r => !r.success).length
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error: any) {
    console.error('Migration error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
