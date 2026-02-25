import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import NotFound from "./NotFound";

const PostLegacyRedirect = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const resolve = async () => {
      if (!id) {
        setNotFound(true);
        return;
      }

      // Fetch post slug + user_id
      const { data: post } = await supabase
        .from("posts")
        .select("slug, user_id")
        .eq("id", id)
        .maybeSingle();

      if (!post?.slug) {
        setNotFound(true);
        return;
      }

      // Fetch username
      const { data: profile } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", post.user_id)
        .maybeSingle();

      if (!profile?.username) {
        setNotFound(true);
        return;
      }

      navigate(`/${profile.username}/post/${post.slug}`, { replace: true });
    };

    resolve();
  }, [id, navigate]);

  if (notFound) return <NotFound />;

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );
};

export default PostLegacyRedirect;
