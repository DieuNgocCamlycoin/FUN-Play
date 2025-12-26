import { useState, useRef, useEffect } from "react";
import { Header } from "@/components/Layout/Header";
import { Sidebar } from "@/components/Layout/Sidebar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { 
  Music, 
  Sparkles, 
  Play, 
  Pause, 
  Download, 
  Share2, 
  Wand2,
  Clock,
  Loader2,
  Volume2,
  SkipBack,
  SkipForward,
  Music2,
  Mic,
  Guitar,
  Drum
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ShareModal } from "@/components/Video/ShareModal";

interface GeneratedSong {
  id: string;
  prompt: string;
  audioUrl: string;
  createdAt: Date;
  duration: number;
}

const genrePresets = [
  { label: "Healing Mantra", prompt: "Peaceful healing mantra with crystal singing bowls and gentle chimes, meditative and calming" },
  { label: "5D Pop Love", prompt: "Uplifting pop song about love and abundance, positive energy, catchy melody, modern production" },
  { label: "Epic Orchestral", prompt: "Epic orchestral anthem with triumphant brass, sweeping strings, powerful drums, cinematic" },
  { label: "Lo-fi Chill", prompt: "Relaxing lo-fi hip hop beat with warm piano, vinyl crackle, jazzy chords, study music" },
  { label: "EDM Energy", prompt: "High energy EDM track with powerful drops, synth leads, driving bass, festival vibes" },
  { label: "Acoustic Folk", prompt: "Warm acoustic folk song with fingerpicked guitar, gentle vocals, nature sounds" },
  { label: "R&B Soul", prompt: "Smooth R&B soul track with silky vocals, groovy bass, romantic mood" },
  { label: "Cinematic Ambient", prompt: "Atmospheric ambient soundscape with ethereal pads, distant piano, space sounds" },
];

