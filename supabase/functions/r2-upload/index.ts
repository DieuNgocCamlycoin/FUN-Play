import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to create HMAC-SHA256 signature
async function hmacSha256(key: Uint8Array, message: string): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key.buffer as ArrayBuffer,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(message));
  return new Uint8Array(signature);
}

async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function getSignatureKey(secretKey: string, dateStamp: string, region: string, service: string): Promise<Uint8Array> {
  const kDate = await hmacSha256(new TextEncoder().encode('AWS4' + secretKey), dateStamp);
  const kRegion = await hmacSha256(kDate, region);
  const kService = await hmacSha256(kRegion, service);
  const kSigning = await hmacSha256(kService, 'aws4_request');
  return kSigning;
}

// Generate presigned URL for direct browser upload
async function generatePresignedUrl(
  accessKeyId: string,
  secretAccessKey: string,
  bucket: string,
  key: string,
  endpoint: string,
  expiresIn: number = 3600,
  contentType?: string
): Promise<string> {
  const region = 'auto';
  const service = 's3';
  
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '').substring(0, 15) + 'Z';
  const dateStamp = amzDate.substring(0, 8);
  
  const endpointUrl = new URL(endpoint);
  const host = `${bucket}.${endpointUrl.hostname}`;
  const canonicalUri = '/' + key.split('/').map(encodeURIComponent).join('/');
  
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const credential = `${accessKeyId}/${credentialScope}`;
  
  // Build query parameters
  const queryParams: Record<string, string> = {
    'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
    'X-Amz-Credential': credential,
    'X-Amz-Date': amzDate,
    'X-Amz-Expires': expiresIn.toString(),
    'X-Amz-SignedHeaders': 'host',
  };
  
  // Sort and encode query string
  const sortedParams = Object.keys(queryParams).sort();
  const canonicalQueryString = sortedParams
    .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(queryParams[k])}`)
    .join('&');
  
  const canonicalHeaders = `host:${host}\n`;
  const signedHeaders = 'host';
  
  const canonicalRequest = [
    'PUT',
    canonicalUri,
    canonicalQueryString,
    canonicalHeaders,
    signedHeaders,
    'UNSIGNED-PAYLOAD'
  ].join('\n');
  
  const hashedCanonicalRequest = await sha256(canonicalRequest);
  
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    hashedCanonicalRequest
  ].join('\n');
  
  const signingKey = await getSignatureKey(secretAccessKey, dateStamp, region, service);
  const signature = toHex(await hmacSha256(signingKey, stringToSign));
  
  const presignedUrl = `https://${host}${canonicalUri}?${canonicalQueryString}&X-Amz-Signature=${signature}`;
  
  return presignedUrl;
}

// Initiate multipart upload
async function initiateMultipartUpload(
  accessKeyId: string,
  secretAccessKey: string,
  bucket: string,
  key: string,
  endpoint: string,
  contentType: string
): Promise<string> {
  const region = 'auto';
  const service = 's3';
  
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '').substring(0, 15) + 'Z';
  const dateStamp = amzDate.substring(0, 8);
  
  const endpointUrl = new URL(endpoint);
  const host = `${bucket}.${endpointUrl.hostname}`;
  const canonicalUri = '/' + key.split('/').map(encodeURIComponent).join('/');
  
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  
  const canonicalQueryString = 'uploads=';
  const signedHeaders = 'content-type;host;x-amz-content-sha256;x-amz-date';
  const canonicalHeaders = `content-type:${contentType}\nhost:${host}\nx-amz-content-sha256:UNSIGNED-PAYLOAD\nx-amz-date:${amzDate}\n`;
  
  const canonicalRequest = [
    'POST',
    canonicalUri,
    canonicalQueryString,
    canonicalHeaders,
    signedHeaders,
    'UNSIGNED-PAYLOAD'
  ].join('\n');
  
  const hashedCanonicalRequest = await sha256(canonicalRequest);
  
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    hashedCanonicalRequest
  ].join('\n');
  
  const signingKey = await getSignatureKey(secretAccessKey, dateStamp, region, service);
  const signature = toHex(await hmacSha256(signingKey, stringToSign));
  
  const authorizationHeader = `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
  
  const url = `https://${host}${canonicalUri}?uploads=`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': authorizationHeader,
      'x-amz-date': amzDate,
      'x-amz-content-sha256': 'UNSIGNED-PAYLOAD',
      'Content-Type': contentType,
      'Host': host
    }
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('InitiateMultipartUpload failed:', response.status, errorText);
    throw new Error(`Failed to initiate multipart upload: ${response.status}`);
  }
  
  const xmlText = await response.text();
  const uploadIdMatch = xmlText.match(/<UploadId>([^<]+)<\/UploadId>/);
  
  if (!uploadIdMatch) {
    throw new Error('Failed to parse UploadId from response');
  }
  
  return uploadIdMatch[1];
}

