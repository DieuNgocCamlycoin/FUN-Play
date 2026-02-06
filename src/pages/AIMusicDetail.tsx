import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAIMusicDetail } from "@/hooks/useAIMusicDetail";
import { useMusicListeners } from "@/hooks/useMusicListeners";
import { useAuth } from "@/hooks/useAuth";
import { getLightStyleGradient } from "@/lib/musicGradients";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ShareModal } from "@/components/Video/ShareModal";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  ArrowLeft, Play, Pause, Download, Share2, Music,
  Users, Heart, SkipBack, SkipForward, Loader2, Copy, FileText
} from "lucide-react";

export default function AIMusicDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: music, isLoading, error } = useAIMusicDetail(id);

  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [shareOpen, setShareOpen] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const listenerCount = useMusicListeners(id || null, true);

  const isOwner = user?.id === music?.user_id;
  const lightGradient = music ? getLightStyleGradient(music.style) : "from-white via-purple-100 to-cyan-100";

  const togglePlay = () => {
    if (!audioRef.current || !music?.audio_url) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const seekTo = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !audioDuration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    audioRef.current.currentTime = pct * audioDuration;
  };

  const handleDownload = async () => {
    if (!music) return;
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

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${String(sec).padStart(2, '0')}`;
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      if (audio.duration) setProgress((audio.currentTime / audio.duration) * 100);
    };
    const onLoadedMetadata = () => setAudioDuration(audio.duration);
    const onEnded = () => { setIsPlaying(false); setProgress(0); };
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("ended", onEnded);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-purple-100 to-cyan-100 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error || !music) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-purple-100 to-cyan-100 flex flex-col items-center justify-center gap-4">
        <Music className="w-16 h-16 text-gray-300" />
        <p className="text-gray-600">Không tìm thấy bài hát</p>
        <Button variant="outline" onClick={() => navigate(-1)}>Quay lại</Button>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${lightGradient} relative overflow-hidden`}>
      {/* Light radial overlay */}
      <div className="absolute inset-0 bg-gradient-radial from-white/60 via-white/30 to-transparent" />
      {/* Animated light glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-yellow-100/50 via-transparent to-transparent animate-light-pulse" />

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Top Bar */}
        <div className="flex items-center justify-between p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="text-gray-800 hover:bg-gray-900/10">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            {listenerCount > 0 && (
              <span className="flex items-center gap-1 text-xs text-gray-600 bg-white/50 px-2 py-1 rounded-full">
                <Users className="w-3 h-3" /> {listenerCount}
              </span>
            )}
            <Button variant="ghost" size="icon" onClick={() => setShareOpen(true)} className="text-gray-800 hover:bg-gray-900/10">
              <Share2 className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Hero / Thumbnail */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 gap-6">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-3xl overflow-hidden shadow-2xl"
          >
            {music.thumbnail_url ? (
              <img src={music.thumbnail_url} alt={music.title} className="w-full h-full object-cover" />
            ) : (
              <div className={`w-full h-full bg-gradient-to-br ${lightGradient} flex items-center justify-center`}>
                <Music className="w-20 h-20 text-gray-400" />
              </div>
            )}
            {isPlaying && (
              <div className="absolute bottom-3 right-3 flex gap-1 bg-white/30 backdrop-blur-sm rounded-full px-2 py-1">
                {[1,2,3].map(i => (
                  <motion.div key={i} className="w-1 bg-gray-700 rounded-full"
                    animate={{ height: [6, 14, 6] }}
                    transition={{ duration: 0.5, delay: i * 0.15, repeat: Infinity }} />
                ))}
              </div>
            )}
          </motion.div>

          {/* Title & Info */}
          <div className="text-center max-w-md">
            <h1 className="text-2xl font-bold text-gray-800">{music.title}</h1>
            <p className="text-gray-600 text-sm mt-1">
              {music.style} • {music.instrumental ? "Instrumental" : music.voice_type}
            </p>
            <div className="flex items-center justify-center gap-4 mt-2 text-xs text-gray-500">
              <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {music.like_count}</span>
              <span className="flex items-center gap-1"><Play className="w-3 h-3" /> {music.play_count} lượt nghe</span>
            </div>
          </div>
        </div>

        {/* Player Controls */}
        <div className="px-6 pb-8 max-w-md mx-auto w-full">
          {/* Progress */}
          <div className="mb-4">
            <div className="h-1.5 bg-gray-300 rounded-full cursor-pointer relative" onClick={seekTo}>
              <div className="h-full bg-gray-800 rounded-full transition-all" style={{ width: `${progress}%` }} />
              <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-gray-800 rounded-full shadow"
                style={{ left: `${progress}%`, transform: `translate(-50%, -50%)` }} />
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(audioDuration || music.duration || 0)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-6">
            <Button variant="ghost" size="icon" className="text-gray-800 hover:bg-gray-900/10"
              onClick={() => { if (audioRef.current) audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10); }}>
              <SkipBack className="w-5 h-5" />
            </Button>
            <Button size="icon" onClick={togglePlay}
              className="h-16 w-16 rounded-full bg-gray-900 hover:bg-gray-800 text-white shadow-lg">
              {isPlaying ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 ml-0.5" />}
            </Button>
            <Button variant="ghost" size="icon" className="text-gray-800 hover:bg-gray-900/10"
              onClick={() => { if (audioRef.current) audioRef.current.currentTime = Math.min(audioDuration, audioRef.current.currentTime + 10); }}>
              <SkipForward className="w-5 h-5" />
            </Button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-center gap-3 mt-6">
            {isOwner && (
              <Button variant="outline" size="sm" onClick={handleDownload} className="text-gray-700 border-gray-300">
                <Download className="w-4 h-4 mr-1" /> Tải về
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => setShareOpen(true)} className="text-gray-700 border-gray-300">
              <Share2 className="w-4 h-4 mr-1" /> Chia sẻ
            </Button>
          </div>
        </div>

        {/* Lyrics Section */}
        {music.lyrics && (
          <div className="px-6 pb-8 max-w-md mx-auto w-full">
            <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Lời bài hát
                </h2>
                <Button variant="ghost" size="sm" className="text-gray-500 text-xs"
                  onClick={() => { navigator.clipboard.writeText(music.lyrics || ""); toast.success("Đã copy lời bài hát"); }}>
                  <Copy className="w-3 h-3 mr-1" /> Copy
                </Button>
              </div>
              <div className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">{music.lyrics}</div>
            </div>

            {/* Reuse buttons */}
            <div className="flex gap-2 mt-4">
              <Button variant="outline" size="sm" className="text-gray-600 border-gray-300"
                onClick={() => navigate(`/create-music?style=${encodeURIComponent(music.style)}`)}>
                🎵 Tái sử dụng phong cách
              </Button>
              <Button variant="outline" size="sm" className="text-gray-600 border-gray-300"
                onClick={() => { navigator.clipboard.writeText(music.lyrics || ""); toast.success("Đã copy lời - Dán vào form tạo mới"); navigate("/create-music"); }}>
                📝 Tái sử dụng lời
              </Button>
            </div>
          </div>
        )}
      </div>

      <audio ref={audioRef} src={music.audio_url || undefined} />

      <ShareModal
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        contentType="music"
        contentId={music.id}
        contentTitle={music.title}
        thumbnailUrl={music.thumbnail_url || "/images/camly-coin.png"}
        channelName="Fun Music AI"
        userId={user?.id}
      />
    </div>
  );
}
