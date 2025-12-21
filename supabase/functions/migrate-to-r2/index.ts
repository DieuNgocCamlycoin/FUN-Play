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

// Size limits - use smaller chunks for memory efficiency
const MAX_SINGLE_UPLOAD_SIZE = 10 * 1024 * 1024; // 10MB for single upload
const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks for multipart

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

async function signRequest(
  method: string,
  objectKey: string,
  queryString: string,
  payloadHash: string,
  contentType?: string,
  additionalHeaders?: Record<string, string>
): Promise<{ headers: Record<string, string>; url: string }> {
  const service = 's3';
  const region = 'auto';
  
  const endpointUrl = new URL(R2_ENDPOINT);
  const host = endpointUrl.hostname;
  
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const dateStamp = amzDate.slice(0, 8);
  
  let canonicalHeaders = `host:${host}\n` +
    `x-amz-content-sha256:${payloadHash}\n` +
    `x-amz-date:${amzDate}\n`;
  
  let signedHeaders = 'host;x-amz-content-sha256;x-amz-date';
  
  if (contentType) {
    canonicalHeaders = `content-type:${contentType}\n` + canonicalHeaders;
    signedHeaders = 'content-type;' + signedHeaders;
  }
  
  // Add additional headers to canonical headers (sorted)
  if (additionalHeaders) {
    const sortedHeaders = Object.entries(additionalHeaders)
      .sort(([a], [b]) => a.localeCompare(b));
    for (const [key, value] of sortedHeaders) {
      canonicalHeaders += `${key.toLowerCase()}:${value}\n`;
      signedHeaders += `;${key.toLowerCase()}`;
    }
  }
  
  const canonicalRequest = 
    `${method}\n` +
    `/${R2_BUCKET_NAME}/${objectKey}\n` +
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
  
  const headers: Record<string, string> = {
    'Host': host,
    'x-amz-content-sha256': payloadHash,
    'x-amz-date': amzDate,
    'Authorization': authorizationHeader,
  };
  
  if (contentType) {
    headers['Content-Type'] = contentType;
  }
  
  if (additionalHeaders) {
    Object.assign(headers, additionalHeaders);
  }
  
  const url = queryString 
    ? `${R2_ENDPOINT}/${R2_BUCKET_NAME}/${objectKey}?${queryString}`
    : `${R2_ENDPOINT}/${R2_BUCKET_NAME}/${objectKey}`;
  
  return { headers, url };
}

// Simple single-part upload for small files
async function uploadToR2Simple(
  fileData: ArrayBuffer,
  fileName: string,
  contentType: string
): Promise<string> {
  const payloadHash = await sha256(fileData);
  const { headers, url } = await signRequest('PUT', fileName, '', payloadHash, contentType);
  
  const response = await fetch(url, {
    method: 'PUT',
    headers,
    body: fileData,
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`R2 upload failed: ${response.status} - ${errorText}`);
  }
  
  return `${R2_PUBLIC_URL}/${fileName}`;
}

// Stream-based download to avoid loading entire file into memory
async function downloadFileStreaming(url: string): Promise<{ size: number; chunks: Uint8Array[] }> {
  console.log(`Streaming download from: ${url}`);
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download: ${response.status}`);
  }
  
  const contentLength = parseInt(response.headers.get('content-length') || '0');
  console.log(`File size: ${(contentLength / 1024 / 1024).toFixed(2)} MB`);
  
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('No reader available');
  }
  
  const chunks: Uint8Array[] = [];
  let totalSize = 0;
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    totalSize += value.length;
    
    // Log progress every 5MB
    if (totalSize % (5 * 1024 * 1024) < value.length) {
      console.log(`Downloaded: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
    }
  }
  
  return { size: totalSize, chunks };
}

// Combine chunks into single buffer (only when needed for small files)
function combineChunks(chunks: Uint8Array[]): ArrayBuffer {
  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result.buffer;
}

