import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      return new Response(
        JSON.stringify({ error: 'Không có quyền truy cập' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client with user's token
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabaseUser = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get user from token
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      console.error('User verification failed:', userError);
      return new Response(
        JSON.stringify({ error: 'Không thể xác thực người dùng' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('User authenticated:', user.id);

    // Use service role client for admin operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Check if user is admin
    const { data: isAdmin, error: roleError } = await supabaseAdmin.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    if (roleError || !isAdmin) {
      console.error('Admin check failed:', roleError, 'isAdmin:', isAdmin);
      return new Response(
        JSON.stringify({ error: 'Chỉ admin mới có quyền thay đổi cấu hình' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('User is admin, proceeding with config update');

    // Parse request body
    const { config_key, config_value } = await req.json();

    if (!config_key || config_value === undefined) {
      return new Response(
        JSON.stringify({ error: 'Thiếu thông tin config_key hoặc config_value' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Updating config:', config_key, 'to value:', config_value);

    // Get current config value for history
    const { data: currentConfig, error: fetchError } = await supabaseAdmin
      .from('reward_config')
      .select('id, config_value')
      .eq('config_key', config_key)
      .single();

    if (fetchError) {
      console.error('Error fetching current config:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Không tìm thấy cấu hình: ' + config_key }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const oldValue = currentConfig.config_value;

    // Update config value
    const { error: updateError } = await supabaseAdmin
      .from('reward_config')
      .update({ 
        config_value: config_value,
        updated_at: new Date().toISOString(),
        updated_by: user.id
      })
      .eq('config_key', config_key);

    if (updateError) {
      console.error('Error updating config:', updateError);
      return new Response(
        JSON.stringify({ error: 'Lỗi khi cập nhật cấu hình' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Record history
    const { error: historyError } = await supabaseAdmin
      .from('reward_config_history')
      .insert({
        config_id: currentConfig.id,
        config_key: config_key,
        old_value: oldValue,
        new_value: config_value,
        changed_by: user.id
      });

    if (historyError) {
      console.error('Error recording history:', historyError);
      // Don't fail the request if history recording fails
    }

    console.log('Config updated successfully:', config_key, 'from', oldValue, 'to', config_value);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Đã cập nhật ${config_key} từ ${oldValue} thành ${config_value}`,
        old_value: oldValue,
        new_value: config_value
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Lỗi server: ' + errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
