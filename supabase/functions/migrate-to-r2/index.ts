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

// Generate presigned URL for client-side upload (either PUT or part upload)
async function generatePresignedUrl(
  fileName: string, 
  method: string = 'PUT',
  queryParams: Record<string, string> = {},
  expiresIn: number = 3600
): Promise<string> {
  const service = 's3';
  const region = 'auto';
  const algorithm = 'AWS4-HMAC-SHA256';
  
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const dateStamp = amzDate.slice(0, 8);
  
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const credential = `${R2_ACCESS_KEY_ID}/${credentialScope}`;
  
  const endpointUrl = new URL(R2_ENDPOINT);
  const host = endpointUrl.hostname;
  
  // Build query parameters for presigned URL
  const params = new URLSearchParams({
    'X-Amz-Algorithm': algorithm,
    'X-Amz-Credential': credential,
    'X-Amz-Date': amzDate,
    'X-Amz-Expires': expiresIn.toString(),
    'X-Amz-SignedHeaders': 'host',
    ...queryParams
  });
  
  // Sort params for canonical request
  const sortedParams = new URLSearchParams([...params.entries()].sort());
  
  const canonicalRequest = 
    `${method}\n` +
    `/${R2_BUCKET_NAME}/${fileName}\n` +
    `${sortedParams.toString()}\n` +
    `host:${host}\n\n` +
    `host\n` +
    `UNSIGNED-PAYLOAD`;
  
  const canonicalRequestHash = await sha256(new TextEncoder().encode(canonicalRequest));
  const stringToSign = 
    `${algorithm}\n` +
    `${amzDate}\n` +
    `${credentialScope}\n` +
    `${canonicalRequestHash}`;
  
  const signingKey = await getSignatureKey(R2_SECRET_ACCESS_KEY, dateStamp, region, service);
  const signatureBuffer = await hmacSha256(signingKey, stringToSign);
  const signature = toHex(signatureBuffer);
  
  sortedParams.set('X-Amz-Signature', signature);
  
  return `${R2_ENDPOINT}/${R2_BUCKET_NAME}/${fileName}?${sortedParams.toString()}`;
}

