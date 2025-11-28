import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/Layout/Header";
import { Sidebar } from "@/components/Layout/Sidebar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ThumbsUp, ThumbsDown, Share2, MoreHorizontal, Coins } from "lucide-react";
import { TipModal } from "@/components/Tipping/TipModal";
import { ShareModal } from "@/components/Video/ShareModal";
import { MiniProfileCard } from "@/components/Video/MiniProfileCard";
import { awardViewReward, awardLikeReward, awardCommentReward, awardShareReward } from "@/lib/rewards";
import { RewardNotification } from "@/components/Rewards/RewardNotification";

interface Video {
  id: string;
  title: string;
  description: string;
  video_url: string;
  view_count: number;
  like_count: number;
  dislike_count: number;
  created_at: string;
  user_id: string;
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
  user_id: string;
  profiles: {
    display_name: string;
    avatar_url: string;
  };
}

interface RecommendedVideo {
  id: string;
  title: string;
  thumbnail_url: string | null;
  view_count: number | null;
  created_at: string;
  channels: {
    name: string;
  };
}

export default function Watch() {
  const { id } = useParams();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [video, setVideo] = useState<Video | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [recommendedVideos, setRecommendedVideos] = useState<RecommendedVideo[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [tipModalOpen, setTipModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [rewardNotif, setRewardNotif] = useState<{ amount: number; type: "VIEW" | "LIKE" | "COMMENT" | "SHARE"; show: boolean }>({ 
    amount: 0, 
    type: "VIEW", 
    show: false 
  });
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [hasLiked, setHasLiked] = useState(false);
  const [showMiniProfile, setShowMiniProfile] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      fetchVideo();
      fetchComments();
      fetchRecommendedVideos();
    }
  }, [id]);

  useEffect(() => {
    if (user && video) {
      checkSubscription();
      checkLikeStatus();
    }
  }, [user, video]);

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

      // Award CAMLY for viewing
      if (user) {
        const result = await awardViewReward(user.id, id);
        if (result) {
          setRewardNotif({ amount: result.amount, type: result.type as any, show: true });
          if (result.milestone) {
            toast({
              title: "🎉 Chúc mừng! Milestone đạt được!",
              description: `Bạn đã đạt ${result.milestone} CAMLY tổng rewards!`,
              duration: 5000,
            });
          }
        }
      }
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

  const fetchRecommendedVideos = async () => {
    try {
      const { data, error } = await supabase
        .from("videos")
        .select(`
          id,
          title,
          thumbnail_url,
          view_count,
          created_at,
          channels (
            name
          )
        `)
        .eq("is_public", true)
        .neq("id", id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      setRecommendedVideos(data || []);
    } catch (error: any) {
      console.error("Error loading recommended videos:", error);
    }
  };

  const handleVideoEnd = () => {
    // Autoplay next video
    if (recommendedVideos.length > 0) {
      const nextVideo = recommendedVideos[0];
      navigate(`/watch/${nextVideo.id}`);
      toast({
        title: "Đang phát video tiếp theo",
        description: nextVideo.title,
      });
    }
  };

  const formatViews = (views: number | null) => {
    if (!views) return "0 lượt xem";
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M lượt xem`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K lượt xem`;
    return `${views} lượt xem`;
  };

  const formatTimestamp = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Hôm nay";
    if (diffDays === 1) return "1 ngày trước";
    if (diffDays < 30) return `${diffDays} ngày trước`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} tháng trước`;
    return `${Math.floor(diffDays / 365)} năm trước`;
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

      // Award CAMLY for commenting
      const result = await awardCommentReward(user.id, id!);
      if (result) {
        setRewardNotif({ amount: result.amount, type: result.type as any, show: true });
        if (result.milestone) {
          toast({
            title: "🎉 Chúc mừng! Milestone đạt được!",
            description: `Bạn đã đạt ${result.milestone} CAMLY tổng rewards!`,
            duration: 5000,
          });
        } else {
          toast({
            title: "Comment posted",
            description: "Your comment has been added (+1 CAMLY)",
          });
        }
      }
    } catch (error: any) {
      toast({
        title: "Error posting comment",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const checkSubscription = async () => {
    if (!user || !video) return;

    try {
      const { data } = await supabase
        .from("subscriptions")
        .select("id")
        .eq("channel_id", video.channels.id)
        .eq("subscriber_id", user.id)
        .maybeSingle();

      setIsSubscribed(!!data);
    } catch (error) {
      console.error("Error checking subscription:", error);
    }
  };

  const checkLikeStatus = async () => {
    if (!user || !id) return;

    try {
      const { data } = await supabase
        .from("likes")
        .select("id")
        .eq("video_id", id)
        .eq("user_id", user.id)
        .eq("is_dislike", false)
        .maybeSingle();

      setHasLiked(!!data);
    } catch (error) {
      console.error("Error checking like status:", error);
    }
  };

  const handleSubscribe = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }

    if (!video) return;

    try {
      if (isSubscribed) {
        await supabase
          .from("subscriptions")
          .delete()
          .eq("channel_id", video.channels.id)
          .eq("subscriber_id", user.id);

        await supabase
          .from("channels")
          .update({
            subscriber_count: Math.max(0, (video.channels.subscriber_count || 1) - 1),
          })
          .eq("id", video.channels.id);

        setIsSubscribed(false);
        toast({
          title: "Đã hủy đăng ký",
          description: "Bạn đã hủy đăng ký kênh này",
        });
      } else {
        await supabase.from("subscriptions").insert({
          channel_id: video.channels.id,
          subscriber_id: user.id,
        });

        await supabase
          .from("channels")
          .update({
            subscriber_count: (video.channels.subscriber_count || 0) + 1,
          })
          .eq("id", video.channels.id);

        setIsSubscribed(true);
        toast({
          title: "Đã đăng ký!",
          description: "Bạn đã đăng ký kênh này thành công",
        });
      }

      fetchVideo();
    } catch (error: any) {
      toast({
        title: "Lỗi",
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
      if (hasLiked) {
        // Unlike
        await supabase
          .from("likes")
          .delete()
          .eq("video_id", id)
          .eq("user_id", user.id)
          .eq("is_dislike", false);

        await supabase
          .from("videos")
          .update({ like_count: Math.max(0, (video?.like_count || 1) - 1) })
          .eq("id", id);

        setHasLiked(false);
      } else {
        // Like
        await supabase.from("likes").insert({
          video_id: id,
          user_id: user.id,
          is_dislike: false,
        });

        await supabase
          .from("videos")
          .update({ like_count: (video?.like_count || 0) + 1 })
          .eq("id", id);

        setHasLiked(true);

        // Award CAMLY for liking
        const result = await awardLikeReward(user.id, id!);
        if (result) {
          setRewardNotif({ amount: result.amount, type: result.type as any, show: true });
          if (result.milestone) {
            toast({
              title: "🎉 Chúc mừng! Milestone đạt được!",
              description: `Bạn đã đạt ${result.milestone} CAMLY tổng rewards!`,
              duration: 5000,
            });
          }
        }
      }

      fetchVideo();
    } catch (error: any) {
      toast({
        title: "Lỗi",
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
                  onEnded={handleVideoEnd}
                />
              </div>

              {/* Video Title */}
              <h1 className="text-xl font-bold text-foreground">
                {video.title}
              </h1>

              {/* Channel Info & Actions */}
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full bg-gradient-to-br from-cosmic-sapphire via-cosmic-cyan to-cosmic-magenta flex items-center justify-center text-foreground font-semibold cursor-pointer hover:shadow-[0_0_40px_rgba(0,255,255,0.7)] transition-shadow"
                    onClick={() => navigate(`/channel/${video.channels.id}`)}
                  >
                    {video.channels.name[0]}
                  </div>
                  <div className="relative">
                    <div
                      className="cursor-pointer"
                      onMouseEnter={() => setShowMiniProfile(true)}
                      onMouseLeave={() => setShowMiniProfile(false)}
                      onClick={() => navigate(`/channel/${video.channels.id}`)}
                    >
                      <p className="font-semibold text-foreground hover:text-cosmic-cyan transition-colors">
                        {video.channels.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {(video.channels.subscriber_count || 0).toLocaleString()} người đăng ký
                      </p>
                    </div>
                    {showMiniProfile && (
                      <div
                        className="absolute top-full left-0 mt-2"
                        onMouseEnter={() => setShowMiniProfile(true)}
                        onMouseLeave={() => setShowMiniProfile(false)}
                      >
                        <MiniProfileCard
                          channelId={video.channels.id}
                          channelName={video.channels.name}
                          subscriberCount={video.channels.subscriber_count || 0}
                          onSubscribeChange={() => {
                            fetchVideo();
                            checkSubscription();
                          }}
                        />
                      </div>
                    )}
                  </div>
                  <Button
                    onClick={handleSubscribe}
                    className={`rounded-full ml-2 ${
                      isSubscribed
                        ? "bg-muted hover:bg-muted/80 text-foreground"
                        : "bg-gradient-to-r from-cosmic-sapphire to-cosmic-cyan hover:from-cosmic-sapphire/90 hover:to-cosmic-cyan/90 text-foreground shadow-[0_0_30px_rgba(0,255,255,0.5)]"
                    }`}
                  >
                    {isSubscribed ? "Đã đăng ký" : "Đăng ký"}
                  </Button>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center bg-muted/50 rounded-full overflow-hidden border border-cosmic-cyan/20">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`rounded-full rounded-r-none gap-2 hover:bg-cosmic-cyan/20 ${
                        hasLiked ? "text-cosmic-cyan" : ""
                      }`}
                      onClick={handleLike}
                    >
                      <ThumbsUp className={`h-4 w-4 ${hasLiked ? "fill-current" : ""}`} />
                      <span className="font-semibold">{video.like_count || 0}</span>
                    </Button>
                    <div className="w-px h-6 bg-border"></div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-full rounded-l-none hover:bg-cosmic-magenta/20"
                    >
                      <ThumbsDown className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="rounded-full gap-2 bg-muted/50 hover:bg-cosmic-sapphire/20 border border-cosmic-sapphire/20"
                    onClick={() => setShareModalOpen(true)}
                  >
                    <Share2 className="h-4 w-4" />
                    Chia sẻ
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="rounded-full gap-2 bg-gradient-to-r from-glow-gold/20 to-divine-rose-gold/20 hover:from-glow-gold/30 hover:to-divine-rose-gold/30 border border-glow-gold/30"
                    onClick={() => setTipModalOpen(true)}
                  >
                    <Coins className="h-4 w-4 text-glow-gold" />
                    Tip
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="rounded-full bg-muted/50 hover:bg-muted/70"
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
                          <span 
                            className="font-semibold text-sm text-foreground cursor-pointer hover:text-cosmic-cyan transition-colors"
                            onClick={() => {
                              // Navigate to user's channel - we need to fetch channel ID from user_id
                              supabase
                                .from("channels")
                                .select("id")
                                .eq("user_id", comment.user_id)
                                .maybeSingle()
                                .then(({ data }) => {
                                  if (data) navigate(`/channel/${data.id}`);
                                });
                            }}
                          >
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
              {recommendedVideos.map((recVideo) => (
                <div
                  key={recVideo.id}
                  className="flex gap-2 group"
                >
                  <div 
                    className="relative flex-shrink-0 w-40 aspect-video rounded-lg overflow-hidden bg-muted cursor-pointer"
                    onClick={() => navigate(`/watch/${recVideo.id}`)}
                  >
                    <img
                      src={recVideo.thumbnail_url || "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&h=225&fit=crop"}
                      alt={recVideo.title}
                      className="w-full h-full object-cover group-hover:opacity-80 transition-opacity"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 
                      className="text-sm font-semibold text-foreground line-clamp-2 mb-1 group-hover:text-primary transition-colors cursor-pointer"
                      onClick={() => navigate(`/watch/${recVideo.id}`)}
                    >
                      {recVideo.title}
                    </h3>
                    <p 
                      className="text-xs text-muted-foreground mb-1 cursor-pointer hover:text-cosmic-cyan transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Find channel by name - in a real app you'd want to pass channel_id
                        supabase
                          .from("channels")
                          .select("id")
                          .eq("name", recVideo.channels?.name)
                          .maybeSingle()
                          .then(({ data }) => {
                            if (data) navigate(`/channel/${data.id}`);
                          });
                      }}
                    >
                      {recVideo.channels?.name || "Unknown Channel"}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <span>{formatViews(recVideo.view_count)}</span>
                      <span>•</span>
                      <span>{formatTimestamp(recVideo.created_at)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <ShareModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        videoId={id || ""}
        videoTitle={video?.title || ""}
        userId={user?.id}
      />

      <TipModal
        open={tipModalOpen}
        onOpenChange={setTipModalOpen}
        videoId={id}
        creatorName={video?.channels.name || ""}
        channelUserId={video?.user_id}
      />
      
      <RewardNotification 
        amount={rewardNotif.amount}
        type={rewardNotif.type}
        show={rewardNotif.show}
        onClose={() => setRewardNotif(prev => ({ ...prev, show: false }))}
      />
    </div>
  );
}
