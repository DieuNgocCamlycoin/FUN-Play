import { supabase } from "@/integrations/supabase/client";
import { slugify } from "./slugify";

const MAX_SLUG_CHANGES_PER_DAY = 5;

/**
 * Generate a unique slug for a video, checking for collisions within the user's videos.
 */
export async function generateUniqueSlug(
  userId: string,
  title: string,
  excludeVideoId?: string
): Promise<string> {
  const baseSlug = slugify(title);

  // Check if base slug is available
  const { data: existing } = await supabase
    .from("videos")
    .select("id")
    .eq("user_id", userId)
    .eq("slug", baseSlug)
    .neq("id", excludeVideoId || "00000000-0000-0000-0000-000000000000")
    .maybeSingle();

  if (!existing) return baseSlug;

  // Try numbered suffixes
  for (let i = 2; i <= 50; i++) {
    const candidate = `${baseSlug}-${i}`;
    const { data: dup } = await supabase
      .from("videos")
      .select("id")
      .eq("user_id", userId)
      .eq("slug", candidate)
      .neq("id", excludeVideoId || "00000000-0000-0000-0000-000000000000")
      .maybeSingle();

    if (!dup) return candidate;
  }

  // Fallback: append random chars
  return `${baseSlug}-${Math.random().toString(36).substring(2, 6)}`;
}

/**
 * Update a video's slug when its title changes.
 * Archives old slug to history and enforces rate limiting.
 * 
 * Note: The DB trigger handles most of this automatically on title UPDATE.
 * This function is for explicit slug governance from the client side.
 */
export async function updateVideoSlug(
  videoId: string,
  newTitle: string,
  userId: string
): Promise<{ success: boolean; newSlug?: string; error?: string }> {
  try {
    // Rate limit check: count slug changes today
    const today = new Date().toISOString().split("T")[0];
    const { count } = await supabase
      .from("video_slug_history")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", `${today}T00:00:00Z`);

    if ((count || 0) >= MAX_SLUG_CHANGES_PER_DAY) {
      return {
        success: false,
        error: `Bạn chỉ được đổi slug tối đa ${MAX_SLUG_CHANGES_PER_DAY} lần/ngày.`,
      };
    }

    // The DB trigger will handle:
    // 1. Generating new slug from new title
    // 2. Archiving old slug to video_slug_history
    // 3. Ensuring uniqueness
    // We just need to update the title
    const { data, error } = await supabase
      .from("videos")
      .update({ title: newTitle })
      .eq("id", videoId)
      .eq("user_id", userId)
      .select("slug")
      .single();

    if (error) throw error;

    return { success: true, newSlug: data?.slug };
  } catch (err: any) {
    console.error("[slugGovernance] Error:", err);
    return { success: false, error: err.message || "Không thể cập nhật slug" };
  }
}

/**
 * Lookup a video by old slug from history (for redirect purposes).
 * Returns the current video info if found in history.
 */
export async function lookupSlugHistory(
  username: string,
  oldSlug: string
): Promise<{ videoId: string; currentSlug: string } | null> {
  // First get user_id from username
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();

  if (!profile) return null;

  // Look up in slug history
  const { data: history } = await supabase
    .from("video_slug_history")
    .select("video_id")
    .eq("user_id", profile.id)
    .eq("old_slug", oldSlug)
    .maybeSingle();

  if (!history) return null;

  // Get current slug
  const { data: video } = await supabase
    .from("videos")
    .select("id, slug")
    .eq("id", history.video_id)
    .maybeSingle();

  if (!video?.slug) return null;

  return { videoId: video.id, currentSlug: video.slug };
}
