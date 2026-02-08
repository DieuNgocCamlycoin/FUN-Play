import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Layout/Header";
import { Sidebar } from "@/components/Layout/Sidebar";
import { useAIMusic, AIMusic } from "@/hooks/useAIMusic";
import { useAuth } from "@/hooks/useAuth";
import { useMusicListeners } from "@/hooks/useMusicListeners";
import { getStyleGradient } from "@/lib/musicGradients";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Music, Play, Pause, Download, Trash2, Eye, EyeOff,
  Loader2, FileText, Users, X, Plus, Clock, AlertCircle, CheckCircle2
} from "lucide-react";

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "completed":
      return <span className="flex items-center gap-1 text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded-full"><CheckCircle2 className="w-3 h-3" /> Hoàn thành</span>;
    case "processing":
      return <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full"><Loader2 className="w-3 h-3 animate-spin" /> Đang tạo</span>;
    case "pending":
      return <span className="flex items-center gap-1 text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full"><Clock className="w-3 h-3" /> Chờ xử lý</span>;
    case "failed":
      return <span className="flex items-center gap-1 text-xs text-red-600 bg-red-100 px-2 py-0.5 rounded-full"><AlertCircle className="w-3 h-3" /> Thất bại</span>;
    default:
      return null;
  }
}

