import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { usePostLike } from "@/hooks/usePostLike";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EnhancedDonateModal } from "@/components/Donate/EnhancedDonateModal";
import { DonationCelebrationCard } from "@/components/Profile/DonationCelebrationCard";
import { Heart, MessageSquare, Share2, Gift, MoreHorizontal, Sparkles, Star } from "lucide-react";
import { PPLPRatingModal } from "@/components/PPLP/PPLPRatingModal";
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
    images?: string[] | null;
    gif_url?: string | null;
    post_type?: string | null;
    donation_transaction_id?: string | null;
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
  const { isLiked, likeCount, toggleLike, loading: likeLoading } = usePostLike(post.id, post.like_count);
  const [donateModalOpen, setDonateModalOpen] = useState(false);
  const [ratingModalOpen, setRatingModalOpen] = useState(false);

  const displayName = post.profiles?.display_name || post.profiles?.username || "User";
  const avatarUrl = post.profiles?.avatar_url;
  const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: vi });
  
  // Check if this is a donation post
  const isDonationPost = post.post_type === "donation";
  
  // Get images - prefer new images array, fallback to single image_url
  const images = post.images?.length ? post.images : (post.image_url ? [post.image_url] : []);

  const handleLike = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    await toggleLike();
  };

  const handleShare = () => {
    const username = post.profiles?.username;
    const postUrl = username && (post as any).slug
      ? `https://play.fun.rich/${username}/post/${(post as any).slug}`
      : `${window.location.origin}/post/${post.id}`;
    navigator.clipboard.writeText(postUrl);
    toast({
      title: "Đã copy link! ✨",
      description: "Link bài viết đã được sao chép",
    });
  };

  // Calculate grid layout for images
  const getImageGridClass = (count: number) => {
    if (count === 1) return "grid-cols-1";
    if (count === 2) return "grid-cols-2";
    if (count <= 4) return "grid-cols-2";
    return "grid-cols-3";
  };

  const getImageAspect = (count: number, index: number) => {
    if (count === 1) return "aspect-video";
    if (count === 2) return "aspect-square";
    if (count === 3 && index === 0) return "row-span-2 aspect-auto h-full";
    return "aspect-square";
  };

  return (
    <Card className={`p-4 border transition-colors ${
      isDonationPost 
        ? "border-[hsl(var(--cosmic-gold))]/30 bg-gradient-to-br from-[hsl(var(--cosmic-gold))]/5 to-transparent" 
        : "border-border hover:border-[hsl(var(--cosmic-cyan))]/30"
    }`}>
      {/* Donation Badge */}
      {isDonationPost && (
        <div className="flex items-center gap-2 mb-3 text-xs">
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-r from-[hsl(var(--cosmic-gold))]/20 to-[hsl(var(--cosmic-magenta))]/20 border border-[hsl(var(--cosmic-gold))]/30">
            <Sparkles className="w-3 h-3 text-[hsl(var(--cosmic-gold))]" />
            <span className="text-[hsl(var(--cosmic-gold))] font-medium">Lì xì</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <Avatar
            className="w-10 h-10 cursor-pointer hover:ring-2 hover:ring-[hsl(var(--cosmic-cyan))]/50 transition-all"
            onClick={() => navigate(`/${post.profiles?.username}`)}
          >
            <AvatarImage src={avatarUrl || undefined} />
            <AvatarFallback className="bg-gradient-to-br from-[hsl(var(--cosmic-cyan))] to-[hsl(var(--cosmic-magenta))] text-white">
              {displayName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p
              className="font-semibold text-foreground hover:text-[hsl(var(--cosmic-cyan))] cursor-pointer transition-colors"
              onClick={() => navigate(`/${post.profiles?.username}`)}
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
        
        {/* Images Grid */}
        {images.length > 0 && (
          <div className={`mt-3 grid ${getImageGridClass(images.length)} gap-1 rounded-xl overflow-hidden`}>
            {images.slice(0, 6).map((url, index) => (
              <div
                key={index}
                className={`relative ${getImageAspect(images.length, index)} overflow-hidden ${
                  images.length === 3 && index === 0 ? "" : ""
                }`}
              >
                <img
                  src={url}
                  alt={`Post image ${index + 1}`}
                  className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                  onClick={() => {
                    const username = post.profiles?.username;
                    const slug = (post as any).slug;
                    if (username && slug) {
                      navigate(`/${username}/post/${slug}`);
                    } else {
                      navigate(`/post/${post.id}`);
                    }
                  }}
                  loading="lazy"
                />
                {/* Show "+X" overlay for more images */}
                {index === 5 && images.length > 6 && (
                  <div 
                    className="absolute inset-0 bg-black/60 flex items-center justify-center cursor-pointer"
                    onClick={() => {
                      const username = post.profiles?.username;
                      const slug = (post as any).slug;
                      if (username && slug) {
                        navigate(`/${username}/post/${slug}`);
                      } else {
                        navigate(`/post/${post.id}`);
                      }
                    }}
                  >
                    <span className="text-white text-2xl font-bold">
                      +{images.length - 6}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Donation Celebration Card — for donation posts */}
        {isDonationPost && post.donation_transaction_id && (
          <DonationCelebrationCard donationTransactionId={post.donation_transaction_id} />
        )}

        {/* GIF Display — only for non-donation posts */}
        {!isDonationPost && post.gif_url && (
          <div className="mt-3 rounded-xl overflow-hidden">
            <img
              src={post.gif_url}
              alt="GIF"
              className="w-full max-h-[300px] object-contain bg-muted/30"
              loading="lazy"
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
          onClick={() => {
            const username = post.profiles?.username;
            const slug = (post as any).slug;
            if (username && slug) {
              navigate(`/${username}/post/${slug}`);
            } else {
              navigate(`/post/${post.id}`);
            }
          }}
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
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setRatingModalOpen(true)}
              className="gap-2 text-[hsl(var(--cosmic-cyan))] hover:text-[hsl(var(--cosmic-cyan))] hover:bg-[hsl(var(--cosmic-cyan))]/10"
            >
              <Star className="w-4 h-4" />
              <span className="hidden sm:inline">PPLP</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDonateModalOpen(true)}
              className="gap-2 text-[hsl(var(--cosmic-gold))] hover:text-[hsl(var(--cosmic-gold))] hover:bg-[hsl(var(--cosmic-gold))]/10 ml-auto"
            >
              <Gift className="w-4 h-4" />
              <span className="hidden sm:inline">Tặng</span>
            </Button>
          </>
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

      {/* PPLP Rating Modal */}
      <PPLPRatingModal
        open={ratingModalOpen}
        onOpenChange={setRatingModalOpen}
        contentId={post.id}
        contentType="post"
        authorUserId={post.user_id}
      />
    </Card>
  );
};