// Generate presigned URL for uploading a part
async function generatePartPresignedUrl(
  accessKeyId: string,
  secretAccessKey: string,
  bucket: string,
  key: string,
  endpoint: string,
  uploadId: string,
  partNumber: number,
  expiresIn: number = 3600
): Promise<string> {
  const region = 'auto';
  const service = 's3';
  
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '').substring(0, 15) + 'Z';
  const dateStamp = amzDate.substring(0, 8);
  
  const endpointUrl = new URL(endpoint);
  const host = `${bucket}.${endpointUrl.hostname}`;
  const canonicalUri = '/' + key.split('/').map(encodeURIComponent).join('/');
  
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const credential = `${accessKeyId}/${credentialScope}`;
  
  const queryParams: Record<string, string> = {
    'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
    'X-Amz-Credential': credential,
    'X-Amz-Date': amzDate,
    'X-Amz-Expires': expiresIn.toString(),
    'X-Amz-SignedHeaders': 'host',
    'partNumber': partNumber.toString(),
    'uploadId': uploadId,
  };
  
  const sortedParams = Object.keys(queryParams).sort();
  const canonicalQueryString = sortedParams
    .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(queryParams[k])}`)
    .join('&');
  
  const canonicalHeaders = `host:${host}\n`;
  const signedHeaders = 'host';
  
  const canonicalRequest = [
    'PUT',
    canonicalUri,
    canonicalQueryString,
    canonicalHeaders,
    signedHeaders,
    'UNSIGNED-PAYLOAD'
  ].join('\n');
  
  const hashedCanonicalRequest = await sha256(canonicalRequest);
  
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    hashedCanonicalRequest
  ].join('\n');
  
  const signingKey = await getSignatureKey(secretAccessKey, dateStamp, region, service);
  const signature = toHex(await hmacSha256(signingKey, stringToSign));
  
  return `https://${host}${canonicalUri}?${canonicalQueryString}&X-Amz-Signature=${signature}`;
}

// Complete multipart upload
async function completeMultipartUpload(
  accessKeyId: string,
  secretAccessKey: string,
  bucket: string,
  key: string,
  endpoint: string,
  uploadId: string,
  parts: { partNumber: number; etag: string }[]
): Promise<void> {
  const region = 'auto';
  const service = 's3';
  
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '').substring(0, 15) + 'Z';
  const dateStamp = amzDate.substring(0, 8);
  
  const endpointUrl = new URL(endpoint);
  const host = `${bucket}.${endpointUrl.hostname}`;
  const canonicalUri = '/' + key.split('/').map(encodeURIComponent).join('/');
  
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  
  // Build XML body
  const partsXml = parts
    .sort((a, b) => a.partNumber - b.partNumber)
    .map(p => `<Part><PartNumber>${p.partNumber}</PartNumber><ETag>${p.etag}</ETag></Part>`)
    .join('');
  const body = `<CompleteMultipartUpload>${partsXml}</CompleteMultipartUpload>`;
  
  const payloadHash = await sha256(body);
  
  const canonicalQueryString = `uploadId=${encodeURIComponent(uploadId)}`;
  const signedHeaders = 'content-type;host;x-amz-content-sha256;x-amz-date';
  const canonicalHeaders = `content-type:application/xml\nhost:${host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amzDate}\n`;
  
  const canonicalRequest = [
    'POST',
    canonicalUri,
    canonicalQueryString,
    canonicalHeaders,
    signedHeaders,
    payloadHash
  ].join('\n');
  
  const hashedCanonicalRequest = await sha256(canonicalRequest);
  
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    hashedCanonicalRequest
  ].join('\n');
  
  const signingKey = await getSignatureKey(secretAccessKey, dateStamp, region, service);
  const signature = toHex(await hmacSha256(signingKey, stringToSign));
  
  const authorizationHeader = `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
  
  const url = `https://${host}${canonicalUri}?${canonicalQueryString}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': authorizationHeader,
      'x-amz-date': amzDate,
      'x-amz-content-sha256': payloadHash,
      'Content-Type': 'application/xml',
      'Host': host
    },
    body: body
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('CompleteMultipartUpload failed:', response.status, errorText);
    throw new Error(`Failed to complete multipart upload: ${response.status}`);
  }
}

