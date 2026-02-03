import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, User, Loader2, MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAutoReward } from '@/hooks/useAutoReward';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profile?: {
    avatar_url: string | null;
    username: string;
    display_name: string | null;
  };
}

interface ShortsCommentSheetProps {
  videoId: string;
  isOpen: boolean;
  onClose: () => void;
  commentCount: number;
}

export function ShortsCommentSheet({ videoId, isOpen, onClose, commentCount }: ShortsCommentSheetProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const { awardCommentReward } = useAutoReward();

  useEffect(() => {
    if (isOpen && videoId) {
      fetchComments();
    }
  }, [isOpen, videoId]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('id, content, created_at, user_id')
        .eq('video_id', videoId)
        .is('parent_comment_id', null)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Fetch profiles
      const userIds = [...new Set(data?.map(c => c.user_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, avatar_url, username, display_name')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]));

      setComments(
        (data || []).map(comment => ({
          ...comment,
          profile: profileMap.get(comment.user_id)
        }))
      );
    } catch (err) {
      console.error('Error fetching comments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error('Vui lòng đăng nhập để bình luận');
      return;
    }

    const trimmedComment = newComment.trim();
    if (!trimmedComment) {
      toast.error('Vui lòng nhập nội dung bình luận');
      return;
    }

    // Validate min 5 words
    const wordCount = trimmedComment.split(/\s+/).filter(w => w.length > 0).length;
    if (wordCount < 5) {
      toast.warning('Bình luận cần ít nhất 5 từ để chia sẻ ý nghĩa hơn');
    }

    setSubmitting(true);
    try {
      // Insert comment
      const { data: insertedComment, error } = await supabase
        .from('comments')
        .insert({
          video_id: videoId,
          user_id: user.id,
          content: trimmedComment,
        })
        .select('id, content, created_at, user_id')
        .single();

      if (error) throw error;

      // Get user profile for the new comment
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, avatar_url, username, display_name')
        .eq('id', user.id)
        .single();

      // Add to comments list
      setComments(prev => [{
        ...insertedComment,
        profile
      }, ...prev]);

      // Award CAMLY if comment is valid (5+ words)
      if (wordCount >= 5) {
        await awardCommentReward(videoId, trimmedComment);
      }

      setNewComment('');
      toast.success('Đã gửi bình luận!');
    } catch (err) {
      console.error('Error submitting comment:', err);
      toast.error('Không thể gửi bình luận. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: vi });
    } catch {
      return '';
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent 
        side="bottom" 
        className="h-[70vh] bg-black/95 border-t border-white/10 rounded-t-3xl"
      >
        <SheetHeader className="pb-4 border-b border-white/10">
          <SheetTitle className="text-white flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Bình luận ({commentCount})
          </SheetTitle>
        </SheetHeader>

        {/* Comments list */}
        <ScrollArea className="flex-1 h-[calc(70vh-140px)] py-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-white/50" />
            </div>
          ) : comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-white/50">
              <MessageCircle className="w-12 h-12 mb-3 opacity-50" />
              <p>Chưa có bình luận nào</p>
              <p className="text-sm mt-1">Hãy là người đầu tiên bình luận!</p>
            </div>
          ) : (
            <div className="space-y-4 pr-4">
              {comments.map(comment => (
                <div key={comment.id} className="flex gap-3">
                  <Avatar className="w-9 h-9 flex-shrink-0">
                    <AvatarImage src={comment.profile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-white/10 text-white">
                      <User className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-white/80 font-medium truncate">
                        {comment.profile?.display_name || comment.profile?.username || 'User'}
                      </span>
                      <span className="text-xs text-white/40">
                        {formatTime(comment.created_at)}
                      </span>
                    </div>
                    <p className="text-sm text-white mt-0.5 break-words">{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Comment input */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-black/95 border-t border-white/10">
          <div className="flex gap-2 items-center">
            <Avatar className="w-8 h-8 flex-shrink-0">
              <AvatarFallback className="bg-white/10 text-white">
                <User className="w-4 h-4" />
              </AvatarFallback>
            </Avatar>
            <Input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder="Chia sẻ cảm nhận của bạn..."
              className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/40"
              disabled={submitting || !user}
            />
            <Button 
              onClick={handleSubmit} 
              size="icon"
              disabled={submitting || !newComment.trim() || !user}
              className="bg-primary hover:bg-primary/90"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
          {!user && (
            <p className="text-xs text-white/40 mt-2 text-center">
              Đăng nhập để bình luận
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
