import { useParams, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import NotFound from "./NotFound";

const VideoBySlug = () => {
  const { username, slug } = useParams<{ username: string; slug: string }>();
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
        setNotFound(true);
        setLoading(false);
        return;
      }

      setVideoId(video.id);
      setLoading(false);
    };

    resolve();
  }, [username, slug]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (notFound) return <NotFound />;
  if (videoId) return <Navigate to={`/watch/${videoId}`} replace />;

  return null;
};

export default VideoBySlug;
