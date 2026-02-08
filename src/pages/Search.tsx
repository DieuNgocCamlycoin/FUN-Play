import { useState, useEffect, useRef, useCallback } from "react";
import { formatViews, formatTimestamp, formatDuration } from "@/lib/formatters";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { MainLayout } from "@/components/Layout/MainLayout";
import { VideoCard } from "@/components/Video/VideoCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search as SearchIcon, SlidersHorizontal, ListMusic, Users, Video } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SearchVideo {
  id: string;
  title: string;
  thumbnail_url: string | null;
  video_url: string | null;
  view_count: number | null;
  duration: number | null;
  created_at: string;
  user_id: string;
  channels: { id: string; name: string; is_verified: boolean } | null;
}

interface ProfileInfo {
  display_name: string | null;
  username: string;
  avatar_url: string | null;
}

interface SearchChannel {
  id: string;
  name: string;
  description: string | null;
  subscriber_count: number | null;
  user_id: string;
  is_verified: boolean;
  avatar_url?: string | null;
}

interface SearchPlaylist {
  id: string;
  name: string;
  description: string | null;
  is_public: boolean;
  user_id: string;
  created_at: string;
  video_count?: number;
}

type FilterTab = "all" | "videos" | "channels" | "playlists";
type SortOption = "relevance" | "date" | "views";

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get("q") || "";
  const [localQuery, setLocalQuery] = useState(query);
  const [videoResults, setVideoResults] = useState<(SearchVideo & { profile?: ProfileInfo })[]>([]);
  const [channelResults, setChannelResults] = useState<SearchChannel[]>([]);
  const [playlistResults, setPlaylistResults] = useState<SearchPlaylist[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");
  const [sortBy, setSortBy] = useState<SortOption>("relevance");
  const [previewVideoId, setPreviewVideoId] = useState<string | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const canHover = typeof window !== 'undefined' && window.matchMedia?.('(hover: hover)')?.matches;

  const handleThumbnailMouseEnter = useCallback((videoId: string) => {
    if (!canHover) return;
    hoverTimeoutRef.current = setTimeout(() => {
      setPreviewVideoId(videoId);
    }, 500);
  }, [canHover]);

  const handleThumbnailMouseLeave = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setPreviewVideoId(null);
  }, []);

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    setLocalQuery(query);
    if (query.trim()) {
      performSearch(query.trim());
    } else {
      setVideoResults([]);
      setChannelResults([]);
      setPlaylistResults([]);
    }
  }, [query, sortBy]);

  const performSearch = async (q: string) => {
    setLoading(true);
    try {
      // Parallel search: videos, channels, playlists
      const [videosRes, channelsRes, playlistsRes] = await Promise.all([
        searchVideos(q),
        searchChannels(q),
        searchPlaylists(q),
      ]);
      setVideoResults(videosRes);
      setChannelResults(channelsRes);
      setPlaylistResults(playlistsRes);
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setLoading(false);
    }
  };

  const searchVideos = async (q: string) => {
    let query = supabase
      .from("videos")
      .select("id, title, thumbnail_url, video_url, view_count, duration, created_at, user_id, channels(id, name, is_verified)")
      .eq("is_public", true)
      .eq("approval_status", "approved")
      .or(`title.ilike.%${q}%,description.ilike.%${q}%`);

    if (sortBy === "date") query = query.order("created_at", { ascending: false });
    else if (sortBy === "views") query = query.order("view_count", { ascending: false });
    else query = query.order("created_at", { ascending: false });

    const { data, error } = await query.limit(50);
    if (error || !data || data.length === 0) return [];

    const userIds = [...new Set(data.map(v => v.user_id))];
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("id, display_name, username, avatar_url")
      .in("id", userIds);

    const profilesMap = new Map(
      profilesData?.map(p => [p.id, { display_name: p.display_name, username: p.username, avatar_url: p.avatar_url }]) || []
    );

    return data.map(video => ({ ...video, profile: profilesMap.get(video.user_id) }));
  };

  const searchChannels = async (q: string) => {
    const { data, error } = await supabase
      .from("channels")
      .select("id, name, description, subscriber_count, user_id, is_verified")
      .ilike("name", `%${q}%`)
      .order("subscriber_count", { ascending: false })
      .limit(20);

    if (error || !data) return [];

    // Fetch avatars for channel owners
    const userIds = data.map(c => c.user_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, avatar_url")
      .in("id", userIds);
    const avatarMap = new Map(profiles?.map(p => [p.id, p.avatar_url]) || []);

    return data.map(c => ({ ...c, avatar_url: avatarMap.get(c.user_id) }));
  };

  const searchPlaylists = async (q: string) => {
    const { data, error } = await supabase
      .from("playlists")
      .select("id, name, description, is_public, user_id, created_at")
      .eq("is_public", true)
      .ilike("name", `%${q}%`)
      .order("created_at", { ascending: false })
      .limit(20);

    return data || [];
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (localQuery.trim()) {
      setSearchParams({ q: localQuery.trim() });
    }
  };

  // formatViews and formatTimestamp imported from @/lib/formatters

  const timeAgo = formatTimestamp;

  const filterTabs: { id: FilterTab; label: string; icon: React.ReactNode; count: number }[] = [
    { id: "all", label: "Tất cả", icon: null, count: videoResults.length + channelResults.length + playlistResults.length },
    { id: "videos", label: "Video", icon: <Video className="h-4 w-4" />, count: videoResults.length },
    { id: "channels", label: "Kênh", icon: <Users className="h-4 w-4" />, count: channelResults.length },
    { id: "playlists", label: "Danh sách phát", icon: <ListMusic className="h-4 w-4" />, count: playlistResults.length },
  ];

  const showVideos = activeFilter === "all" || activeFilter === "videos";
  const showChannels = activeFilter === "all" || activeFilter === "channels";
  const showPlaylists = activeFilter === "all" || activeFilter === "playlists";

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto p-4 lg:p-6">
        {/* Search input */}
        <form onSubmit={handleSubmit} className="mb-4">
          <div className="relative max-w-2xl">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              value={localQuery}
              onChange={(e) => setLocalQuery(e.target.value)}
              placeholder="Tìm kiếm video, kênh, danh sách phát..."
              className="pl-10 h-12 text-base"
            />
          </div>
        </form>

        {/* Filter tabs + Sort */}
        {query && (
          <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
            <div className="flex gap-2 overflow-x-auto">
              {filterTabs.map((tab) => (
                <Button
                  key={tab.id}
                  variant={activeFilter === tab.id ? "default" : "secondary"}
                  size="sm"
                  className="rounded-full gap-1.5 shrink-0"
                  onClick={() => setActiveFilter(tab.id)}
                >
                  {tab.icon}
                  {tab.label}
                  {tab.count > 0 && <span className="text-xs opacity-70">({tab.count})</span>}
                </Button>
              ))}
            </div>

            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
              <SelectTrigger className="w-[180px]">
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Sắp xếp" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">Liên quan nhất</SelectItem>
                <SelectItem value="date">Mới nhất</SelectItem>
                <SelectItem value="views">Lượt xem</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Results header */}
        {query && !loading && (
          <p className="text-muted-foreground mb-4">
            {videoResults.length + channelResults.length + playlistResults.length} kết quả cho "{query}"
          </p>
        )}

        {/* Loading */}
        {loading && (
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="w-[360px] aspect-video rounded-lg shrink-0" />
                <div className="flex-1 space-y-2 pt-1">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && (
          <div className="space-y-6">
            {/* Channel results */}
            {showChannels && channelResults.length > 0 && (
              <div className="space-y-3">
                {activeFilter === "all" && <h2 className="text-lg font-semibold text-foreground">Kênh</h2>}
                {channelResults.map((ch) => (
                  <div
                    key={ch.id}
                    className="flex items-center gap-4 p-4 rounded-xl hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/channel/${ch.id}`)}
                  >
                    <Avatar className="h-16 w-16 shrink-0">
                      <AvatarImage src={ch.avatar_url || undefined} />
                      <AvatarFallback className="bg-gradient-to-br from-cosmic-sapphire to-cosmic-cyan text-white text-xl font-bold">
                        {ch.name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-semibold text-foreground">{ch.name}</h3>
                        {ch.is_verified && (
                          <svg className="w-4 h-4 text-muted-foreground shrink-0" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                          </svg>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {(ch.subscriber_count || 0).toLocaleString()} người đăng ký
                      </p>
                      {ch.description && (
                        <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">{ch.description}</p>
                      )}
                    </div>
                    <Button variant="default" size="sm" className="rounded-full shrink-0">
                      Xem kênh
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Video results - list layout on desktop */}
            {showVideos && videoResults.length > 0 && (
              <div className="space-y-3">
                {activeFilter === "all" && channelResults.length > 0 && (
                  <h2 className="text-lg font-semibold text-foreground">Video</h2>
                )}
                {/* Mobile: grid, Desktop: list */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                  {videoResults.map((video) => (
                    <div key={video.id} className="hidden lg:flex gap-4 cursor-pointer group" onClick={() => navigate(`/watch/${video.id}`)}>
                      {/* Thumbnail with hover preview */}
                      <div
                        className="relative w-[360px] shrink-0 aspect-video rounded-xl overflow-hidden"
                        onMouseEnter={() => handleThumbnailMouseEnter(video.id)}
                        onMouseLeave={handleThumbnailMouseLeave}
                      >
                        {video.thumbnail_url ? (
                          <img src={video.thumbnail_url} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        ) : (
                          <div className="w-full h-full bg-muted flex items-center justify-center">
                            <Video className="w-8 h-8 text-muted-foreground" />
                          </div>
                        )}
                        {/* Hover video preview */}
                        {previewVideoId === video.id && video.video_url && (
                          <video
                            src={video.video_url}
                            className="absolute inset-0 w-full h-full object-cover z-10"
                            autoPlay
                            muted
                            loop
                            playsInline
                            preload="auto"
                          />
                        )}
                        {video.duration && video.duration > 0 && (
                          <span className="absolute bottom-1.5 right-1.5 bg-black/80 text-white text-xs font-medium px-1.5 py-0.5 rounded z-20">
                            {formatDuration(video.duration)}
                          </span>
                        )}
                      </div>
                      {/* Info */}
                      <div className="flex-1 min-w-0 py-1">
                        <h3 className="font-semibold text-foreground line-clamp-2 group-hover:text-cosmic-cyan transition-colors">
                          {video.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {formatViews(video.view_count)} • {timeAgo(video.created_at)}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          {video.profile?.avatar_url && (
                            <img src={video.profile.avatar_url} alt="" className="w-6 h-6 rounded-full object-cover" />
                          )}
                          <span className="text-sm text-muted-foreground">
                            {video.channels?.name || video.profile?.display_name || "Ẩn danh"}
                          </span>
                          {video.channels?.is_verified && (
                            <svg className="w-3.5 h-3.5 text-muted-foreground" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                            </svg>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Mobile: use VideoCard grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:hidden">
                  {videoResults.map((video) => (
                    <VideoCard
                      key={video.id}
                      videoId={video.id}
                      thumbnail={video.thumbnail_url || undefined}
                      title={video.title}
                      channel={video.channels?.name || video.profile?.display_name || "Ẩn danh"}
                      views={formatViews(video.view_count)}
                      timestamp={timeAgo(video.created_at)}
                      userId={video.user_id}
                      channelId={video.channels?.id}
                      avatarUrl={video.profile?.avatar_url || undefined}
                      duration={video.duration}
                      isVerified={video.channels?.is_verified}
                      videoUrl={video.video_url || undefined}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Playlist results */}
            {showPlaylists && playlistResults.length > 0 && (
              <div className="space-y-3">
                {activeFilter === "all" && <h2 className="text-lg font-semibold text-foreground">Danh sách phát</h2>}
                {playlistResults.map((pl) => (
                  <div
                    key={pl.id}
                    className="flex items-center gap-4 p-4 rounded-xl hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/playlist/${pl.id}`)}
                  >
                    <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-cosmic-sapphire/20 to-cosmic-cyan/20 flex items-center justify-center shrink-0">
                      <ListMusic className="w-8 h-8 text-cosmic-cyan" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground">{pl.name}</h3>
                      {pl.description && (
                        <p className="text-sm text-muted-foreground line-clamp-1">{pl.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {timeAgo(pl.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {!loading && query && videoResults.length === 0 && channelResults.length === 0 && playlistResults.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <SearchIcon className="w-16 h-16 text-muted-foreground/50 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Không tìm thấy kết quả</h2>
            <p className="text-muted-foreground max-w-md">
              Không tìm thấy nội dung nào phù hợp với "{query}". Hãy thử từ khóa khác.
            </p>
          </div>
        )}

        {/* Initial state */}
        {!query && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <SearchIcon className="w-16 h-16 text-muted-foreground/50 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Tìm kiếm video</h2>
            <p className="text-muted-foreground">Nhập từ khóa để bắt đầu tìm kiếm</p>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Search;