function LyricsModal({
  music, isOpen, onClose, isPlaying, onPlay
}: {
  music: AIMusic; isOpen: boolean; onClose: () => void; isPlaying: boolean; onPlay: () => void;
}) {
  const gradient = getStyleGradient(music.style);
  const listenerCount = useMusicListeners(music.id, isOpen);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`max-w-lg max-h-[85vh] p-0 overflow-hidden border-0 [&>button]:hidden bg-gradient-to-br ${gradient}`}>
        <Button size="icon" variant="ghost" onClick={() => onClose()}
          className="absolute top-3 right-3 z-10 h-10 w-10 rounded-full bg-black/30 hover:bg-black/50 text-white">
          <X className="w-5 h-5" />
        </Button>
        <div className="relative p-6 text-white">
          {music.thumbnail_url && (
            <div className="absolute inset-0 bg-cover bg-center opacity-30" style={{ backgroundImage: `url(${music.thumbnail_url})` }} />
          )}
          <div className="relative z-10">
            <DialogHeader>
              <div className="flex items-center gap-4">
                <Button size="icon" variant="secondary" onClick={onPlay}
                  className="h-16 w-16 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm border-2 border-white/30">
                  {isPlaying ? <Pause className="w-7 h-7 text-white" /> : <Play className="w-7 h-7 text-white ml-0.5" />}
                </Button>
                <div>
                  <DialogTitle className="text-2xl font-bold text-white drop-shadow-md">{music.title}</DialogTitle>
                  <p className="text-white/90 text-sm mt-1">{music.style} • {music.instrumental ? "Instrumental" : music.voice_type}</p>
                  {music.duration && <p className="text-white/70 text-xs mt-1">{Math.floor(music.duration / 60)}:{String(music.duration % 60).padStart(2, '0')}</p>}
                  {listenerCount > 0 && <p className="text-white/80 text-xs mt-1 flex items-center gap-1"><Users className="w-3 h-3" />{listenerCount} người đang nghe</p>}
                </div>
              </div>
            </DialogHeader>
          </div>
        </div>
        <ScrollArea className="max-h-[55vh] mx-4 mb-4 rounded-xl bg-white/10 backdrop-blur-sm">
          {music.lyrics ? (
            <div className="p-4 whitespace-pre-wrap text-sm leading-relaxed text-white/90 font-medium">{music.lyrics}</div>
          ) : (
            <div className="text-center py-8 text-white/80">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">Bài hát này không có lời</p>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

export default function MyAIMusic() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { myMusic, isLoadingMyMusic, deleteMusic, togglePublic, incrementPlayCount } = useAIMusic();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [lyricsMusic, setLyricsMusic] = useState<AIMusic | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePlay = (music: AIMusic) => {
    if (!music.audio_url) return;
    if (currentlyPlaying === music.id) {
      audioRef.current?.pause();
      setCurrentlyPlaying(null);
    } else {
      if (audioRef.current) {
        audioRef.current.src = music.audio_url;
        audioRef.current.play();
      }
      setCurrentlyPlaying(music.id);
      incrementPlayCount(music.id);
    }
  };

  const handleDownload = async (music: AIMusic) => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) { toast.error("Vui lòng đăng nhập"); return; }

      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/download-ai-music?musicId=${music.id}`;
      const resp = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!resp.ok) throw new Error("Download failed");

      const blob = await resp.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${music.title}.mp3`;
      a.click();
      URL.revokeObjectURL(a.href);
      toast.success("Đang tải nhạc xuống...");
    } catch {
      toast.error("Không thể tải nhạc");
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onEnded = () => setCurrentlyPlaying(null);
    audio.addEventListener("ended", onEnded);
    return () => audio.removeEventListener("ended", onEnded);
  }, []);

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="pt-12 lg:pt-14 lg:pl-64 flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <Music className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-muted-foreground">Vui lòng đăng nhập để xem nhạc AI của bạn</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="pt-12 lg:pt-14 lg:pl-64">
        <div className="max-w-6xl mx-auto p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Music className="w-7 h-7 text-primary" />
                Nhạc AI của tôi
              </h1>
              <p className="text-sm text-muted-foreground mt-1">{myMusic?.length || 0} bài hát</p>
            </div>
            <Button onClick={() => navigate("/create-music")} className="bg-gradient-to-r from-amber-500 to-pink-500 text-white">
              <Plus className="w-4 h-4 mr-2" /> Tạo mới
            </Button>
          </div>

          {isLoadingMyMusic ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-64 rounded-xl" />
              ))}
            </div>
          ) : !myMusic?.length ? (
            <div className="text-center py-20">
              <Music className="w-20 h-20 mx-auto mb-4 text-muted-foreground/20" />
              <p className="text-lg font-medium text-muted-foreground">Chưa có bài hát nào</p>
              <p className="text-sm text-muted-foreground mt-1">Hãy tạo bài hát đầu tiên!</p>
              <Button onClick={() => navigate("/create-music")} className="mt-4">Tạo nhạc ngay</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence>
                {myMusic.map((music) => {
                  const gradient = getStyleGradient(music.style);
                  const isPlaying = currentlyPlaying === music.id;

                  return (
                    <motion.div
                      key={music.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="bg-card rounded-xl border shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => music.status === "completed" && navigate(`/ai-music/${music.id}`)}
                    >
                      {/* Thumbnail */}
                      <div className={`relative h-36 bg-gradient-to-br ${gradient} flex items-center justify-center`}>
                        {music.thumbnail_url ? (
                          <img src={music.thumbnail_url} alt={music.title} className="w-full h-full object-cover" />
                        ) : (
                          <Music className="w-12 h-12 text-white/50" />
                        )}
                        
                        {/* Status */}
                        <div className="absolute top-2 left-2"><StatusBadge status={music.status} /></div>

                        {/* Play button overlay */}
                        {music.status === "completed" && music.audio_url && (
                          <Button size="icon" variant="ghost"
                            onClick={(e) => { e.stopPropagation(); togglePlay(music); }}
                            className={`absolute inset-0 m-auto h-14 w-14 rounded-full ${isPlaying ? "bg-white/30" : "bg-black/30 hover:bg-black/50"} text-white`}
                          >
                            {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
                          </Button>
                        )}

                        {isPlaying && (
                          <div className="absolute bottom-2 right-2 flex gap-0.5">
                            {[1,2,3].map(i => (
                              <motion.div key={i} className="w-1 bg-white rounded-full"
                                animate={{ height: [8, 16, 8] }}
                                transition={{ duration: 0.5, delay: i * 0.15, repeat: Infinity }} />
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="p-3">
                        <h3 className="font-semibold text-sm line-clamp-1">{music.title}</h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          {music.style} • {music.instrumental ? "Instrumental" : music.voice_type}
                          {music.duration && ` • ${Math.floor(music.duration / 60)}:${String(music.duration % 60).padStart(2, '0')}`}
                        </p>

                        {music.status === "failed" && music.error_message && (
                          <p className="text-xs text-destructive mt-1 line-clamp-2">{music.error_message}</p>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-1 mt-3">
                          {music.lyrics && (
                            <Button size="icon" variant="ghost" className="h-8 w-8"
                              onClick={(e) => { e.stopPropagation(); setLyricsMusic(music); }}>
                              <FileText className="w-4 h-4" />
                            </Button>
                          )}
                          {music.status === "completed" && (
                            <Button size="icon" variant="ghost" className="h-8 w-8"
                              onClick={(e) => { e.stopPropagation(); handleDownload(music); }}>
                              <Download className="w-4 h-4" />
                            </Button>
                          )}
                          <Button size="icon" variant="ghost" className="h-8 w-8"
                            onClick={(e) => { e.stopPropagation(); togglePublic({ musicId: music.id, isPublic: !music.is_public }); }}>
                            {music.is_public ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                          </Button>
                          <div className="flex-1" />
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={(e) => e.stopPropagation()}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Xóa bài hát?</AlertDialogTitle>
                                <AlertDialogDescription>Bạn có chắc muốn xóa "{music.title}"? Hành động này không thể hoàn tác.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Hủy</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteMusic(music.id)} className="bg-destructive text-destructive-foreground">Xóa</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </main>

      <audio ref={audioRef} />

      {lyricsMusic && (
        <LyricsModal
          music={lyricsMusic}
          isOpen={!!lyricsMusic}
          onClose={() => setLyricsMusic(null)}
          isPlaying={currentlyPlaying === lyricsMusic.id}
          onPlay={() => togglePlay(lyricsMusic)}
        />
      )}
    </div>
  );
}
