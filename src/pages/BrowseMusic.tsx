import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { MainLayout } from "@/components/Layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useMusicPlayer, Track } from "@/contexts/MusicPlayerContext";
import { DynamicMeta } from "@/components/SEO/DynamicMeta";
import {
  Music,
  Play,
  Pause,
  Search,
  Filter,
  Clock,
  Eye,
  Heart,
  Grid3X3,
  List,
  Loader2,
  X,
  TrendingUp,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDuration, formatViewsShort } from "@/lib/formatters";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface MusicTrack {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
  thumbnail_url: string | null;
  duration: number | null;
  view_count: number | null;
  like_count: number | null;
  created_at: string;
  user_id: string;
  channels: {
    id: string;
    name: string;
  } | null;
}

const GENRES = [
  { value: "all", label: "Tất cả thể loại" },
  { value: "pop", label: "Pop" },
  { value: "rock", label: "Rock" },
  { value: "hip-hop", label: "Hip Hop" },
  { value: "r&b", label: "R&B" },
  { value: "electronic", label: "Electronic" },
  { value: "jazz", label: "Jazz" },
  { value: "classical", label: "Classical" },
  { value: "lofi", label: "Lo-Fi" },
  { value: "ambient", label: "Ambient" },
  { value: "meditation", label: "Thiền định" },
  { value: "vpop", label: "V-Pop" },
  { value: "indie", label: "Indie" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Mới nhất" },
  { value: "popular", label: "Phổ biến nhất" },
  { value: "most_liked", label: "Được thích nhiều nhất" },
  { value: "oldest", label: "Cũ nhất" },
];

export default function BrowseMusic() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { playTrack, currentTrack, isPlaying, togglePlay, addToQueue } = useMusicPlayer();

  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [selectedGenre, setSelectedGenre] = useState(searchParams.get("genre") || "all");
  const [sortBy, setSortBy] = useState(searchParams.get("sort") || "newest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [artists, setArtists] = useState<{ id: string; name: string; track_count: number }[]>([]);
  const [selectedArtist, setSelectedArtist] = useState(searchParams.get("artist") || "");

  useEffect(() => {
    fetchTracks();
    fetchArtists();
  }, [selectedGenre, sortBy, selectedArtist]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);
    if (selectedGenre !== "all") params.set("genre", selectedGenre);
    if (sortBy !== "newest") params.set("sort", sortBy);
    if (selectedArtist) params.set("artist", selectedArtist);
    setSearchParams(params);
  }, [searchQuery, selectedGenre, sortBy, selectedArtist]);

  const fetchTracks = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("videos")
        .select(`
          *,
          channels (
            id,
            name
          )
        `)
        .eq("is_public", true)
        .eq("category", "music")
        .or('is_hidden.is.null,is_hidden.eq.false');

      // Search filter
      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
      }

      // Artist filter
      if (selectedArtist) {
        query = query.eq("channels.id", selectedArtist);
      }

      // Sort
      switch (sortBy) {
        case "popular":
          query = query.order("view_count", { ascending: false });
          break;
        case "most_liked":
          query = query.order("like_count", { ascending: false });
          break;
        case "oldest":
          query = query.order("created_at", { ascending: true });
          break;
        default:
          query = query.order("created_at", { ascending: false });
      }

      query = query.limit(50);

      const { data, error } = await query;

      if (error) throw error;
      setTracks(data || []);
    } catch (error) {
      console.error("Error fetching tracks:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchArtists = async () => {
    try {
      const { data, error } = await supabase
        .from("videos")
        .select(`
          channel_id,
          channels (
            id,
            name
          )
        `)
        .eq("is_public", true)
        .eq("category", "music")
        .or('is_hidden.is.null,is_hidden.eq.false');

      if (error) throw error;

      // Count tracks per artist
      const artistCounts: Record<string, { id: string; name: string; count: number }> = {};
      data?.forEach((track) => {
        if (track.channels) {
          const id = track.channels.id;
          if (!artistCounts[id]) {
            artistCounts[id] = { id, name: track.channels.name, count: 0 };
          }
          artistCounts[id].count++;
        }
      });

      const sortedArtists = Object.values(artistCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 20)
        .map((a) => ({ id: a.id, name: a.name, track_count: a.count }));

      setArtists(sortedArtists);
    } catch (error) {
      console.error("Error fetching artists:", error);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTracks();
  };

  const handlePlayTrack = (track: MusicTrack) => {
    const musicTrack: Track = {
      id: track.id,
      title: track.title,
      thumbnail_url: track.thumbnail_url,
      video_url: track.video_url,
      duration: track.duration,
      channelName: track.channels?.name || "Nghệ sĩ chưa xác định",
    };

    if (currentTrack?.id === track.id) {
      togglePlay();
    } else {
      playTrack(musicTrack);
    }
  };

  const handleAddToQueue = (track: MusicTrack) => {
    const musicTrack: Track = {
      id: track.id,
      title: track.title,
      thumbnail_url: track.thumbnail_url,
      video_url: track.video_url,
      duration: track.duration,
      channelName: track.channels?.name || "Nghệ sĩ chưa xác định",
    };
    addToQueue(musicTrack);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedGenre("all");
    setSortBy("newest");
    setSelectedArtist("");
  };

  const hasActiveFilters = searchQuery || selectedGenre !== "all" || sortBy !== "newest" || selectedArtist;

  // formatDuration and formatViewsShort imported from @/lib/formatters

  return (
    <>
      <DynamicMeta
        title="Khám phá Âm nhạc - FUN Play"
        description="Khám phá hàng ngàn bài hát, playlist và nghệ sĩ trên FUN Play - Web3 Music Platform"
        url={`${window.location.origin}/browse/music`}
      />

      <MainLayout className="pt-2">
        <div className="max-w-7xl mx-auto p-4 lg:p-8">
          {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-secondary">
                  <Music className="w-8 h-8 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">Khám phá Âm nhạc</h1>
                  <p className="text-muted-foreground">
                    {tracks.length} bài hát • {artists.length} nghệ sĩ
                  </p>
                </div>
              </div>
            </div>

            {/* Search & Filters */}
            <div className="space-y-4 mb-8">
              {/* Search Bar */}
              <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    placeholder="Tìm kiếm bài hát, nghệ sĩ..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button type="submit">Tìm kiếm</Button>
              </form>

              {/* Filters Row */}
              <div className="flex flex-wrap gap-3 items-center">
                <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                  <SelectTrigger className="w-[180px]">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Thể loại" />
                  </SelectTrigger>
                  <SelectContent>
                    {GENRES.map((genre) => (
                      <SelectItem key={genre.value} value={genre.value}>
                        {genre.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[180px]">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Sắp xếp" />
                  </SelectTrigger>
                  <SelectContent>
                    {SORT_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* View Mode Toggle */}
                <div className="flex border rounded-lg overflow-hidden ml-auto">
                  <Button
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                    className="rounded-none"
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                    className="rounded-none"
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>

                {hasActiveFilters && (
                  <Button variant="outline" size="sm" onClick={clearFilters}>
                    <X className="w-4 h-4 mr-1" />
                    Xóa bộ lọc
                  </Button>
                )}
              </div>

              {/* Artist Chips */}
              {artists.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant={!selectedArtist ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => setSelectedArtist("")}
                  >
                    Tất cả nghệ sĩ
                  </Badge>
                  {artists.slice(0, 10).map((artist) => (
                    <Badge
                      key={artist.id}
                      variant={selectedArtist === artist.id ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => setSelectedArtist(artist.id === selectedArtist ? "" : artist.id)}
                    >
                      {artist.name} ({artist.track_count})
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Content */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : tracks.length === 0 ? (
              <div className="text-center py-20">
                <Music className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-xl font-semibold mb-2">Không tìm thấy bài hát</h3>
                <p className="text-muted-foreground mb-4">
                  Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm
                </p>
                <Button onClick={clearFilters}>Xóa bộ lọc</Button>
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                <AnimatePresence>
                  {tracks.map((track, index) => (
                    <motion.div
                      key={track.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: index * 0.03 }}
                    >
                      <Card
                        className="group cursor-pointer overflow-hidden hover:shadow-lg transition-all duration-300"
                        onClick={() => navigate(`/music/${track.id}`)}
                      >
                        <div className="relative aspect-square">
                          {track.thumbnail_url ? (
                            <img
                              src={track.thumbnail_url}
                              alt={track.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                              <Music className="w-12 h-12 text-muted-foreground" />
                            </div>
                          )}

                          {/* Play Overlay */}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Button
                              size="icon"
                              className="rounded-full w-12 h-12"
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePlayTrack(track);
                              }}
                            >
                              {currentTrack?.id === track.id && isPlaying ? (
                                <Pause className="w-6 h-6" />
                              ) : (
                                <Play className="w-6 h-6 ml-0.5" />
                              )}
                            </Button>
                          </div>

                          {/* Duration Badge */}
                          <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded">
                            {formatDuration(track.duration)}
                          </div>

                          {/* Playing Indicator */}
                          {currentTrack?.id === track.id && (
                            <div className="absolute top-2 left-2">
                              <Badge className="bg-primary animate-pulse">
                                <Sparkles className="w-3 h-3 mr-1" />
                                Đang phát
                              </Badge>
                            </div>
                          )}
                        </div>

                        <div className="p-3">
                          <h3 className="font-medium truncate mb-1">{track.title}</h3>
                          <p className="text-sm text-muted-foreground truncate">
                            {track.channels?.name || "Nghệ sĩ chưa xác định"}
                          </p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              {formatViewsShort(track.view_count)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Heart className="w-3 h-3" />
                              {formatViewsShort(track.like_count)}
                            </span>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <div className="space-y-2">
                <AnimatePresence>
                  {tracks.map((track, index) => (
                    <motion.div
                      key={track.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.02 }}
                    >
                      <Card
                        className="flex items-center gap-4 p-3 cursor-pointer hover:bg-accent/50 transition-colors group"
                        onClick={() => navigate(`/music/${track.id}`)}
                      >
                        {/* Thumbnail */}
                        <div className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0">
                          {track.thumbnail_url ? (
                            <img
                              src={track.thumbnail_url}
                              alt={track.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                              <Music className="w-6 h-6 text-muted-foreground" />
                            </div>
                          )}

                          <button
                            className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePlayTrack(track);
                            }}
                          >
                            {currentTrack?.id === track.id && isPlaying ? (
                              <Pause className="w-5 h-5 text-white" />
                            ) : (
                              <Play className="w-5 h-5 text-white ml-0.5" />
                            )}
                          </button>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium truncate">{track.title}</h3>
                            {currentTrack?.id === track.id && (
                              <Badge variant="outline" className="animate-pulse text-primary border-primary">
                                Đang phát
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {track.channels?.name || "Nghệ sĩ chưa xác định"}
                          </p>
                        </div>

                        {/* Stats */}
                        <div className="hidden sm:flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            {formatViewsShort(track.view_count)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Heart className="w-4 h-4" />
                            {formatViewsShort(track.like_count)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {formatDuration(track.duration)}
                          </span>
                        </div>

                        {/* Actions */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToQueue(track);
                          }}
                        >
                          Thêm vào hàng đợi
                        </Button>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </MainLayout>
    </>
  );
}
