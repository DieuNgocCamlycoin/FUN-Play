import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PostCard } from "./PostCard";
import { Image, Smile, Send, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ProfilePostsTabProps {
  userId: string;
  isOwnProfile: boolean;
}

interface Post {
  id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  like_count: number;
  comment_count: number;
  user_id: string;
  profiles?: {
    display_name: string | null;
    username: string;
    avatar_url: string | null;
  };
}

export const ProfilePostsTab = ({ userId, isOwnProfile }: ProfilePostsTabProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPostContent, setNewPostContent] = useState("");
  const [posting, setPosting] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    fetchPosts();
    if (user) {
      fetchUserProfile();
    }
  }, [userId, user]);

  const fetchUserProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("display_name, username, avatar_url")
      .eq("id", user.id)
      .single();
    setUserProfile(data);
  };

  const fetchPosts = async () => {
    try {
      // Fetch posts
      const { data: postsData, error: postsError } = await supabase
        .from("posts")
        .select("*")
        .eq("user_id", userId)
        .eq("is_public", true)
        .order("created_at", { ascending: false });

      if (postsError) throw postsError;
      
      // Fetch user profile separately
      const { data: profileData } = await supabase
        .from("profiles")
        .select("display_name, username, avatar_url")
        .eq("id", userId)
        .single();

      // Combine posts with profile info
      const postsWithProfiles = (postsData || []).map((post) => ({
        ...post,
        profiles: profileData || { display_name: null, username: "user", avatar_url: null },
      }));

      setPosts(postsWithProfiles as Post[]);
    } catch (error: any) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async () => {
    if (!user || !newPostContent.trim()) return;

    setPosting(true);
    try {
      // Get user's channel
      const { data: channel } = await supabase
        .from("channels")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!channel) throw new Error("Channel not found");

      const { error } = await supabase.from("posts").insert({
        user_id: user.id,
        channel_id: channel.id,
        content: newPostContent.trim(),
        is_public: true,
      });

      if (error) throw error;

      toast({
        title: "Đã đăng bài! ✨",
        description: "Lan tỏa ánh sáng yêu thương...",
      });

      setNewPostContent("");
      fetchPosts();
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setPosting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-4 animate-pulse">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-1/4" />
                <div className="h-16 bg-muted rounded" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Create Post Box - Only show on own profile */}
      {isOwnProfile && user && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="p-4 border-2 border-[hsl(var(--cosmic-cyan))]/20 bg-gradient-to-br from-white to-[hsl(var(--cosmic-cyan))]/5">
            <div className="flex gap-3">
              <Avatar className="w-10 h-10">
                <AvatarImage src={userProfile?.avatar_url} />
                <AvatarFallback className="bg-gradient-to-br from-[hsl(var(--cosmic-cyan))] to-[hsl(var(--cosmic-magenta))] text-white">
                  {userProfile?.display_name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-3">
                <Textarea
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder="Bạn đang nghĩ gì? Chia sẻ ánh sáng... ✨"
                  className="min-h-[80px] resize-none border-[hsl(var(--cosmic-cyan))]/30 focus:border-[hsl(var(--cosmic-cyan))] bg-white/50"
                />
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" className="text-muted-foreground">
                      <Image className="w-4 h-4 mr-1" />
                      Ảnh/GIF
                    </Button>
                    <Button variant="ghost" size="sm" className="text-muted-foreground">
                      <Smile className="w-4 h-4 mr-1" />
                      Emoji
                    </Button>
                  </div>
                  <Button
                    onClick={handleCreatePost}
                    disabled={!newPostContent.trim() || posting}
                    className="bg-gradient-to-r from-[hsl(var(--cosmic-cyan))] to-[hsl(var(--cosmic-magenta))] text-white rounded-full px-6"
                  >
                    {posting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Đăng
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Posts List */}
      <AnimatePresence>
        {posts.length > 0 ? (
          <div className="space-y-4">
            {posts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <PostCard post={post} onUpdate={fetchPosts} />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-[hsl(var(--cosmic-cyan))]/20 to-[hsl(var(--cosmic-magenta))]/20 flex items-center justify-center">
              <Send className="w-8 h-8 text-muted-foreground/50" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Chưa có bài viết</h3>
            <p className="text-muted-foreground text-sm">
              {isOwnProfile
                ? "Hãy chia sẻ suy nghĩ đầu tiên của bạn!"
                : "Người dùng này chưa đăng bài viết nào."}
            </p>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
