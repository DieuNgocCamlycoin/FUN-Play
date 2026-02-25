import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, lazy, Suspense } from "react";
import { supabase } from "@/integrations/supabase/client";
import { resolveSlugRedirect } from "@/lib/videoNavigation";
import NotFound from "./NotFound";

const Watch = lazy(() => import("./Watch"));

const VideoBySlug = () => {
  const { username, slug } = useParams<{ username: string; slug: string }>();
  const navigate = useNavigate();
  const [videoId, setVideoId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const resolve = async () => {
      if (!username || !slug) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      // Find user by username
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", username)
        .maybeSingle();

      if (!profile) {
        // Tra cứu previous_username để chuyển hướng (người dùng đã đổi tên)
        const { data: oldProfile } = await supabase
          .from("profiles")
          .select("username")
          .eq("previous_username", username)
          .maybeSingle();

        if (oldProfile?.username) {
          navigate(`/${oldProfile.username}/video/${slug}`, { replace: true });
          return;
        }

        setNotFound(true);
        setLoading(false);
        return;
      }

      // Find video by user_id + slug
      const { data: video } = await supabase
        .from("videos")
        .select("id")
        .eq("user_id", profile.id)
        .eq("slug", slug)
        .maybeSingle();

      if (!video) {
        // Slug cũ — tra cứu lịch sử và chuyển hướng 301
        const redirect = await resolveSlugRedirect(username, slug);
        if (redirect) {
          navigate(`/${username}/video/${redirect.currentSlug}`, { replace: true });
          return;
        }
        setNotFound(true);
        setLoading(false);
        return;
      }

      setVideoId(video.id);
      setLoading(false);
    };

    resolve();
  }, [username, slug, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (notFound) return <NotFound />;
  
  // Render Watch inline to keep clean URL in address bar
  if (videoId) {
    return (
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen bg-background">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      }>
        <Watch videoIdProp={videoId} />
      </Suspense>
    );
  }

  return null;
};

export default VideoBySlug;
