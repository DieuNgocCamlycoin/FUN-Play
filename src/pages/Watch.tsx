import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/Layout/Header";
import { Sidebar } from "@/components/Layout/Sidebar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ThumbsUp, ThumbsDown, Share2, MoreHorizontal } from "lucide-react";

interface Video {
  id: string;
  title: string;
  description: string;
  video_url: string;
  view_count: number;
  like_count: number;
  dislike_count: number;
  created_at: string;
  channels: {
    id: string;
    name: string;
    subscriber_count: number;
  };
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  like_count: number;
  profiles: {
    display_name: string;
    avatar_url: string;
  };
}

export default function Watch() {
  const { id } = useParams();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [video, setVideo] = useState<Video | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      fetchVideo();
      fetchComments();
    }
  }, [id]);

  const fetchVideo = async () => {
    try {
      const { data, error } = await supabase
        .from("videos")
        .select(`
          *,
          channels (
            id,
            name,
            subscriber_count
          )
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      setVideo(data);

      // Increment view count
      await supabase
        .from("videos")
        .update({ view_count: (data.view_count || 0) + 1 })
        .eq("id", id);
    } catch (error: any) {
      toast({
        title: "Error loading video",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from("comments")
        .select("*")
        .eq("video_id", id)
        .is("parent_comment_id", null)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch profiles separately
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map(c => c.user_id))];
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, display_name, avatar_url")
          .in("id", userIds);

        const profilesMap = new Map(
          profilesData?.map(p => [p.id, p]) || []
        );

        const commentsWithProfiles = data.map(comment => ({
          ...comment,
          profiles: profilesMap.get(comment.user_id) || {
            display_name: "User",
            avatar_url: null,
          },
        }));

        setComments(commentsWithProfiles as any);
      } else {
        setComments([]);
      }
    } catch (error: any) {
      console.error("Error loading comments:", error);
    }
  };

  const handleAddComment = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }

    if (!newComment.trim()) return;

    try {
      const { error } = await supabase.from("comments").insert({
        video_id: id,
        user_id: user.id,
        content: newComment,
      });

      if (error) throw error;

      setNewComment("");
      fetchComments();

      toast({
        title: "Comment posted",
        description: "Your comment has been added",
      });
    } catch (error: any) {
      toast({
        title: "Error posting comment",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleLike = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }

    try {
      const { error } = await supabase.from("likes").insert({
        video_id: id,
        user_id: user.id,
        is_dislike: false,
      });

      if (error) throw error;

      await supabase
        .from("videos")
        .update({ like_count: (video?.like_count || 0) + 1 })
        .eq("id", id);

      fetchVideo();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Loading...</div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Video not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <main className="pt-14 lg:pl-64">
        <div className="max-w-[1920px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6 p-6">
            {/* Main Content */}
            <div className="space-y-4">
              {/* Video Player */}
              <div className="aspect-video bg-black rounded-xl overflow-hidden">
                <video
                  src={video.video_url}
                  controls
                  className="w-full h-full"
                  autoPlay
                />
              </div>

              {/* Video Title */}
              <h1 className="text-xl font-bold text-foreground">
                {video.title}
              </h1>

              {/* Channel Info & Actions */}
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold">
                    {video.channels.name[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">
                      {video.channels.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {video.channels.subscriber_count || 0} người đăng ký
                    </p>
                  </div>
                  <Button className="rounded-full ml-2">
                    Đăng ký
                  </Button>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center bg-muted rounded-full overflow-hidden">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-full rounded-r-none gap-2 hover:bg-muted-foreground/10"
                      onClick={handleLike}
                    >
                      <ThumbsUp className="h-4 w-4" />
                      <span>{video.like_count || 0}</span>
                    </Button>
                    <div className="w-px h-6 bg-border"></div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-full rounded-l-none hover:bg-muted-foreground/10"
                    >
                      <ThumbsDown className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="rounded-full gap-2"
                  >
                    <Share2 className="h-4 w-4" />
                    Chia sẻ
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="rounded-full"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Description */}
              <div className="bg-muted rounded-xl p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2">
                  <span>{video.view_count || 0} lượt xem</span>
                  <span>•</span>
                  <span>{new Date(video.created_at).toLocaleDateString("vi-VN")}</span>
                </div>
                <p className="text-sm text-foreground whitespace-pre-wrap">
                  {video.description}
                </p>
              </div>

              {/* Comments Section */}
              <div className="mt-6">
                <h2 className="text-xl font-semibold mb-6 text-foreground">
                  {comments.length} bình luận
                </h2>

                {/* Add Comment */}
                {user ? (
                  <div className="flex gap-3 mb-8">
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold flex-shrink-0">
                      {user.email?.[0].toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <Textarea
                        placeholder="Viết bình luận..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="border-0 border-b border-border rounded-none px-0 focus-visible:ring-0 focus-visible:border-foreground resize-none"
                      />
                      <div className="flex gap-2 mt-2 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setNewComment("")}
                        >
                          Hủy
                        </Button>
                        <Button 
                          size="sm" 
                          onClick={handleAddComment}
                          disabled={!newComment.trim()}
                        >
                          Bình luận
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    <Button onClick={() => navigate("/auth")}>Đăng nhập để bình luận</Button>
                  </div>
                )}

                {/* Comments List */}
                <div className="space-y-6">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold flex-shrink-0">
                        {comment.profiles.display_name?.[0] || "U"}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm text-foreground">
                            {comment.profiles.display_name || "User"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(comment.created_at).toLocaleDateString("vi-VN")}
                          </span>
                        </div>
                        <p className="text-sm text-foreground mb-2">
                          {comment.content}
                        </p>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" className="h-8 px-2 rounded-full">
                            <ThumbsUp className="h-3 w-3 mr-1" />
                            {comment.like_count || 0}
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 px-2 rounded-full">
                            <ThumbsDown className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recommended Videos Sidebar */}
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground px-2">
                Recommended
              </h2>
              {/* Recommended videos will be added here */}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
