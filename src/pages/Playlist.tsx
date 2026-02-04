import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/Layout/Header";
import { Sidebar } from "@/components/Layout/Sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { usePlaylistOperations, PlaylistWithVideos, PlaylistVideo } from "@/hooks/usePlaylistOperations";
import { useVideoPlayback } from "@/contexts/VideoPlaybackContext";
import { useAuth } from "@/hooks/useAuth";
import { 
  Play, Shuffle, Globe, Lock, Link, MoreVertical, Trash2, 
  GripVertical, Clock, Eye, Plus, Pencil, ExternalLink
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [playlist, setPlaylist] = useState<PlaylistWithVideos | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [addVideoOpen, setAddVideoOpen] = useState(false);
  const [editPlaylistOpen, setEditPlaylistOpen] = useState(false);
  
  const { user } = useAuth();
  const { fetchPlaylist, removeVideoFromPlaylist, reorderPlaylistVideos, loading } = usePlaylistOperations();
  const { createSession } = useVideoPlayback();

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

  // Drag and drop handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
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

  if (loading && !playlist) {
    return (
      <div className="min-h-screen bg-background">
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="pt-14 lg:pl-64">
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
        </main>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="min-h-screen bg-background">
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="pt-14 lg:pl-64">
          <div className="max-w-7xl mx-auto p-6 text-center py-20">
            <h2 className="text-2xl font-bold mb-2">Không tìm thấy danh sách phát</h2>
            <p className="text-muted-foreground">Danh sách phát này không tồn tại hoặc đã bị xóa.</p>
          </div>
        </main>
      </div>
    );
  }

  const visibilityInfo = getVisibilityInfo(playlist.is_public);
  const VisibilityIcon = visibilityInfo.icon;

  return (
    <div className="min-h-screen bg-background">
      <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <main className="pt-14 lg:pl-64">
        <div className="max-w-7xl mx-auto p-4 lg:p-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Playlist Info Card */}
            <div className="lg:w-80 lg:sticky lg:top-20 lg:self-start">
              <div className="bg-gradient-to-b from-primary/20 to-background rounded-xl p-4">
                {/* Thumbnail with edit button */}
                <div className="relative aspect-video bg-muted rounded-lg mb-4 overflow-hidden">
                  {playlist.videos[0]?.video.thumbnail_url ? (
                    <img
                      src={playlist.videos[0].video.thumbnail_url}
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

            {/* Video List */}
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
                      className={`flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors group cursor-pointer ${
                        draggedIndex === index ? "opacity-50" : ""
                      }`}
                      onClick={() => handlePlayVideo(item, index)}
                    >
                      {/* Drag Handle */}
                      {isOwner && (
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity cursor-grab flex-shrink-0">
                          <GripVertical className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}

                      {/* Index */}
                      <span className="w-5 text-center text-xs text-muted-foreground flex-shrink-0">
                        {index + 1}
                      </span>

                      {/* Thumbnail - smaller, fixed width */}
                      <div className="relative w-28 md:w-32 aspect-video rounded overflow-hidden flex-shrink-0 bg-muted">
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

                      {/* Video Info - improved layout */}
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
    </div>
  );
};

export default Playlist;
