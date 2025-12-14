import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "https://esm.sh/@aws-sdk/client-s3@3.632.0";
import { getSignedUrl } from "https://esm.sh/@aws-sdk/s3-request-presigner@3.632.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Maximum file size: 500MB
const MAX_FILE_SIZE = 500 * 1024 * 1024;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Validate Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      return new Response(
        JSON.stringify({ error: 'Unauthorized: No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Verify the user with Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('Auth error:', authError?.message);
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = user.id;
    console.log(`Authenticated user: ${userId}`);

    // 3. Get R2 configuration
    const R2_ACCESS_KEY_ID = Deno.env.get('R2_ACCESS_KEY_ID');
    const R2_SECRET_ACCESS_KEY = Deno.env.get('R2_SECRET_ACCESS_KEY');
    const R2_BUCKET_NAME = Deno.env.get('R2_BUCKET_NAME');
    const R2_ENDPOINT = Deno.env.get('R2_ENDPOINT');
    const R2_PUBLIC_URL = Deno.env.get('R2_PUBLIC_URL');

    if (!R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME || !R2_ENDPOINT || !R2_PUBLIC_URL) {
      console.error('Missing R2 configuration');
      return new Response(
        JSON.stringify({ error: 'R2 storage not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Create S3 client for R2
    const s3Client = new S3Client({
      region: 'auto',
      endpoint: R2_ENDPOINT,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
    });

    const { action, fileName, contentType, fileSize } = await req.json();
    console.log(`R2 Upload Request: action=${action}, fileName=${fileName}, contentType=${contentType}, size=${fileSize}, user=${userId}`);

    // 5. Validate file size
    if (action === 'getPresignedUrl' && fileSize && fileSize > MAX_FILE_SIZE) {
      return new Response(
        JSON.stringify({ error: 'File too large. Maximum size is 500MB.' }),
        { status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'getPresignedUrl') {
      // Prefix filename with userId to ensure user can only upload to their own folder
      const secureFileName = `${userId}/${fileName}`;
      
      const command = new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: secureFileName,
        ContentType: contentType,
      });

      const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
      const publicUrl = `${R2_PUBLIC_URL}/${secureFileName}`;

      console.log(`Generated presigned URL for: ${secureFileName}`);

      return new Response(
        JSON.stringify({ 
          presignedUrl, 
          publicUrl,
          fileName: secureFileName 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'delete') {
      // 6. Verify user owns the file (file path must start with their userId)
      const fileUserId = fileName.split('/')[0];
      if (fileUserId !== userId) {
        console.error(`User ${userId} attempted to delete file owned by ${fileUserId}`);
        return new Response(
          JSON.stringify({ error: 'Forbidden: You can only delete your own files' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const command = new DeleteObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: fileName,
      });

      await s3Client.send(command);
      console.log(`Deleted file from R2: ${fileName}`);

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('R2 Upload Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
