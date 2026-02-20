import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAutoReward } from "@/hooks/useAutoReward";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { MessageCircle, Heart, MoreVertical, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  like_count: number | null;
  profiles: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

interface MusicCommentsProps {
  musicId: string;
  onCommentCountChange?: (count: number) => void;
}

export function MusicComments({ musicId, onCommentCountChange }: MusicCommentsProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { awardCommentReward } = useAutoReward();

  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [userProfile, setUserProfile] = useState<{ avatar_url: string | null; display_name: string | null } | null>(null);

  useEffect(() => {
    fetchComments();
  }, [musicId]);

  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from("profiles")
      .select("avatar_url, display_name")
      .eq("id", user.id)
      .maybeSingle();
    
    setUserProfile(data);
  };

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from("comments")
        .select("*")
        .eq("video_id", musicId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch profiles for each comment
      const commentsWithProfiles = await Promise.all(
        (data || []).map(async (comment) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("id, username, display_name, avatar_url")
            .eq("id", comment.user_id)
            .maybeSingle();
          
          return {
            ...comment,
            profiles: profile || null,
          };
        })
      );

      setComments(commentsWithProfiles as Comment[]);
      onCommentCountChange?.(commentsWithProfiles.length);
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }

    const wordCount = newComment.trim().split(/\s+/).filter(w => w.length > 0).length;
    if (wordCount < 5) {
      toast({
        title: "Bình luận quá ngắn",
        description: "Bình luận cần ít nhất 5 từ để chia sẻ ý nghĩa hơn",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const { data: commentData, error } = await supabase
        .from("comments")
        .insert({
          video_id: musicId,
          user_id: user.id,
          content: newComment.trim(),
        })
        .select()
        .single();

      if (error) throw error;

      const commentContent = newComment;
      setNewComment("");
      fetchComments();

      // Award CAMLY for commenting using useAutoReward
      const rewarded = await awardCommentReward(musicId, commentContent);
      if (!rewarded) {
        toast({
          title: "Đã đăng bình luận!",
          description: "Cảm ơn bạn đã chia sẻ ý kiến",
        });
      }
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from("comments")
        .delete()
        .eq("id", commentId)
        .eq("user_id", user?.id);

      if (error) throw error;

      toast({ title: "Đã xóa bình luận" });
      fetchComments();
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const navigateToChannel = (userId: string) => {
    navigate(`/${userId}`);
  };

  const formatTime = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), {
      addSuffix: true,
      locale: vi,
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3 animate-pulse">
            <div className="w-10 h-10 rounded-full bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded w-1/4" />
              <div className="h-3 bg-muted rounded w-3/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Comment Count */}
      <div className="flex items-center gap-2">
        <MessageCircle className="w-5 h-5" />
        <h3 className="text-lg font-semibold">{comments.length} bình luận</h3>
      </div>

      {/* Comment Input */}
      {user ? (
        <div className="flex gap-3">
          <Avatar className="w-10 h-10 flex-shrink-0">
            <AvatarImage src={userProfile?.avatar_url || undefined} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {userProfile?.display_name?.[0] || user.email?.[0]?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2">
            <Textarea
              placeholder="Chia sẻ cảm nhận của bạn về bài hát này..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-[80px] resize-none"
              maxLength={500}
            />
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">
                {newComment.length}/500 ký tự (tối thiểu 5)
              </span>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setNewComment("")}
                  disabled={!newComment}
                >
                  Hủy
                </Button>
                <Button
                  size="sm"
                  onClick={handleSubmitComment}
                  disabled={submitting || newComment.trim().length < 5}
                >
                  {submitting ? "Đang đăng..." : "Bình luận"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-6 bg-muted/30 rounded-lg">
          <p className="text-muted-foreground mb-3">Đăng nhập để bình luận</p>
          <Button onClick={() => navigate("/auth")}>Đăng nhập</Button>
        </div>
      )}

      {/* Comments List */}
      <AnimatePresence>
        <div className="space-y-4">
          {comments.length > 0 ? (
            comments.map((comment, index) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: index * 0.05 }}
                className="flex gap-3 group"
              >
                <Avatar
                  className="w-10 h-10 flex-shrink-0 cursor-pointer"
                  onClick={() => navigateToChannel(comment.user_id)}
                >
                  <AvatarImage src={comment.profiles?.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {comment.profiles?.display_name?.[0] || comment.profiles?.username?.[0] || "U"}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="font-semibold text-sm cursor-pointer hover:text-primary transition-colors"
                      onClick={() => navigateToChannel(comment.user_id)}
                    >
                      {comment.profiles?.display_name || comment.profiles?.username || "Người dùng"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatTime(comment.created_at)}
                    </span>
                  </div>

                  <p className="text-sm mt-1 whitespace-pre-wrap break-words">
                    {comment.content}
                  </p>

                  <div className="flex items-center gap-3 mt-2">
                    <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                      <Heart className="w-3.5 h-3.5" />
                      {comment.like_count || 0}
                    </button>
                  </div>
                </div>

                {/* Delete Menu - only for comment owner */}
                {user?.id === comment.user_id && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => handleDeleteComment(comment.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Xóa bình luận
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </motion.div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Chưa có bình luận nào</p>
              <p className="text-sm">Hãy là người đầu tiên chia sẻ cảm nhận!</p>
            </div>
          )}
        </div>
      </AnimatePresence>
    </div>
  );
}