// Initiate multipart upload
async function initiateMultipartUpload(fileName: string, contentType: string): Promise<string> {
  const payloadHash = await sha256(new ArrayBuffer(0));
  const { headers, url } = await signRequest('POST', fileName, 'uploads=', payloadHash, contentType);
  
  const response = await fetch(url, {
    method: 'POST',
    headers,
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
  
  return uploadIdMatch[1];
}

// Upload a single part
async function uploadPart(
  fileName: string,
  uploadId: string,
  partNumber: number,
  data: ArrayBuffer
): Promise<string> {
  const payloadHash = await sha256(data);
  const queryString = `partNumber=${partNumber}&uploadId=${encodeURIComponent(uploadId)}`;
  const { headers, url } = await signRequest('PUT', fileName, queryString, payloadHash);
  
  const response = await fetch(url, {
    method: 'PUT',
    headers,
    body: data,
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to upload part ${partNumber}: ${response.status} - ${errorText}`);
  }
  
  const etag = response.headers.get('ETag');
  if (!etag) {
    throw new Error(`No ETag returned for part ${partNumber}`);
  }
  
  return etag;
}

// Complete multipart upload
async function completeMultipartUpload(
  fileName: string,
  uploadId: string,
  parts: { partNumber: number; etag: string }[]
): Promise<void> {
  const partsXml = parts
    .map(p => `<Part><PartNumber>${p.partNumber}</PartNumber><ETag>${p.etag}</ETag></Part>`)
    .join('');
  const body = `<CompleteMultipartUpload>${partsXml}</CompleteMultipartUpload>`;
  const bodyBuffer = new TextEncoder().encode(body);
  
  const payloadHash = await sha256(bodyBuffer);
  const queryString = `uploadId=${encodeURIComponent(uploadId)}`;
  const { headers, url } = await signRequest('POST', fileName, queryString, payloadHash, 'application/xml');
  
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: bodyBuffer,
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to complete multipart upload: ${response.status} - ${errorText}`);
  }
}

// Abort multipart upload on failure
async function abortMultipartUpload(fileName: string, uploadId: string): Promise<void> {
  try {
    const payloadHash = await sha256(new ArrayBuffer(0));
    const queryString = `uploadId=${encodeURIComponent(uploadId)}`;
    const { headers, url } = await signRequest('DELETE', fileName, queryString, payloadHash);
    
    await fetch(url, {
      method: 'DELETE',
      headers,
    });
  } catch (e) {
    console.error('Failed to abort multipart upload:', e);
  }
}

// Upload large file using multipart upload
async function uploadToR2Multipart(
  chunks: Uint8Array[],
  totalSize: number,
  fileName: string,
  contentType: string
): Promise<string> {
  console.log(`Starting multipart upload for ${fileName} (${(totalSize / 1024 / 1024).toFixed(2)} MB)`);
  
  const uploadId = await initiateMultipartUpload(fileName, contentType);
  console.log(`Multipart upload initiated: ${uploadId}`);
  
  const parts: { partNumber: number; etag: string }[] = [];
  let currentPartData: Uint8Array[] = [];
  let currentPartSize = 0;
  let partNumber = 1;
  
  try {
    for (const chunk of chunks) {
      currentPartData.push(chunk);
      currentPartSize += chunk.length;
      
      // When we have enough data for a part, upload it
      if (currentPartSize >= CHUNK_SIZE) {
        // Combine current part data
        const partBuffer = new Uint8Array(currentPartSize);
        let offset = 0;
        for (const c of currentPartData) {
          partBuffer.set(c, offset);
          offset += c.length;
        }
        
        console.log(`Uploading part ${partNumber} (${(currentPartSize / 1024 / 1024).toFixed(2)} MB)`);
        const etag = await uploadPart(fileName, uploadId, partNumber, partBuffer.buffer);
        parts.push({ partNumber, etag });
        
        partNumber++;
        currentPartData = [];
        currentPartSize = 0;
      }
    }
    
    // Upload remaining data as final part
    if (currentPartSize > 0) {
      const partBuffer = new Uint8Array(currentPartSize);
      let offset = 0;
      for (const c of currentPartData) {
        partBuffer.set(c, offset);
        offset += c.length;
      }
      
      console.log(`Uploading final part ${partNumber} (${(currentPartSize / 1024 / 1024).toFixed(2)} MB)`);
      const etag = await uploadPart(fileName, uploadId, partNumber, partBuffer.buffer);
      parts.push({ partNumber, etag });
    }
    
    // Complete the multipart upload
    console.log(`Completing multipart upload with ${parts.length} parts`);
    await completeMultipartUpload(fileName, uploadId, parts);
    
    console.log(`Multipart upload completed: ${fileName}`);
    return `${R2_PUBLIC_URL}/${fileName}`;
    
  } catch (error) {
    console.error(`Multipart upload failed, aborting: ${error}`);
    await abortMultipartUpload(fileName, uploadId);
    throw error;
  }
}

// Main upload function - chooses strategy based on size
async function uploadToR2(
  chunks: Uint8Array[],
  totalSize: number,
  fileName: string,
  contentType: string
): Promise<string> {
  if (totalSize <= MAX_SINGLE_UPLOAD_SIZE) {
    console.log(`Using simple upload for ${fileName} (${(totalSize / 1024 / 1024).toFixed(2)} MB)`);
    const buffer = combineChunks(chunks);
    return await uploadToR2Simple(buffer, fileName, contentType);
  } else {
    return await uploadToR2Multipart(chunks, totalSize, fileName, contentType);
  }
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
    console.log(`Starting migration for video: ${originalVideoUrl}`);
    
    // Stream download to avoid memory issues
    const { size, chunks } = await downloadFileStreaming(originalVideoUrl);
    
    // Extract original filename
    const urlParts = originalVideoUrl.split('/');
    const originalFileName = urlParts[urlParts.length - 1].split('?')[0];
    const timestamp = Date.now();
    const newFileName = `${userId}/videos/migrated-${timestamp}-${originalFileName}`;
    
    // Determine content type
    const ext = originalFileName.split('.').pop()?.toLowerCase() || 'mp4';
    const contentTypes: Record<string, string> = {
      'mp4': 'video/mp4',
      'mov': 'video/quicktime',
      'avi': 'video/x-msvideo',
      'mkv': 'video/x-matroska',
      'webm': 'video/webm',
    };
    const contentType = contentTypes[ext] || 'video/mp4';
    
    newVideoUrl = await uploadToR2(chunks, size, newFileName, contentType);
    console.log(`Video migrated successfully: ${newVideoUrl}`);
    
    // Clear chunks from memory
    chunks.length = 0;
  }
  
  // Migrate thumbnail file (these are always small, use simple approach)
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
      
      newThumbnailUrl = await uploadToR2Simple(thumbData, newFileName, contentType);
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
    
    const { action, videoId, batchSize = 1 } = await req.json();
    
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
      // For batch, we only process ONE video at a time to avoid memory issues
      const actualBatchSize = Math.min(batchSize, 1);
      
      // Get pending videos for batch migration
      const { data: videos, error } = await supabaseAdmin
        .from('videos')
        .select('id, video_url, thumbnail_url, user_id, title')
        .not('video_url', 'like', '%r2.dev%')
        .not('video_url', 'like', '%youtube.com%')
        .not('video_url', 'like', '%youtu.be%')
        .order('created_at', { ascending: true })
        .limit(10); // Get more to filter
      
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
      }).slice(0, actualBatchSize) || [];
      
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