// Initiate multipart upload and return uploadId
async function initiateMultipartUpload(fileName: string, contentType: string): Promise<string> {
  console.log(`Initiating multipart upload for: ${fileName}`);
  
  const service = 's3';
  const region = 'auto';
  
  const endpointUrl = new URL(R2_ENDPOINT);
  const host = endpointUrl.hostname;
  
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const dateStamp = amzDate.slice(0, 8);
  
  const payloadHash = await sha256(new ArrayBuffer(0));
  
  const canonicalHeaders = 
    `content-type:${contentType}\n` +
    `host:${host}\n` +
    `x-amz-content-sha256:${payloadHash}\n` +
    `x-amz-date:${amzDate}\n`;
  
  const signedHeaders = 'content-type;host;x-amz-content-sha256;x-amz-date';
  
  const canonicalRequest = 
    `POST\n` +
    `/${R2_BUCKET_NAME}/${fileName}\n` +
    `uploads=\n` +
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
  
  const response = await fetch(`${R2_ENDPOINT}/${R2_BUCKET_NAME}/${fileName}?uploads=`, {
    method: 'POST',
    headers: {
      'Content-Type': contentType,
      'Host': host,
      'x-amz-content-sha256': payloadHash,
      'x-amz-date': amzDate,
      'Authorization': authorizationHeader,
    },
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to initiate multipart upload: ${response.status} - ${errorText}`);
  }
  
  const responseText = await response.text();
  const uploadIdMatch = responseText.match(/<UploadId>([^<]+)<\/UploadId>/);
  if (!uploadIdMatch) {
    throw new Error('Could not parse UploadId from response');
  }
  
  console.log(`Multipart upload initiated: ${uploadIdMatch[1]}`);
  return uploadIdMatch[1];
}

// Complete multipart upload
async function completeMultipartUpload(
  fileName: string,
  uploadId: string,
  parts: { partNumber: number; etag: string }[]
): Promise<void> {
  console.log(`Completing multipart upload with ${parts.length} parts`);
  
  const partsXml = parts
    .sort((a, b) => a.partNumber - b.partNumber)
    .map(p => `<Part><PartNumber>${p.partNumber}</PartNumber><ETag>${p.etag}</ETag></Part>`)
    .join('');
  const body = `<CompleteMultipartUpload>${partsXml}</CompleteMultipartUpload>`;
  const bodyBuffer = new TextEncoder().encode(body);
  
  const service = 's3';
  const region = 'auto';
  const endpointUrl = new URL(R2_ENDPOINT);
  const host = endpointUrl.hostname;
  
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const dateStamp = amzDate.slice(0, 8);
  
  const payloadHash = await sha256(bodyBuffer);
  const queryString = `uploadId=${encodeURIComponent(uploadId)}`;
  
  const canonicalHeaders = 
    `content-type:application/xml\n` +
    `host:${host}\n` +
    `x-amz-content-sha256:${payloadHash}\n` +
    `x-amz-date:${amzDate}\n`;
  
  const signedHeaders = 'content-type;host;x-amz-content-sha256;x-amz-date';
  
  const canonicalRequest = 
    `POST\n` +
    `/${R2_BUCKET_NAME}/${fileName}\n` +
    `${queryString}\n` +
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
  
  const response = await fetch(`${R2_ENDPOINT}/${R2_BUCKET_NAME}/${fileName}?${queryString}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/xml',
      'Host': host,
      'x-amz-content-sha256': payloadHash,
      'x-amz-date': amzDate,
      'Authorization': authorizationHeader,
    },
    body: bodyBuffer,
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to complete multipart upload: ${response.status} - ${errorText}`);
  }
  
  console.log(`Multipart upload completed: ${fileName}`);
}

// Abort multipart upload
async function abortMultipartUpload(fileName: string, uploadId: string): Promise<void> {
  console.log(`Aborting multipart upload: ${uploadId}`);
  
  try {
    const service = 's3';
    const region = 'auto';
    const endpointUrl = new URL(R2_ENDPOINT);
    const host = endpointUrl.hostname;
    
    const now = new Date();
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
    const dateStamp = amzDate.slice(0, 8);
    
    const payloadHash = await sha256(new ArrayBuffer(0));
    const queryString = `uploadId=${encodeURIComponent(uploadId)}`;
    
    const canonicalHeaders = 
      `host:${host}\n` +
      `x-amz-content-sha256:${payloadHash}\n` +
      `x-amz-date:${amzDate}\n`;
    
    const signedHeaders = 'host;x-amz-content-sha256;x-amz-date';
    
    const canonicalRequest = 
      `DELETE\n` +
      `/${R2_BUCKET_NAME}/${fileName}\n` +
      `${queryString}\n` +
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
    
    await fetch(`${R2_ENDPOINT}/${R2_BUCKET_NAME}/${fileName}?${queryString}`, {
      method: 'DELETE',
      headers: {
        'Host': host,
        'x-amz-content-sha256': payloadHash,
        'x-amz-date': amzDate,
        'Authorization': authorizationHeader,
      },
    });
  } catch (e) {
    console.error('Failed to abort multipart upload:', e);
  }
}

Deno.serve(async (req) => {
  // Always handle CORS first
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
    
    const body = await req.json();
    const { action } = body;
    
    console.log(`Action: ${action}`);
    
    // ============ SIMPLE PRESIGNED URL FOR SMALL FILES ============
    if (action === 'get-presigned-url') {
      const { fileName, contentType } = body;
      
      if (!fileName) {
        return new Response(
          JSON.stringify({ error: 'fileName required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const presignedUrl = await generatePresignedUrl(fileName, 'PUT');
      const publicUrl = `${R2_PUBLIC_URL}/${fileName}`;
      
      console.log(`Generated presigned URL for: ${fileName}`);
      
      return new Response(
        JSON.stringify({ presignedUrl, publicUrl }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // ============ MULTIPART UPLOAD: INITIATE ============
    if (action === 'initiate-multipart') {
      const { fileName, contentType } = body;
      
      if (!fileName) {
        return new Response(
          JSON.stringify({ error: 'fileName required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const uploadId = await initiateMultipartUpload(fileName, contentType || 'video/mp4');
      const publicUrl = `${R2_PUBLIC_URL}/${fileName}`;
      
      return new Response(
        JSON.stringify({ uploadId, publicUrl }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // ============ MULTIPART UPLOAD: GET PART URL ============
    if (action === 'get-part-url') {
      const { fileName, uploadId, partNumber } = body;
      
      if (!fileName || !uploadId || !partNumber) {
        return new Response(
          JSON.stringify({ error: 'fileName, uploadId, partNumber required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const presignedUrl = await generatePresignedUrl(
        fileName, 
        'PUT', 
        { 
          partNumber: partNumber.toString(), 
          uploadId: uploadId 
        }
      );
      
      console.log(`Generated part URL: part ${partNumber}`);
      
      return new Response(
        JSON.stringify({ presignedUrl }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // ============ MULTIPART UPLOAD: COMPLETE ============
    if (action === 'complete-multipart') {
      const { fileName, uploadId, parts } = body;
      
      if (!fileName || !uploadId || !parts) {
        return new Response(
          JSON.stringify({ error: 'fileName, uploadId, parts required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      await completeMultipartUpload(fileName, uploadId, parts);
      const publicUrl = `${R2_PUBLIC_URL}/${fileName}`;
      
      return new Response(
        JSON.stringify({ success: true, publicUrl }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // ============ MULTIPART UPLOAD: ABORT ============
    if (action === 'abort-multipart') {
      const { fileName, uploadId } = body;
      
      if (!fileName || !uploadId) {
        return new Response(
          JSON.stringify({ error: 'fileName, uploadId required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      await abortMultipartUpload(fileName, uploadId);
      
      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // ============ UPDATE VIDEO URLS AFTER MIGRATION ============
    if (action === 'update-video-urls') {
      const { videoId, videoUrl, thumbnailUrl } = body;
      
      if (!videoId) {
        return new Response(
          JSON.stringify({ error: 'videoId required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Get original video info
      const { data: video, error: videoError } = await supabaseAdmin
        .from('videos')
        .select('video_url, thumbnail_url')
        .eq('id', videoId)
        .single();
      
      if (videoError) throw videoError;
      
      // Update video record
      const updateData: any = {};
      if (videoUrl) updateData.video_url = videoUrl;
      if (thumbnailUrl) updateData.thumbnail_url = thumbnailUrl;
      
      if (Object.keys(updateData).length > 0) {
        await supabaseAdmin
          .from('videos')
          .update(updateData)
          .eq('id', videoId);
      }
      
      // Create/update migration record
      await supabaseAdmin
        .from('video_migrations')
        .upsert({
          video_id: videoId,
          original_video_url: video.video_url,
          original_thumbnail_url: video.thumbnail_url,
          new_video_url: videoUrl || null,
          new_thumbnail_url: thumbnailUrl || null,
          status: 'completed',
          completed_at: new Date().toISOString()
        }, { onConflict: 'video_id' });
      
      console.log(`Updated video URLs for: ${videoId}`);
      
      return new Response(
        JSON.stringify({ success: true, videoId }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // ============ MARK MIGRATION AS FAILED ============
    if (action === 'mark-failed') {
      const { videoId, errorMessage } = body;
      
      if (!videoId) {
        return new Response(
          JSON.stringify({ error: 'videoId required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Get original video info
      const { data: video } = await supabaseAdmin
        .from('videos')
        .select('video_url, thumbnail_url')
        .eq('id', videoId)
        .single();
      
      // Create/update migration record as failed
      await supabaseAdmin
        .from('video_migrations')
        .upsert({
          video_id: videoId,
          original_video_url: video?.video_url || '',
          original_thumbnail_url: video?.thumbnail_url || null,
          status: 'failed',
          error_message: errorMessage
        }, { onConflict: 'video_id' });
      
      console.log(`Marked migration failed for: ${videoId}`);
      
      return new Response(
        JSON.stringify({ success: true, videoId }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // ============ GET PENDING VIDEOS ============
    if (action === 'get-pending') {
      // Get videos that need migration (in Supabase Storage, not R2, not YouTube)
      const { data: videos, error } = await supabaseAdmin
        .from('videos')
        .select('id, video_url, thumbnail_url, user_id, title')
        .not('video_url', 'like', '%r2.dev%')
        .not('video_url', 'like', '%youtube.com%')
        .not('video_url', 'like', '%youtu.be%')
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      // Filter out already completed migrations
      const { data: migrations } = await supabaseAdmin
        .from('video_migrations')
        .select('video_id, status');
      
      const migrationMap = new Map(migrations?.map(m => [m.video_id, m.status]) || []);
      
      const pendingVideos = videos?.filter(v => {
        const status = migrationMap.get(v.id);
        return !status || status === 'pending' || status === 'failed';
      }) || [];
      
      console.log(`Found ${pendingVideos.length} pending videos`);
      
      return new Response(
        JSON.stringify({ 
          videos: pendingVideos,
          totalPending: pendingVideos.length 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // ============ GET MIGRATION STATS ============
    if (action === 'get-stats') {
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
      
      console.log(`Stats: Supabase=${supabaseCount}, R2=${r2Count}`);
      
      return new Response(
        JSON.stringify({ 
          ...stats,
          supabaseStorageCount: supabaseCount || 0,
          r2Count: r2Count || 0
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