export default function CreateMusic() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [duration, setDuration] = useState(30);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSongs, setGeneratedSongs] = useState<GeneratedSong[]>([]);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [volume, setVolume] = useState(80);
  const [progress, setProgress] = useState(0);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [songToShare, setSongToShare] = useState<GeneratedSong | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { user } = useAuth();

  // Floating particles effect
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    delay: Math.random() * 5,
    duration: 3 + Math.random() * 4,
  }));

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Vui lòng nhập mô tả bài hát");
      return;
    }

    if (!user) {
      toast.error("Vui lòng đăng nhập để tạo nhạc");
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-music", {
        body: { prompt, duration },
      });

      if (error) throw error;

      if (data?.audio) {
        // Convert base64 to blob URL
        const byteCharacters = atob(data.audio);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: "audio/mpeg" });
        const audioUrl = URL.createObjectURL(blob);

        const newSong: GeneratedSong = {
          id: Date.now().toString(),
          prompt,
          audioUrl,
          createdAt: new Date(),
          duration,
        };

        setGeneratedSongs((prev) => [newSong, ...prev]);
        toast.success("✨ Nhạc ánh sáng của bạn đã được tạo!");
        
        // Auto-play the new song
        setCurrentlyPlaying(newSong.id);
        if (audioRef.current) {
          audioRef.current.src = audioUrl;
          audioRef.current.play();
        }
      }
    } catch (error) {
      console.error("Error generating music:", error);
      toast.error("Không thể tạo nhạc. Vui lòng thử lại.");
    } finally {
      setIsGenerating(false);
    }
  };

  const togglePlay = (songId: string, audioUrl: string) => {
    if (currentlyPlaying === songId) {
      audioRef.current?.pause();
      setCurrentlyPlaying(null);
    } else {
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.play();
      }
      setCurrentlyPlaying(songId);
    }
  };

  const handleDownload = (audioUrl: string, prompt: string) => {
    const a = document.createElement("a");
    a.href = audioUrl;
    a.download = `light-music-${prompt.slice(0, 20).replace(/\s+/g, "-")}.mp3`;
    a.click();
    toast.success("Đang tải nhạc xuống...");
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateProgress = () => {
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100);
      }
    };

    audio.addEventListener("timeupdate", updateProgress);
    audio.addEventListener("ended", () => setCurrentlyPlaying(null));

    return () => {
      audio.removeEventListener("timeupdate", updateProgress);
      audio.removeEventListener("ended", () => setCurrentlyPlaying(null));
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-cyan-50/30 to-amber-50/30 relative overflow-hidden">
      {/* Floating particles */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute w-2 h-2 rounded-full bg-gradient-to-r from-cyan-400 to-amber-400"
            style={{ left: `${particle.x}%`, top: `${particle.y}%` }}
            animate={{
              y: [0, -100, 0],
              opacity: [0.2, 0.8, 0.2],
              scale: [0.5, 1, 0.5],
            }}
            transition={{
              duration: particle.duration,
              delay: particle.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Twinkling stars */}
      <div className="fixed inset-0 pointer-events-none">
        {Array.from({ length: 30 }).map((_, i) => (
          <motion.div
            key={`star-${i}`}
            className="absolute w-1 h-1 bg-amber-300 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0.5, 1.5, 0.5],
            }}
            transition={{
              duration: 2 + Math.random() * 2,
              delay: Math.random() * 3,
              repeat: Infinity,
            }}
          />
        ))}
      </div>

      <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="pt-14 lg:pl-64">
        <div className="max-w-6xl mx-auto p-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="relative">
                <Music className="w-12 h-12 text-cyan-500" />
                <motion.div
                  className="absolute -top-1 -right-1"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                >
                  <Sparkles className="w-5 h-5 text-amber-400" />
                </motion.div>
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-500 via-purple-500 to-amber-500 bg-clip-text text-transparent">
                Tạo Nhạc Ánh Sáng
              </h1>
            </div>
            <p className="text-muted-foreground text-lg">
              Biến ý tưởng của bạn thành âm nhạc thần kỳ với AI ✨
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Create Section */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-cyan-100"
            >
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Wand2 className="w-5 h-5 text-purple-500" />
                Mô tả bài hát của bạn
              </h2>

              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ví dụ: Bài hát pop sôi động về tình yêu và hy vọng, với giai điệu vui tươi và năng lượng tích cực..."
                className="min-h-[120px] mb-4 border-cyan-200 focus:border-cyan-400"
              />

              {/* Genre Presets */}
              <div className="mb-4">
                <p className="text-sm text-muted-foreground mb-2">Hoặc chọn phong cách:</p>
                <div className="flex flex-wrap gap-2">
                  {genrePresets.map((preset) => (
                    <Button
                      key={preset.label}
                      variant="outline"
                      size="sm"
                      onClick={() => setPrompt(preset.prompt)}
                      className="text-xs border-cyan-200 hover:bg-cyan-50 hover:border-cyan-400"
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Duration Slider */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Thời lượng
                  </span>
                  <span className="text-sm font-medium">{duration} giây</span>
                </div>
                <Slider
                  value={[duration]}
                  onValueChange={([val]) => setDuration(val)}
                  min={15}
                  max={60}
                  step={5}
                  className="w-full"
                />
              </div>

              {/* Generate Button */}
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
                className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-cyan-500 via-purple-500 to-amber-500 hover:from-cyan-600 hover:via-purple-600 hover:to-amber-600 shadow-lg shadow-purple-500/30"
              >
                {isGenerating ? (
                  <motion.div className="flex items-center gap-3">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span>Đang tạo nhạc thần kỳ...</span>
                    <motion.div
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 0.5, repeat: Infinity }}
                    >
                      ✨
                    </motion.div>
                  </motion.div>
                ) : (
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    Tạo Nhạc Ánh Sáng
                  </span>
                )}
              </Button>

              {/* Features Icons */}
              <div className="mt-6 flex justify-center gap-8 text-muted-foreground">
                <div className="flex flex-col items-center gap-1">
                  <Mic className="w-6 h-6 text-cyan-500" />
                  <span className="text-xs">Vocals</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <Guitar className="w-6 h-6 text-purple-500" />
                  <span className="text-xs">Instruments</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <Drum className="w-6 h-6 text-amber-500" />
                  <span className="text-xs">Beats</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <Music2 className="w-6 h-6 text-pink-500" />
                  <span className="text-xs">Melody</span>
                </div>
              </div>
            </motion.div>

            {/* Generated Songs */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-amber-100"
            >
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Music className="w-5 h-5 text-amber-500" />
                Nhạc đã tạo ({generatedSongs.length})
              </h2>

              {generatedSongs.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Music className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p>Chưa có bài hát nào</p>
                  <p className="text-sm">Hãy tạo bài hát đầu tiên của bạn!</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[500px] overflow-y-auto">
                  <AnimatePresence>
                    {generatedSongs.map((song) => (
                      <motion.div
                        key={song.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className={`p-4 rounded-xl border transition-all ${
                          currentlyPlaying === song.id
                            ? "bg-gradient-to-r from-cyan-50 to-amber-50 border-cyan-300 shadow-lg"
                            : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          {/* Play Button */}
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => togglePlay(song.id, song.audioUrl)}
                            className={`h-12 w-12 rounded-full shrink-0 ${
                              currentlyPlaying === song.id
                                ? "bg-gradient-to-r from-cyan-500 to-amber-500 text-white"
                                : "bg-gray-200 hover:bg-gray-300"
                            }`}
                          >
                            {currentlyPlaying === song.id ? (
                              <Pause className="w-5 h-5" />
                            ) : (
                              <Play className="w-5 h-5 ml-0.5" />
                            )}
                          </Button>

                          {/* Song Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium line-clamp-2 mb-1">
                              {song.prompt}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {song.duration}s • {song.createdAt.toLocaleTimeString()}
                            </p>
                            
                            {/* Progress Bar */}
                            {currentlyPlaying === song.id && (
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="mt-2 h-1 bg-gray-200 rounded-full overflow-hidden"
                              >
                                <div
                                  className="h-full bg-gradient-to-r from-cyan-500 to-amber-500"
                                  style={{ width: `${progress}%` }}
                                />
                              </motion.div>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleDownload(song.audioUrl, song.prompt)}
                              className="h-9 w-9"
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => {
                                setSongToShare(song);
                                setShareModalOpen(true);
                              }}
                              className="h-9 w-9"
                            >
                              <Share2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          </div>

          {/* Volume Control (Fixed Bottom) */}
          {currentlyPlaying && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-sm rounded-full px-6 py-3 shadow-2xl border border-cyan-200 flex items-center gap-4 z-50"
            >
              <Volume2 className="w-5 h-5 text-cyan-500" />
              <Slider
                value={[volume]}
                onValueChange={([val]) => setVolume(val)}
                max={100}
                className="w-32"
              />
              <span className="text-sm text-muted-foreground w-8">{volume}%</span>
            </motion.div>
          )}

          {/* Hidden Audio Element */}
          <audio ref={audioRef} />

          {/* Share Modal */}
          <ShareModal
            isOpen={shareModalOpen}
            onClose={() => setShareModalOpen(false)}
            contentId={songToShare?.id || ""}
            contentTitle={songToShare?.prompt || "Nhạc AI"}
            contentType="music"
            userId={user?.id}
          />
        </div>
      </main>
    </div>
  );
}