// Delete operation
async function deleteObject(
  accessKeyId: string,
  secretAccessKey: string,
  bucket: string,
  key: string,
  endpoint: string
): Promise<void> {
  const region = 'auto';
  const service = 's3';
  
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '').substring(0, 15) + 'Z';
  const dateStamp = amzDate.substring(0, 8);
  
  const endpointUrl = new URL(endpoint);
  const host = `${bucket}.${endpointUrl.hostname}`;
  const canonicalUri = '/' + key.split('/').map(encodeURIComponent).join('/');
  
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  
  const signedHeaders = 'host;x-amz-content-sha256;x-amz-date';
  const canonicalHeaders = `host:${host}\nx-amz-content-sha256:UNSIGNED-PAYLOAD\nx-amz-date:${amzDate}\n`;
  
  const canonicalRequest = [
    'DELETE',
    canonicalUri,
    '',
    canonicalHeaders,
    signedHeaders,
    'UNSIGNED-PAYLOAD'
  ].join('\n');
  
  const hashedCanonicalRequest = await sha256(canonicalRequest);
  
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    hashedCanonicalRequest
  ].join('\n');
  
  const signingKey = await getSignatureKey(secretAccessKey, dateStamp, region, service);
  const signature = toHex(await hmacSha256(signingKey, stringToSign));
  
  const authorizationHeader = `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
  
  const url = `https://${host}${canonicalUri}`;
  
  await fetch(url, {
    method: 'DELETE',
    headers: {
      'Authorization': authorizationHeader,
      'x-amz-date': amzDate,
      'x-amz-content-sha256': 'UNSIGNED-PAYLOAD',
      'Host': host
    }
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    
    // Extract token from Authorization header
    const token = authHeader.replace('Bearer ', '');
    console.log('Token received:', token ? `${token.substring(0, 20)}...` : 'empty');
    
    // Create admin client with service role key for token validation
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { 
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
      }
    });

    // Validate the user's JWT token using service role client
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Auth error:', authError?.message);
      return new Response(
        JSON.stringify({ error: 'Unauthorized', details: authError?.message }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = user.id;
    console.log(`User authenticated: ${userId}`);

    const R2_ACCESS_KEY_ID = Deno.env.get('R2_ACCESS_KEY_ID') ?? '';
    const R2_SECRET_ACCESS_KEY = Deno.env.get('R2_SECRET_ACCESS_KEY') ?? '';
    const R2_BUCKET_NAME = Deno.env.get('R2_BUCKET_NAME') ?? '';
    const R2_ENDPOINT = Deno.env.get('R2_ENDPOINT') ?? '';
    const R2_PUBLIC_URL = Deno.env.get('R2_PUBLIC_URL') ?? '';

    if (!R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME || !R2_ENDPOINT) {
      return new Response(
        JSON.stringify({ error: 'R2 not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { action, fileName, contentType, fileSize, uploadId, partNumber, parts } = body;

    console.log(`Action: ${action}, File: ${fileName}, Size: ${fileSize}`);

    // Ensure file path starts with user ID for security
    const secureFileName = fileName.startsWith(userId) ? fileName : `${userId}/${fileName}`;

    switch (action) {
      case 'getPresignedUrl': {
        // Simple presigned URL for direct upload (files < 5GB)
        const presignedUrl = await generatePresignedUrl(
          R2_ACCESS_KEY_ID,
          R2_SECRET_ACCESS_KEY,
          R2_BUCKET_NAME,
          secureFileName,
          R2_ENDPOINT,
          7200, // 2 hours expiry for large files
          contentType
        );
        
        const publicUrl = `${R2_PUBLIC_URL}/${secureFileName}`;
        
        return new Response(
          JSON.stringify({ presignedUrl, publicUrl, fileName: secureFileName }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'initiateMultipart': {
        // Start multipart upload for large files
        const newUploadId = await initiateMultipartUpload(
          R2_ACCESS_KEY_ID,
          R2_SECRET_ACCESS_KEY,
          R2_BUCKET_NAME,
          secureFileName,
          R2_ENDPOINT,
          contentType || 'application/octet-stream'
        );
        
        const publicUrl = `${R2_PUBLIC_URL}/${secureFileName}`;
        
        console.log(`Multipart upload initiated: ${newUploadId}`);
        
        return new Response(
          JSON.stringify({ uploadId: newUploadId, publicUrl, fileName: secureFileName }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'getPartUrl': {
        // Get presigned URL for uploading a specific part
        if (!uploadId || !partNumber) {
          return new Response(
            JSON.stringify({ error: 'Missing uploadId or partNumber' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        const partUrl = await generatePartPresignedUrl(
          R2_ACCESS_KEY_ID,
          R2_SECRET_ACCESS_KEY,
          R2_BUCKET_NAME,
          secureFileName,
          R2_ENDPOINT,
          uploadId,
          partNumber,
          7200
        );
        
        return new Response(
          JSON.stringify({ presignedUrl: partUrl }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'completeMultipart': {
        // Complete multipart upload
        if (!uploadId || !parts || !Array.isArray(parts)) {
          return new Response(
            JSON.stringify({ error: 'Missing uploadId or parts' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        await completeMultipartUpload(
          R2_ACCESS_KEY_ID,
          R2_SECRET_ACCESS_KEY,
          R2_BUCKET_NAME,
          secureFileName,
          R2_ENDPOINT,
          uploadId,
          parts
        );
        
        const publicUrl = `${R2_PUBLIC_URL}/${secureFileName}`;
        
        console.log(`Multipart upload completed: ${publicUrl}`);
        
        return new Response(
          JSON.stringify({ success: true, publicUrl }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'delete': {
        // Verify ownership
        if (!fileName.startsWith(userId)) {
          return new Response(
            JSON.stringify({ error: 'Forbidden' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        await deleteObject(
          R2_ACCESS_KEY_ID,
          R2_SECRET_ACCESS_KEY,
          R2_BUCKET_NAME,
          fileName,
          R2_ENDPOINT
        );
        
        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

  } catch (error: unknown) {
    console.error('R2 Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
