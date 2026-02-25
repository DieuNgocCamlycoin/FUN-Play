import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, lazy, Suspense } from "react";
import { supabase } from "@/integrations/supabase/client";
import { resolvePostSlugRedirect } from "@/lib/postNavigation";
import NotFound from "./NotFound";

const PostDetail = lazy(() => import("./PostDetail"));

const PostBySlug = () => {
  const { username, slug } = useParams<{ username: string; slug: string }>();
  const navigate = useNavigate();
  const [postId, setPostId] = useState<string | null>(null);
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
          navigate(`/${oldProfile.username}/post/${slug}`, { replace: true });
          return;
        }

        setNotFound(true);
        setLoading(false);
        return;
      }

      // Find post by user_id + slug
      const { data: post } = await supabase
        .from("posts")
        .select("id")
        .eq("user_id", profile.id)
        .eq("slug", slug)
        .maybeSingle();

      if (!post) {
        // Check slug history for redirect
        const redirect = await resolvePostSlugRedirect(username, slug);
        if (redirect) {
          navigate(`/${username}/post/${redirect.currentSlug}`, { replace: true });
          return;
        }
        setNotFound(true);
        setLoading(false);
        return;
      }

      setPostId(post.id);
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

  if (postId) {
    return (
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen bg-background">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      }>
        <PostDetail postIdProp={postId} />
      </Suspense>
    );
  }

  return null;
};

export default PostBySlug;
