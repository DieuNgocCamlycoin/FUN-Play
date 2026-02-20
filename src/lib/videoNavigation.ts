import { supabase } from "@/integrations/supabase/client";
import { slugify } from "./slugify";
import { useNavigate } from "react-router-dom";
import { useCallback } from "react";

// Cache to avoid repeated DB lookups
const videoPathCache = new Map<string, string>();

/**
 * Synchronous version - use when username + slug are already available from props/data
 */
export function buildVideoPath(username: string, slug: string, queryParams?: string): string {
  return `/${username}/video/${slug}${queryParams || ''}`;
}

/**
 * Check if a pathname is a video watch page (new or legacy format)
 */
export function isVideoWatchPage(pathname: string): boolean {
  // Legacy: /watch/uuid
  if (pathname.startsWith('/watch/')) return true;
  // New: /:username/video/:slug (path has form /xxx/video/yyy)
  const parts = pathname.split('/').filter(Boolean);
  return parts.length === 3 && parts[1] === 'video';
}

/**
 * Extract videoId from watch page URL (legacy format only)
 */
export function extractVideoIdFromPath(pathname: string): string | null {
  if (pathname.startsWith('/watch/')) {
    return pathname.split('/watch/')[1]?.split('?')[0] || null;
  }
  return null;
}

/**
 * Async version - fetches username + slug from DB when only videoId is available.
 * Auto-generates and persists slug if missing.
 */
export async function getVideoPath(videoId: string, queryParams?: string): Promise<string> {
  const cacheKey = videoId;
  if (videoPathCache.has(cacheKey)) {
    return videoPathCache.get(cacheKey)! + (queryParams || '');
  }

  try {
    // Fetch video + owner username
    const { data } = await supabase
      .from("videos")
      .select("slug, title, user_id")
      .eq("id", videoId)
      .maybeSingle();

    if (!data) throw new Error("Video not found");

    // Fetch username separately
    const { data: profile } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", data.user_id)
      .maybeSingle();

    if (profile?.username) {
      let slug = data.slug;
      
      // Auto-generate slug if missing
      if (!slug && data.title) {
        slug = slugify(data.title);
        // Persist slug to DB (fire and forget)
        supabase
          .from("videos")
          .update({ slug })
          .eq("id", videoId)
          .then(() => console.log(`[Slug] Auto-generated for video ${videoId}: ${slug}`));
      }

      if (slug) {
        const path = `/${profile.username}/video/${slug}`;
        videoPathCache.set(cacheKey, path);
        return path + (queryParams || '');
      }
    }
  } catch (error) {
    console.error('[videoNavigation] Error resolving path:', error);
  }

  // Fallback: legacy URL (WatchLegacyRedirect will handle)
  return `/watch/${videoId}${queryParams || ''}`;
}

/**
 * Hook for navigating to video pages.
 * Provides both sync (when data available) and async (when only videoId) methods.
 */
export function useVideoNavigation() {
  const navigate = useNavigate();

  /** Navigate using videoId (async - queries DB) */
  const goToVideo = useCallback(async (videoId: string, queryParams?: string) => {
    const path = await getVideoPath(videoId, queryParams);
    navigate(path);
  }, [navigate]);

  /** Navigate using known username + slug (sync - no DB query) */
  const goToVideoSync = useCallback((username: string, slug: string, queryParams?: string) => {
    navigate(buildVideoPath(username, slug, queryParams));
  }, [navigate]);

  return { goToVideo, goToVideoSync, buildVideoPath };
}

/**
 * Clear the video path cache (useful after username changes)
 */
export function clearVideoPathCache() {
  videoPathCache.clear();
}
