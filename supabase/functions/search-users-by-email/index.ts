import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create client with user's token to verify identity
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user is owner using RPC
    const { data: isOwner, error: ownerError } = await supabaseUser.rpc("is_owner", {
      _user_id: user.id,
    });

    if (ownerError || !isOwner) {
      return new Response(
        JSON.stringify({ error: "Only owners can search by email" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const { email } = await req.json();
    if (!email || typeof email !== "string" || email.trim().length < 3) {
      return new Response(
        JSON.stringify({ error: "Email query must be at least 3 characters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create admin client to query auth.users
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Search users by email using admin API
    const { data: authUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers({
      perPage: 50,
    });

    if (listError) {
      console.error("Error listing users:", listError);
      return new Response(
        JSON.stringify({ error: "Failed to search users" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Filter users by email pattern
    const emailLower = email.toLowerCase().trim();
    const matchedUsers = authUsers.users.filter((u) =>
      u.email?.toLowerCase().includes(emailLower)
    );

    // Get existing admins/owners to filter them out
    const { data: existingRoles } = await supabaseAdmin
      .from("user_roles")
      .select("user_id")
      .in("role", ["admin", "owner"]);

    const existingIds = new Set(existingRoles?.map((r) => r.user_id) || []);

    // Get profiles for matched users
    const matchedIds = matchedUsers.map((u) => u.id);
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, username, display_name, avatar_url")
      .in("id", matchedIds);

    // Build response - filter out existing admins and return profile info
    const results = (profiles || [])
      .filter((p) => !existingIds.has(p.id))
      .map((p) => ({
        id: p.id,
        username: p.username,
        display_name: p.display_name,
        avatar_url: p.avatar_url,
      }));

    return new Response(JSON.stringify({ users: results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in search-users-by-email:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
