import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/Layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { usePlaylistOperations, PlaylistWithVideos, PlaylistVideo } from "@/hooks/usePlaylistOperations";
import { useVideoPlayback } from "@/contexts/VideoPlaybackContext";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";
import { 
  Play, Shuffle, Globe, Lock, Link, MoreVertical, Trash2, 
  GripVertical, Clock, Eye, Plus, Pencil, ExternalLink, ChevronLeft, Download, Search, Cast
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { AddVideoToPlaylistModal } from "@/components/Playlist/AddVideoToPlaylistModal";
import { EditPlaylistModal } from "@/components/Playlist/EditPlaylistModal";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const formatDuration = (seconds: number | null): string => {
  if (!seconds) return "0:00";
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const formatTotalDuration = (seconds: number): string => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hrs > 0) {
    return `${hrs} giờ ${mins} phút`;
  }
  return `${mins} phút`;
};

const formatViews = (count: number | null): string => {
  if (!count) return "0 lượt xem";
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M lượt xem`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K lượt xem`;
  return `${count} lượt xem`;
};

const formatTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return "Vừa xong";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút trước`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ trước`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} ngày trước`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)} tuần trước`;
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} tháng trước`;
  return `${Math.floor(diffInSeconds / 31536000)} năm trước`;
};

const getVisibilityInfo = (is_public: boolean | null) => {
  if (is_public === true) return { icon: Globe, text: "Công khai" };
  if (is_public === false) return { icon: Lock, text: "Riêng tư" };
  return { icon: Link, text: "Không công khai" };
};

const Playlist = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [playlist, setPlaylist] = useState<PlaylistWithVideos | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [addVideoOpen, setAddVideoOpen] = useState(false);
  const [editPlaylistOpen, setEditPlaylistOpen] = useState(false);
  
  const { user } = useAuth();
  const { fetchPlaylist, removeVideoFromPlaylist, reorderPlaylistVideos, loading } = usePlaylistOperations();
  const { createSession } = useVideoPlayback();
  const isMobile = useIsMobile();
  const { lightTap } = useHapticFeedback();

  const isOwner = user?.id === playlist?.user_id;

  useEffect(() => {
    if (id) {
      loadPlaylist();
    }
  }, [id]);

  const loadPlaylist = async () => {
    if (!id) return;
    const data = await fetchPlaylist(id);
    setPlaylist(data);
  };

  const handleGoBack = () => {
    lightTap();
    navigate(-1);
  };

  const handlePlayAll = async (shuffle = false) => {
    if (!playlist || playlist.videos.length === 0) return;
    
    const queue = playlist.videos.map(v => ({
      id: v.video.id,
      title: v.video.title,
      thumbnail_url: v.video.thumbnail_url,
      video_url: v.video.video_url,
      duration: v.video.duration,
      view_count: v.video.view_count,
      channel_name: v.video.channel_name,
      channel_id: v.video.channel_id,
    }));

    const startVideo = shuffle 
      ? queue[Math.floor(Math.random() * queue.length)]
      : queue[0];

    await createSession(startVideo.id, "PLAYLIST", playlist.id, queue);
    navigate(`/watch/${startVideo.id}?list=${playlist.id}`);
  };

  const handlePlayVideo = async (video: PlaylistVideo, index: number) => {
    if (!playlist) return;
    
    const queue = playlist.videos.map(v => ({
      id: v.video.id,
      title: v.video.title,
      thumbnail_url: v.video.thumbnail_url,
      video_url: v.video.video_url,
      duration: v.video.duration,
      view_count: v.video.view_count,
      channel_name: v.video.channel_name,
      channel_id: v.video.channel_id,
    }));

    await createSession(video.video.id, "PLAYLIST", playlist.id, queue);
    navigate(`/watch/${video.video.id}?list=${playlist.id}`);
  };

  const handleRemoveVideo = async (videoId: string) => {
    if (!playlist) return;
    const success = await removeVideoFromPlaylist(playlist.id, videoId);
    if (success) {
      setPlaylist(prev => prev ? {
        ...prev,
        videos: prev.videos.filter(v => v.video.id !== videoId),
        video_count: prev.video_count - 1,
      } : null);
    }
  };

  const handleShare = async () => {
    lightTap();
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({
          title: playlist?.name || "Danh sách phát",
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        toast({
          title: "Đã sao chép link",
          description: "Link đã được sao chép vào clipboard",
        });
      }
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  // Drag and drop handlers (desktop only)
  const handleDragStart = (index: number) => {
    if (isMobile) return;
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    if (isMobile) return;
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index || !playlist) return;

    const newVideos = [...playlist.videos];
    const draggedItem = newVideos[draggedIndex];
    newVideos.splice(draggedIndex, 1);
    newVideos.splice(index, 0, draggedItem);

    setPlaylist(prev => prev ? { ...prev, videos: newVideos } : null);
    setDraggedIndex(index);
  };

  const handleDragEnd = async () => {
    if (!playlist || draggedIndex === null) {
      setDraggedIndex(null);
      return;
    }

    // Update positions in database
    const updates = playlist.videos.map((v, idx) => ({
      video_id: v.video.id,
      position: idx + 1,
    }));

    await reorderPlaylistVideos(playlist.id, updates);
    setDraggedIndex(null);
  };

  // Loading state
  if (loading && !playlist) {
    return (
      <MainLayout showBottomNav={false}>
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex gap-6">
            <Skeleton className="w-80 h-96 rounded-xl" />
            <div className="flex-1 space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Not found state
  if (!playlist) {
    return (
      <MainLayout showBottomNav={false}>
        <div>
          {isMobile && (
            <div className="fixed top-0 left-0 right-0 z-50 bg-background border-b">
              <div className="flex items-center p-2">
                <button onClick={handleGoBack} className="p-2 rounded-full hover:bg-muted">
                  <ChevronLeft className="h-6 w-6" />
                </button>
              </div>
            </div>
          )}
          <div className="max-w-7xl mx-auto p-6 text-center py-20">
            <h2 className="text-2xl font-bold mb-2">Không tìm thấy danh sách phát</h2>
            <p className="text-muted-foreground">Danh sách phát này không tồn tại hoặc đã bị xóa.</p>
          </div>
        </div>
        </MainLayout>
    );
  }

  const visibilityInfo = getVisibilityInfo(playlist.is_public);
  const VisibilityIcon = visibilityInfo.icon;
  const thumbnailUrl = playlist.videos[0]?.video.thumbnail_url;

  // Mobile Layout
  if (isMobile) {
    return (
      <div className="min-h-screen bg-background">
        {/* Fixed Header with Back Button */}
        <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
          <div className="flex items-center justify-between p-2 pointer-events-auto">
            <button 
              onClick={handleGoBack}
              className="p-2 rounded-full text-white hover:bg-white/20 transition-colors"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <div className="flex items-center gap-1">
              <button className="p-2 rounded-full text-white hover:bg-white/20 transition-colors">
                <Cast className="h-5 w-5" />
              </button>
              <button className="p-2 rounded-full text-white hover:bg-white/20 transition-colors">
                <Search className="h-5 w-5" />
              </button>
              <button className="p-2 rounded-full text-white hover:bg-white/20 transition-colors">
                <MoreVertical className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Full-width Thumbnail */}
        <div className="relative w-full aspect-video">
          {thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt={playlist.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-500/20 to-cyan-500/20 flex items-center justify-center">
              <Play className="h-16 w-16 text-white/50" />
            </div>
          )}
          
          {/* Gradient overlay bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
          
          {/* Edit Thumbnail Button */}
          {isOwner && (
            <button 
              onClick={() => {
                lightTap();
                setEditPlaylistOpen(true);
              }}
              className="absolute bottom-4 right-4 h-10 w-10 rounded-full bg-white/90 shadow-lg flex items-center justify-center hover:bg-white transition-colors"
            >
              <Pencil className="h-5 w-5 text-gray-800" />
            </button>
          )}
        </div>

        {/* Playlist Info Section */}
        <div className="px-4 py-3 -mt-6 relative z-10">
          <h1 className="text-xl font-bold mb-1">{playlist.name}</h1>
          
          {/* Owner info */}
          {playlist.owner && (
            <p className="text-sm text-muted-foreground mb-1">
              của {playlist.owner.display_name || playlist.owner.username}
            </p>
          )}
          
          {/* Stats line */}
          <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
            <span>Danh sách phát</span>
            <span>•</span>
            <VisibilityIcon className="h-3.5 w-3.5" />
            <span>{visibilityInfo.text}</span>
            <span>•</span>
            <span>{playlist.video_count} video</span>
          </div>
          
          {/* Description */}
          {playlist.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {playlist.description}
            </p>
          )}
          
          {/* Action Buttons Row */}
          <div className="flex items-center gap-2">
            <Button
              onClick={() => handlePlayAll(false)}
              variant="outline"
              className="flex-1"
              disabled={playlist.videos.length === 0}
            >
              <Play className="h-4 w-4 mr-2 fill-current" />
              Phát tất cả
            </Button>
            
            <Button
              variant="secondary"
              size="icon"
              className="h-10 w-10 rounded-full"
              onClick={() => handlePlayAll(true)}
              disabled={playlist.videos.length === 0}
            >
              <Shuffle className="h-4 w-4" />
            </Button>
            
            {/* Circular action buttons */}
            {isOwner && (
              <>
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-10 w-10 rounded-full"
                  onClick={() => { lightTap(); setAddVideoOpen(true); }}
                >
                  <Plus className="h-5 w-5" />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-10 w-10 rounded-full"
                  onClick={() => { lightTap(); setEditPlaylistOpen(true); }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </>
            )}
            <Button
              variant="secondary"
              size="icon"
              className="h-10 w-10 rounded-full"
              onClick={handleShare}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="h-10 w-10 rounded-full"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>

          {/* Total Duration */}
          {playlist.total_duration > 0 && (
            <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Tổng: {formatTotalDuration(playlist.total_duration)}</span>
            </div>
          )}
        </div>

        {/* Video List - CLEAN, no numbers, no grip */}
        <div className="flex-1 pb-20">
          {playlist.videos.length === 0 ? (
            <div className="text-center py-20 px-4">
              <Play className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Chưa có video nào</h3>
              <p className="text-muted-foreground mb-4">
                Thêm video vào danh sách phát để bắt đầu xem
              </p>
              {isOwner && (
                <Button onClick={() => setAddVideoOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm video
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-0">
              {playlist.videos.map((item, index) => (
                <div
                  key={item.id}
                  className="flex items-start gap-3 px-4 py-2 active:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => handlePlayVideo(item, index)}
                >
                  {/* Thumbnail - LEFT ALIGNED, sát trái */}
                  <div className="relative w-40 aspect-video rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                    {item.video.thumbnail_url ? (
                      <img
                        src={item.video.thumbnail_url}
                        alt={item.video.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Play className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    {item.video.duration && (
                      <span className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded font-medium">
                        {formatDuration(item.video.duration)}
                      </span>
                    )}
                  </div>

                  {/* Video Info */}
                  <div className="flex-1 min-w-0 py-0.5">
                    <h3 className="font-semibold text-sm line-clamp-2 mb-1">
                      {item.video.title}
                    </h3>
                    {item.video.channel_name && (
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {item.video.channel_name}
                      </p>
                    )}
                  </div>

                  {/* Menu dots */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0 mt-1">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {isOwner && (
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveVideo(item.video.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Xóa khỏi danh sách
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modals */}
        {playlist && (
          <>
            <AddVideoToPlaylistModal
              open={addVideoOpen}
              onOpenChange={setAddVideoOpen}
              playlistId={playlist.id}
              existingVideoIds={playlist.videos.map(v => v.video.id)}
              onVideoAdded={loadPlaylist}
            />
            <EditPlaylistModal
              open={editPlaylistOpen}
              onOpenChange={setEditPlaylistOpen}
              playlist={{
                id: playlist.id,
                name: playlist.name,
                description: playlist.description,
                is_public: playlist.is_public,
              }}
              onUpdated={loadPlaylist}
            />
          </>
        )}
      </div>
    );
  }

  // Desktop Layout
  return (
    <MainLayout>
      <main>
        <div className="max-w-7xl mx-auto p-4 lg:p-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Playlist Info Card */}
            <div className="lg:w-80 lg:sticky lg:top-20 lg:self-start">
              <div className="bg-gradient-to-b from-primary/20 to-background rounded-xl p-4">
                {/* Thumbnail with edit button */}
                <div className="relative aspect-video bg-muted rounded-lg mb-4 overflow-hidden">
                  {thumbnailUrl ? (
                    <img
                      src={thumbnailUrl}
                      alt={playlist.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted">
                      <Play className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                  
                  {/* Edit thumbnail button */}
                  {isOwner && (
                    <button 
                      className="absolute bottom-2 right-2 h-9 w-9 rounded-full bg-background/90 shadow-lg flex items-center justify-center hover:bg-background transition-colors"
                      onClick={() => setEditPlaylistOpen(true)}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Playlist Info */}
                <h1 className="text-lg font-bold mb-2 line-clamp-2">{playlist.name}</h1>
                
                {playlist.owner && (
                  <div className="flex items-center gap-2 mb-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={playlist.owner.avatar_url || undefined} />
                      <AvatarFallback>
                        {playlist.owner.display_name?.[0] || playlist.owner.username[0]}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-muted-foreground">
                      {playlist.owner.display_name || playlist.owner.username}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                  <VisibilityIcon className="h-4 w-4" />
                  <span>{visibilityInfo.text}</span>
                  <span>•</span>
                  <span>{playlist.video_count} video</span>
                </div>

                {playlist.description && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {playlist.description}
                  </p>
                )}

                {/* Action Buttons Row */}
                <div className="flex items-center gap-2 mb-3">
                  {/* Play button - smaller */}
                  <Button
                    onClick={() => handlePlayAll(false)}
                    size="sm"
                    className="flex-1"
                    disabled={playlist.videos.length === 0}
                  >
                    <Play className="h-4 w-4 mr-1" />
                    Phát tất cả
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 rounded-full"
                    onClick={() => handlePlayAll(true)}
                    disabled={playlist.videos.length === 0}
                  >
                    <Shuffle className="h-4 w-4" />
                  </Button>
                </div>

                {/* Owner action buttons */}
                <div className="flex items-center gap-2">
                  {isOwner && (
                    <>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 rounded-full"
                        onClick={() => setAddVideoOpen(true)}
                        title="Thêm video"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 rounded-full"
                        onClick={() => setEditPlaylistOpen(true)}
                        title="Chỉnh sửa"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 rounded-full"
                    onClick={handleShare}
                    title="Chia sẻ"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>

                {/* Total Duration */}
                {playlist.total_duration > 0 && (
                  <div className="mt-3 pt-3 border-t border-border flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>Tổng: {formatTotalDuration(playlist.total_duration)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Video List - Desktop */}
            <div className="flex-1">
              {playlist.videos.length === 0 ? (
                <div className="text-center py-20">
                  <Play className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Chưa có video nào</h3>
                  <p className="text-muted-foreground mb-4">
                    Thêm video vào danh sách phát để bắt đầu xem
                  </p>
                  {isOwner && (
                    <Button onClick={() => setAddVideoOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Thêm video
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-1">
                  {playlist.videos.map((item, index) => (
                    <div
                      key={item.id}
                      draggable={isOwner}
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragEnd={handleDragEnd}
                      className={cn(
                        "flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group cursor-pointer",
                        draggedIndex === index && "opacity-50"
                      )}
                      onClick={() => handlePlayVideo(item, index)}
                    >
                      {/* Drag Handle - only for desktop owner */}
                      {isOwner && (
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity cursor-grab flex-shrink-0">
                          <GripVertical className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}

                      {/* Thumbnail */}
                      <div className="relative w-32 aspect-video rounded overflow-hidden flex-shrink-0 bg-muted">
                        {item.video.thumbnail_url ? (
                          <img
                            src={item.video.thumbnail_url}
                            alt={item.video.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Play className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        {item.video.duration && (
                          <span className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1 rounded">
                            {formatDuration(item.video.duration)}
                          </span>
                        )}
                      </div>

                      {/* Video Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm line-clamp-2 mb-0.5">{item.video.title}</h3>
                        {item.video.channel_name && (
                          <p className="text-xs text-muted-foreground">{item.video.channel_name}</p>
                        )}
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                          <span>{formatViews(item.video.view_count)}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      {isOwner && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 flex-shrink-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveVideo(item.video.id);
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Xóa khỏi danh sách
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
      {playlist && (
        <>
          <AddVideoToPlaylistModal
            open={addVideoOpen}
            onOpenChange={setAddVideoOpen}
            playlistId={playlist.id}
            existingVideoIds={playlist.videos.map(v => v.video.id)}
            onVideoAdded={loadPlaylist}
          />
          <EditPlaylistModal
            open={editPlaylistOpen}
            onOpenChange={setEditPlaylistOpen}
            playlist={{
              id: playlist.id,
              name: playlist.name,
              description: playlist.description,
              is_public: playlist.is_public,
            }}
            onUpdated={loadPlaylist}
          />
        </>
      )}
    </MainLayout>
  );
};

export default Playlist;
