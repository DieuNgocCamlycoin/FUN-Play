import { useState, useEffect } from "react";
import { X, ThumbsUp, ThumbsDown, Send, CornerDownRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useAutoReward } from "@/hooks/useAutoReward";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  like_count: number;
  user_id: string;
  parent_comment_id: string | null;
  profiles: {
    display_name: string;
    avatar_url: string | null;
  };
  replies?: Comment[];
}

interface CommentsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  videoId: string;
  commentCount: number;
}

export function CommentsDrawer({
  isOpen,
  onClose,
  videoId,
  commentCount,
}: CommentsDrawerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { awardCommentReward } = useAutoReward();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchComments();
    }
  }, [isOpen, videoId]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      // Fetch parent comments
      const { data: parentComments, error } = await supabase
        .from("comments")
        .select("*")
        .eq("video_id", videoId)
        .is("parent_comment_id", null)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch profiles
      if (parentComments && parentComments.length > 0) {
        const userIds = [...new Set(parentComments.map(c => c.user_id))];
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, display_name, avatar_url")
          .in("id", userIds);

        const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);

        // Fetch replies for each parent comment
        const { data: allReplies } = await supabase
          .from("comments")
          .select("*")
          .eq("video_id", videoId)
          .not("parent_comment_id", "is", null)
          .order("created_at", { ascending: true });

        // Get reply profiles
        const replyUserIds = [...new Set(allReplies?.map(r => r.user_id) || [])];
        const { data: replyProfilesData } = await supabase
          .from("profiles")
          .select("id, display_name, avatar_url")
          .in("id", replyUserIds);

        const replyProfilesMap = new Map(replyProfilesData?.map(p => [p.id, p]) || []);

        const commentsWithReplies = parentComments.map(comment => ({
          ...comment,
          profiles: profilesMap.get(comment.user_id) || { display_name: "User", avatar_url: null },
          replies: (allReplies || [])
            .filter(r => r.parent_comment_id === comment.id)
            .map(reply => ({
              ...reply,
              profiles: replyProfilesMap.get(reply.user_id) || { display_name: "User", avatar_url: null },
            })),
        }));

        setComments(commentsWithReplies as Comment[]);
      } else {
        setComments([]);
      }
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
        description: "Bình luận phải có ít nhất 5 từ để nhận thưởng CAMLY",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.from("comments").insert({
        video_id: videoId,
        user_id: user.id,
        content: newComment,
      });

      if (error) throw error;

      const commentContent = newComment;
      setNewComment("");
      fetchComments();

      await awardCommentReward(videoId, commentContent);
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSubmitReply = async (parentId: string) => {
    if (!user) {
      navigate("/auth");
      return;
    }

    if (!replyContent.trim()) return;

    try {
      const { error } = await supabase.from("comments").insert({
        video_id: videoId,
        user_id: user.id,
        content: replyContent,
        parent_comment_id: parentId,
      });

      if (error) throw error;

      setReplyContent("");
      setReplyingTo(null);
      fetchComments();
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const formatTimestamp = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return "Vừa xong";
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return date.toLocaleDateString("vi-VN");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-2xl h-[80vh] flex flex-col"
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 pb-3 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">
                Bình luận <span className="text-muted-foreground font-normal">{commentCount}</span>
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-10 w-10 rounded-full"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Comments List */}
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-4">
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Đang tải bình luận...
                  </div>
                ) : comments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Chưa có bình luận nào. Hãy là người đầu tiên!
                  </div>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="space-y-3">
                      {/* Parent comment */}
                      <div className="flex gap-3">
                        <Avatar className="h-8 w-8 flex-shrink-0">
                          <AvatarImage src={comment.profiles.avatar_url || undefined} />
                          <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                            {comment.profiles.display_name?.[0] || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-foreground">
                              {comment.profiles.display_name || "User"}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatTimestamp(comment.created_at)}
                            </span>
                          </div>
                          <p className="text-sm text-foreground mt-1">{comment.content}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <Button variant="ghost" size="sm" className="h-7 px-2 gap-1">
                              <ThumbsUp className="h-3.5 w-3.5" />
                              <span className="text-xs">{comment.like_count || 0}</span>
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 px-2">
                              <ThumbsDown className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs"
                              onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                            >
                              Phản hồi
                            </Button>
                          </div>

                          {/* Reply input */}
                          {replyingTo === comment.id && (
                            <div className="flex gap-2 mt-2">
                              <Textarea
                                placeholder="Viết phản hồi..."
                                value={replyContent}
                                onChange={(e) => setReplyContent(e.target.value)}
                                className="min-h-[60px] text-sm resize-none"
                              />
                              <Button
                                size="icon"
                                onClick={() => handleSubmitReply(comment.id)}
                                disabled={!replyContent.trim()}
                                className="h-10 w-10 shrink-0"
                              >
                                <Send className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Replies */}
                      {comment.replies && comment.replies.length > 0 && (
                        <div className="ml-10 space-y-3 border-l-2 border-muted pl-3">
                          {comment.replies.map((reply) => (
                            <div key={reply.id} className="flex gap-2">
                              <Avatar className="h-6 w-6 flex-shrink-0">
                                <AvatarImage src={reply.profiles.avatar_url || undefined} />
                                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                                  {reply.profiles.display_name?.[0] || "U"}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-semibold text-foreground">
                                    {reply.profiles.display_name || "User"}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {formatTimestamp(reply.created_at)}
                                  </span>
                                </div>
                                <p className="text-sm text-foreground mt-0.5">{reply.content}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>

            {/* Comment Input - Fixed at bottom */}
            <div className="border-t border-border p-3 bg-card">
              {user ? (
                <div className="flex gap-2">
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                      {user.email?.[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <Textarea
                    placeholder="Viết bình luận..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="min-h-[40px] max-h-[100px] text-sm resize-none flex-1"
                  />
                  <Button
                    size="icon"
                    onClick={handleSubmitComment}
                    disabled={!newComment.trim()}
                    className="h-10 w-10 shrink-0"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  className="w-full"
                  onClick={() => navigate("/auth")}
                >
                  Đăng nhập để bình luận
                </Button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
