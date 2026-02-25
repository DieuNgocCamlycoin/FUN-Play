import { supabase } from "@/integrations/supabase/client";
import { slugify } from "./slugify";
import { useNavigate } from "react-router-dom";
import { useCallback } from "react";
import { PRODUCTION_URL } from "./shareUtils";

const postPathCache = new Map<string, string>();

/**
 * Build a clean post path from username + slug
 */
export function buildPostPath(username: string, slug: string): string {
  return `/${username}/post/${slug}`;
}

/**
 * Get the production share URL for a post
 */
export function getPostShareUrl(username: string, slug: string): string {
  return `${PRODUCTION_URL}/${username}/post/${slug}`;
}

/**
 * Async version - fetches username + slug from DB when only postId is available.
 */
export async function getPostPath(postId: string): Promise<string> {
  if (postPathCache.has(postId)) {
    return postPathCache.get(postId)!;
  }

  try {
    const { data } = await supabase
      .from("posts")
      .select("slug, user_id")
      .eq("id", postId)
      .maybeSingle();

    if (!data) throw new Error("Post not found");

    const { data: profile } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", data.user_id)
      .maybeSingle();

    if (profile?.username && data.slug) {
      const path = `/${profile.username}/post/${data.slug}`;
      postPathCache.set(postId, path);
      return path;
    }
  } catch (error) {
    console.error("[postNavigation] Error resolving path:", error);
  }

  // Fallback: legacy URL
  return `/post/${postId}`;
}

/**
 * Resolve old slug from history, returns current slug if found.
 */
export async function resolvePostSlugRedirect(
  username: string,
  oldSlug: string
): Promise<{ postId: string; currentSlug: string } | null> {
  // Get user_id from username
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();

  if (!profile) return null;

  // Look up in slug history
  const { data: history } = await supabase
    .from("post_slug_history")
    .select("post_id")
    .eq("user_id", profile.id)
    .eq("old_slug", oldSlug)
    .maybeSingle();

  if (!history) return null;

  // Get current slug
  const { data: post } = await supabase
    .from("posts")
    .select("id, slug")
    .eq("id", history.post_id)
    .maybeSingle();

  if (!post?.slug) return null;

  return { postId: post.id, currentSlug: post.slug };
}

/**
 * Hook for navigating to post pages.
 */
export function usePostNavigation() {
  const navigate = useNavigate();

  const goToPost = useCallback(async (postId: string) => {
    const path = await getPostPath(postId);
    navigate(path);
  }, [navigate]);

  const goToPostSync = useCallback((username: string, slug: string) => {
    navigate(buildPostPath(username, slug));
  }, [navigate]);

  return { goToPost, goToPostSync, buildPostPath };
}

export function clearPostPathCache() {
  postPathCache.clear();
}
