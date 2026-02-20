import { useState, useEffect } from "react";
import { formatDuration, formatViews } from "@/lib/formatters";
import { useNavigate } from "react-router-dom";
import { useVideoNavigation } from "@/lib/videoNavigation";
import { ArrowLeft, MoreVertical, Globe, Lock, Eye, Play, FileText, List, Radio } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MobileBottomNav } from "@/components/Layout/MobileBottomNav";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

interface Video {
  id: string;
  title: string;
  thumbnail_url: string | null;
  view_count: number;
  is_public: boolean;
  created_at: string;
  duration: number | null;
}

interface Post {
  id: string;
  content: string;
  image_url: string | null;
  like_count: number;
  comment_count: number;
  created_at: string;
}

const YourVideosMobile = () => {
  const navigate = useNavigate();
  const { goToVideo } = useVideoNavigation();
  const { user, loading: authLoading } = useAuth();
  const { profile } = useProfile();
  
  const [longVideos, setLongVideos] = useState<Video[]>([]);
  const [shortVideos, setShortVideos] = useState<Video[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("videos");
  const [filter, setFilter] = useState<"all" | "public" | "private">("all");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/auth");
      return;
    }

    const fetchContent = async () => {
      setLoading(true);

      // Fetch videos
      const { data: videoData } = await supabase
        .from("videos")
        .select("id, title, thumbnail_url, view_count, is_public, created_at, duration")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (videoData) {
        const long = videoData.filter(v => v.duration == null || v.duration > 180);
        const short = videoData.filter(v => v.duration != null && v.duration <= 180);
        setLongVideos(long);
        setShortVideos(short);
      }

      // Fetch posts
      const { data: postData } = await supabase
        .from("posts")
        .select("id, content, image_url, like_count, comment_count, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (postData) {
        setPosts(postData);
      }

      setLoading(false);
    };

    fetchContent();
  }, [user, authLoading, navigate]);

  const filteredLongVideos = longVideos.filter((video) => {
    if (filter === "all") return true;
    if (filter === "public") return video.is_public;
    if (filter === "private") return !video.is_public;
    return true;
  });

  const filteredShortVideos = shortVideos.filter((video) => {
    if (filter === "all") return true;
    if (filter === "public") return video.is_public;
    if (filter === "private") return !video.is_public;
    return true;
  });

  // formatDuration and formatViews imported from @/lib/formatters

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) return null;

  const displayName = profile?.display_name || profile?.username || "User";

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-10 w-10" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <span className="font-semibold text-lg">Video của bạn</span>
          </div>
          <Avatar className="h-8 w-8">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback>{displayName.charAt(0)}</AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="border-b border-border">
          <TabsList className="w-full justify-start gap-0 h-auto p-0 bg-transparent overflow-x-auto scrollbar-hide">
            <TabsTrigger
              value="videos"
              className="flex-shrink-0 px-4 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              <Play className="h-4 w-4 mr-2" />
              Video
            </TabsTrigger>
            <TabsTrigger
              value="shorts"
              className="flex-shrink-0 px-4 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              <Eye className="h-4 w-4 mr-2" />
              Shorts
            </TabsTrigger>
            <TabsTrigger
              value="live"
              className="flex-shrink-0 px-4 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              <Radio className="h-4 w-4 mr-2" />
              Trực tiếp
            </TabsTrigger>
            <TabsTrigger
              value="playlists"
              className="flex-shrink-0 px-4 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              <List className="h-4 w-4 mr-2" />
              Danh sách
            </TabsTrigger>
            <TabsTrigger
              value="posts"
              className="flex-shrink-0 px-4 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              <FileText className="h-4 w-4 mr-2" />
              Bài đăng
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Filter chips for videos */}
        {(activeTab === "videos" || activeTab === "shorts") && (
          <div className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-hide">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              size="sm"
              className="flex-shrink-0"
              onClick={() => setFilter("all")}
            >
              Tất cả
            </Button>
            <Button
              variant={filter === "public" ? "default" : "outline"}
              size="sm"
              className="flex-shrink-0"
              onClick={() => setFilter("public")}
            >
              <Globe className="h-3 w-3 mr-1" />
              Công khai
            </Button>
            <Button
              variant={filter === "private" ? "default" : "outline"}
              size="sm"
              className="flex-shrink-0"
              onClick={() => setFilter("private")}
            >
              <Lock className="h-3 w-3 mr-1" />
              Riêng tư
            </Button>
          </div>
        )}

        {/* Videos Tab */}
        <TabsContent value="videos" className="mt-0">
          {loading ? (
            <div className="space-y-4 p-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3 animate-pulse">
                  <div className="w-40 aspect-video bg-muted rounded-lg flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-full" />
                    <div className="h-3 bg-muted rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredLongVideos.length > 0 ? (
            <div className="space-y-4 p-4">
              {filteredLongVideos.map((video) => (
                <div key={video.id} className="flex gap-3">
                  <div
                    className="relative w-40 aspect-video rounded-lg overflow-hidden bg-muted flex-shrink-0 cursor-pointer"
                    onClick={() => goToVideo(video.id)}
                  >
                    {video.thumbnail_url ? (
                      <img
                        src={video.thumbnail_url}
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Play className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    {video.duration && (
                      <span className="absolute bottom-1 right-1 text-xs bg-black/80 text-white px-1 py-0.5 rounded">
                        {formatDuration(video.duration)}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium line-clamp-2 mb-1">{video.title}</h3>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      {video.is_public ? (
                        <Globe className="h-3 w-3" />
                      ) : (
                        <Lock className="h-3 w-3" />
                      )}
                      <span>{video.is_public ? "Công khai" : "Riêng tư"}</span>
                      <span>•</span>
                      <span>{formatViews(video.view_count)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(video.created_at), { addSuffix: true, locale: vi })}
                    </p>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => navigate(`/edit-video/${video.id}`)}>
                        Chỉnh sửa
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        {video.is_public ? "Đặt riêng tư" : "Công khai"}
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        Xóa
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <Play className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Chưa có video nào</h3>
              <p className="text-sm text-muted-foreground text-center mb-4">
                Bắt đầu tải lên video đầu tiên của bạn
              </p>
              <Button onClick={() => navigate("/upload")}>
                Tải video lên
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Shorts Tab */}
        <TabsContent value="shorts" className="mt-0">
          {loading ? (
            <div className="grid grid-cols-3 gap-2 p-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-[9/16] bg-muted rounded-lg" />
                  <div className="h-3 bg-muted rounded w-3/4 mt-1" />
                </div>
              ))}
            </div>
          ) : filteredShortVideos.length > 0 ? (
            <div className="grid grid-cols-3 gap-2 p-4">
              {filteredShortVideos.map((video) => (
                <div
                  key={video.id}
                  className="cursor-pointer group"
                  onClick={() => goToVideo(video.id)}
                >
                  <div className="relative aspect-[9/16] rounded-lg overflow-hidden bg-muted">
                    {video.thumbnail_url ? (
                      <img
                        src={video.thumbnail_url}
                        alt={video.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Eye className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    {video.duration && (
                      <span className="absolute bottom-1 right-1 text-xs bg-black/80 text-white px-1 py-0.5 rounded">
                        {formatDuration(video.duration)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs mt-1 line-clamp-1">{video.title}</p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    {video.is_public ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                    <span>{formatViews(video.view_count)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <Eye className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Chưa có Shorts nào</h3>
              <p className="text-sm text-muted-foreground text-center">
                Shorts sẽ hiển thị ở đây
              </p>
            </div>
          )}
        </TabsContent>

        {/* Live Tab */}
        <TabsContent value="live" className="mt-0">
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <Radio className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Chưa có video trực tiếp</h3>
            <p className="text-sm text-muted-foreground text-center">
              Tính năng phát trực tiếp sẽ sớm có mặt
            </p>
          </div>
        </TabsContent>

        {/* Playlists Tab */}
        <TabsContent value="playlists" className="mt-0">
          <div className="p-4">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => navigate("/manage-playlists")}
            >
              <List className="h-4 w-4 mr-2" />
              Quản lý danh sách phát
            </Button>
          </div>
        </TabsContent>

        {/* Posts Tab */}
        <TabsContent value="posts" className="mt-0">
          {posts.length > 0 ? (
            <div className="space-y-4 p-4">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="border border-border rounded-lg p-4 cursor-pointer hover:bg-muted/50"
                  onClick={() => navigate(`/post/${post.id}`)}
                >
                  <p className="text-sm line-clamp-3 mb-2">{post.content}</p>
                  {post.image_url && (
                    <img
                      src={post.image_url}
                      alt="Post"
                      className="w-full aspect-video object-cover rounded-lg mb-2"
                    />
                  )}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{post.like_count || 0} lượt thích</span>
                    <span>{post.comment_count || 0} bình luận</span>
                    <span>
                      {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: vi })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <FileText className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Chưa có bài đăng nào</h3>
              <p className="text-sm text-muted-foreground text-center mb-4">
                Chia sẻ suy nghĩ với cộng đồng
              </p>
              <Button onClick={() => navigate("/create-post")}>
                Tạo bài đăng
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <MobileBottomNav />
    </div>
  );
};

export default YourVideosMobile;
