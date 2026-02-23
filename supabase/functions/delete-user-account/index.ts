import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify caller identity
    const supabaseAuth = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const adminId = claimsData.claims.sub as string;

    // Check admin role
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const { data: isAdmin } = await supabaseAdmin.rpc("has_role", {
      _user_id: adminId,
      _role: "admin",
    });
    const { data: isOwner } = await supabaseAdmin.rpc("is_owner", {
      _user_id: adminId,
    });
    if (!isAdmin && !isOwner) {
      return new Response(JSON.stringify({ error: "Forbidden: admin only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { user_id } = await req.json();
    if (!user_id) {
      return new Response(JSON.stringify({ error: "user_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Prevent deleting self
    if (user_id === adminId) {
      return new Response(JSON.stringify({ error: "Cannot delete your own account" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Prevent deleting owners
    const { data: targetIsOwner } = await supabaseAdmin.rpc("is_owner", { _user_id: user_id });
    if (targetIsOwner) {
      return new Response(JSON.stringify({ error: "Cannot delete owner account" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user's channel IDs and video IDs first
    const { data: channels } = await supabaseAdmin
      .from("channels")
      .select("id")
      .eq("user_id", user_id);
    const channelIds = (channels || []).map((c: any) => c.id);

    const { data: videos } = await supabaseAdmin
      .from("videos")
      .select("id")
      .eq("user_id", user_id);
    const videoIds = (videos || []).map((v: any) => v.id);

    // Delete all related data (order matters for FK constraints)
    // 1. Video-related
    if (videoIds.length > 0) {
      await supabaseAdmin.from("video_watch_progress").delete().in("video_id", videoIds);
      await supabaseAdmin.from("view_logs").delete().in("video_id", videoIds);
      await supabaseAdmin.from("content_hashes").delete().in("video_id", videoIds);
      await supabaseAdmin.from("video_reports").delete().in("video_id", videoIds);
      await supabaseAdmin.from("video_migrations").delete().in("video_id", videoIds);
      await supabaseAdmin.from("playlist_videos").delete().in("video_id", videoIds);
      await supabaseAdmin.from("meditation_playlist_videos").delete().in("video_id", videoIds);
      // Delete comments on user's videos (and their likes)
      const { data: videoComments } = await supabaseAdmin
        .from("comments")
        .select("id")
        .in("video_id", videoIds);
      const videoCommentIds = (videoComments || []).map((c: any) => c.id);
      if (videoCommentIds.length > 0) {
        await supabaseAdmin.from("comment_likes").delete().in("comment_id", videoCommentIds);
        await supabaseAdmin.from("comment_logs").delete().in("comment_id", videoCommentIds);
      }
      await supabaseAdmin.from("comments").delete().in("video_id", videoIds);
      await supabaseAdmin.from("likes").delete().in("video_id", videoIds);
      await supabaseAdmin.from("reward_transactions").delete().in("video_id", videoIds);
    }

    // 2. User's own comments on other videos
    const { data: userComments } = await supabaseAdmin
      .from("comments")
      .select("id")
      .eq("user_id", user_id);
    const userCommentIds = (userComments || []).map((c: any) => c.id);
    if (userCommentIds.length > 0) {
      await supabaseAdmin.from("comment_likes").delete().in("comment_id", userCommentIds);
      await supabaseAdmin.from("comment_logs").delete().in("comment_id", userCommentIds);
    }
    await supabaseAdmin.from("comments").delete().eq("user_id", user_id);
    await supabaseAdmin.from("comment_logs").delete().eq("user_id", user_id);

    // 3. Likes by user
    await supabaseAdmin.from("likes").delete().eq("user_id", user_id);
    await supabaseAdmin.from("comment_likes").delete().eq("user_id", user_id);

    // 4. Videos
    if (videoIds.length > 0) {
      await supabaseAdmin.from("videos").delete().in("id", videoIds);
    }

    // 5. Channel-related
    if (channelIds.length > 0) {
      await supabaseAdmin.from("subscriptions").delete().in("channel_id", channelIds);
      await supabaseAdmin.from("channel_reports").delete().in("channel_id", channelIds);
      // Posts and post comments/likes
      const { data: posts } = await supabaseAdmin
        .from("posts")
        .select("id")
        .in("channel_id", channelIds);
      const postIds = (posts || []).map((p: any) => p.id);
      if (postIds.length > 0) {
        const { data: postComments } = await supabaseAdmin
          .from("post_comments")
          .select("id")
          .in("post_id", postIds);
        const postCommentIds = (postComments || []).map((c: any) => c.id);
        if (postCommentIds.length > 0) {
          await supabaseAdmin.from("post_comment_likes").delete().in("comment_id", postCommentIds);
        }
        await supabaseAdmin.from("post_comments").delete().in("post_id", postIds);
        await supabaseAdmin.from("post_likes").delete().in("post_id", postIds);
        await supabaseAdmin.from("posts").delete().in("id", postIds);
      }
      await supabaseAdmin.from("channels").delete().in("id", channelIds);
    }

    // 6. Subscriptions by user
    await supabaseAdmin.from("subscriptions").delete().eq("subscriber_id", user_id);

    // 7. Rewards & claims
    await supabaseAdmin.from("reward_transactions").delete().eq("user_id", user_id);
    await supabaseAdmin.from("reward_actions").delete().eq("user_id", user_id);
    await supabaseAdmin.from("reward_approvals").delete().eq("user_id", user_id);
    await supabaseAdmin.from("reward_bans").delete().eq("user_id", user_id);
    await supabaseAdmin.from("claim_requests").delete().eq("user_id", user_id);
    await supabaseAdmin.from("daily_reward_limits").delete().eq("user_id", user_id);
    await supabaseAdmin.from("daily_claim_records").delete().eq("user_id", user_id);

    // 8. Wallet related
    await supabaseAdmin.from("wallet_change_log").delete().eq("user_id", user_id);
    await supabaseAdmin.from("wallet_history").delete().eq("user_id", user_id);
    await supabaseAdmin.from("wallet_links").delete().eq("user_id", user_id);
    await supabaseAdmin.from("blacklisted_wallets").delete().eq("user_id", user_id);
    await supabaseAdmin.from("internal_wallets").delete().eq("user_id", user_id);

    // 9. Misc
    await supabaseAdmin.from("notifications").delete().eq("user_id", user_id);
    await supabaseAdmin.from("ip_tracking").delete().eq("user_id", user_id);
    await supabaseAdmin.from("user_sessions").delete().eq("user_id", user_id);
    await supabaseAdmin.from("mint_requests").delete().eq("user_id", user_id);
    await supabaseAdmin.from("bounty_submissions").delete().eq("user_id", user_id);
    await supabaseAdmin.from("bounty_upvotes").delete().eq("user_id", user_id);
    await supabaseAdmin.from("user_roles").delete().eq("user_id", user_id);

    // 10. AI music
    const { data: aiMusic } = await supabaseAdmin
      .from("ai_generated_music")
      .select("id")
      .eq("user_id", user_id);
    const aiMusicIds = (aiMusic || []).map((m: any) => m.id);
    if (aiMusicIds.length > 0) {
      await supabaseAdmin.from("ai_music_likes").delete().in("music_id", aiMusicIds);
      await supabaseAdmin.from("ai_generated_music").delete().in("id", aiMusicIds);
    }

    // 11. Angel chat
    const { data: chatSessions } = await supabaseAdmin
      .from("angel_chat_sessions")
      .select("id")
      .eq("user_id", user_id);
    const sessionIds = (chatSessions || []).map((s: any) => s.id);
    if (sessionIds.length > 0) {
      await supabaseAdmin.from("angel_chat_messages").delete().in("session_id", sessionIds);
      await supabaseAdmin.from("angel_chat_sessions").delete().in("id", sessionIds);
    }

    // 12. Chat messages
    const { data: userChats } = await supabaseAdmin
      .from("user_chats")
      .select("id")
      .or(`user1_id.eq.${user_id},user2_id.eq.${user_id}`);
    const chatIds = (userChats || []).map((c: any) => c.id);
    if (chatIds.length > 0) {
      await supabaseAdmin.from("chat_messages").delete().in("chat_id", chatIds);
      await supabaseAdmin.from("user_chats").delete().in("id", chatIds);
    }

    // 13. Playlists
    const { data: playlists } = await supabaseAdmin
      .from("playlists")
      .select("id")
      .eq("user_id", user_id);
    const playlistIds = (playlists || []).map((p: any) => p.id);
    if (playlistIds.length > 0) {
      await supabaseAdmin.from("playlist_videos").delete().in("playlist_id", playlistIds);
      await supabaseAdmin.from("playlists").delete().in("id", playlistIds);
    }

    // 14. Meditation playlists
    const { data: medPlaylists } = await supabaseAdmin
      .from("meditation_playlists")
      .select("id")
      .eq("user_id", user_id);
    const medPlaylistIds = (medPlaylists || []).map((p: any) => p.id);
    if (medPlaylistIds.length > 0) {
      await supabaseAdmin.from("meditation_playlist_videos").delete().in("playlist_id", medPlaylistIds);
      await supabaseAdmin.from("meditation_playlists").delete().in("id", medPlaylistIds);
    }

    // 15. Donation transactions (as sender or receiver)
    await supabaseAdmin.from("donation_transactions").delete().eq("sender_id", user_id);
    await supabaseAdmin.from("donation_transactions").delete().eq("receiver_id", user_id);

    // 16. Post comments/likes by user on others' posts
    await supabaseAdmin.from("post_comment_likes").delete().eq("user_id", user_id);
    await supabaseAdmin.from("post_comments").delete().eq("user_id", user_id);
    await supabaseAdmin.from("post_likes").delete().eq("user_id", user_id);

    // 17. Video watch progress by user
    await supabaseAdmin.from("video_watch_progress").delete().eq("user_id", user_id);
    await supabaseAdmin.from("view_logs").delete().eq("user_id", user_id);

    // 18. Delete profile
    await supabaseAdmin.from("profiles").delete().eq("id", user_id);

    // 19. Delete auth user (frees email)
    const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(user_id);
    if (deleteAuthError) {
      console.error("Error deleting auth user:", deleteAuthError);
      return new Response(
        JSON.stringify({ error: "Profile deleted but auth deletion failed: " + deleteAuthError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "User account fully deleted" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("delete-user-account error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
