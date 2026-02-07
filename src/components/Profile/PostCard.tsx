import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EnhancedDonateModal } from "@/components/Donate/EnhancedDonateModal";
import { Heart, MessageSquare, Share2, Gift, MoreHorizontal } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PostCardProps {
  post: {
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
  };
  onUpdate?: () => void;
}

export const PostCard = ({ post, onUpdate }: PostCardProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.like_count || 0);
  const [donateModalOpen, setDonateModalOpen] = useState(false);

  const displayName = post.profiles?.display_name || post.profiles?.username || "User";
  const avatarUrl = post.profiles?.avatar_url;
  const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: vi });

  const handleLike = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }

    // Optimistic update
    setIsLiked(!isLiked);
    setLikeCount((prev) => (isLiked ? prev - 1 : prev + 1));

    // TODO: Implement actual like functionality when post_likes table exists
  };

  const handleShare = () => {
    const postUrl = `${window.location.origin}/post/${post.id}`;
    navigator.clipboard.writeText(postUrl);
    toast({
      title: "Đã copy link! ✨",
      description: "Link bài viết đã được sao chép",
    });
  };

  return (
    <Card className="p-4 border border-border hover:border-[hsl(var(--cosmic-cyan))]/30 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <Avatar
            className="w-10 h-10 cursor-pointer hover:ring-2 hover:ring-[hsl(var(--cosmic-cyan))]/50 transition-all"
            onClick={() => navigate(`/u/${post.profiles?.username}`)}
          >
            <AvatarImage src={avatarUrl || undefined} />
            <AvatarFallback className="bg-gradient-to-br from-[hsl(var(--cosmic-cyan))] to-[hsl(var(--cosmic-magenta))] text-white">
              {displayName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p
              className="font-semibold text-foreground hover:text-[hsl(var(--cosmic-cyan))] cursor-pointer transition-colors"
              onClick={() => navigate(`/u/${post.profiles?.username}`)}
            >
              {displayName}
            </p>
            <p className="text-xs text-muted-foreground">{timeAgo}</p>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleShare}>
              <Share2 className="w-4 h-4 mr-2" />
              Chia sẻ
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Content */}
      <div className="mb-4">
        <p className="text-foreground whitespace-pre-wrap">{post.content}</p>
        {post.image_url && (
          <div className="mt-3 rounded-xl overflow-hidden">
            <img
              src={post.image_url}
              alt="Post image"
              className="w-full max-h-[500px] object-cover"
            />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4 pt-3 border-t border-border">
        {/* Like */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLike}
          className={`gap-2 ${isLiked ? "text-red-500" : "text-muted-foreground"}`}
        >
          <Heart className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`} />
          <span>{likeCount}</span>
        </Button>

        {/* Comment */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/post/${post.id}`)}
          className="gap-2 text-muted-foreground"
        >
          <MessageSquare className="w-4 h-4" />
          <span>{post.comment_count || 0}</span>
        </Button>

        {/* Share */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleShare}
          className="gap-2 text-muted-foreground"
        >
          <Share2 className="w-4 h-4" />
        </Button>

        {/* Donate (only for other users' posts) */}
        {user && user.id !== post.user_id && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDonateModalOpen(true)}
            className="gap-2 text-[hsl(var(--cosmic-gold))] hover:text-[hsl(var(--cosmic-gold))] hover:bg-[hsl(var(--cosmic-gold))]/10 ml-auto"
          >
            <Gift className="w-4 h-4" />
            <span className="hidden sm:inline">Tặng</span>
          </Button>
        )}
      </div>

      {/* Donate Modal */}
      <EnhancedDonateModal
        open={donateModalOpen}
        onOpenChange={setDonateModalOpen}
        defaultReceiverId={post.user_id}
        defaultReceiverName={displayName}
        defaultReceiverAvatar={avatarUrl || undefined}
        defaultReceiverWallet={undefined}
      />
    </Card>
  );
};
