import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useAIMusic } from "@/hooks/useAIMusic";
import { Loader2, Sparkles, Music, Star, Wand2 } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

const METATAG_HINTS = [
  { tag: "[Verse]", desc: "Đoạn hát chính" },
  { tag: "[Chorus]", desc: "Điệp khúc" },
  { tag: "[Bridge]", desc: "Đoạn chuyển" },
  { tag: "[Outro]", desc: "Kết thúc" },
  { tag: "[Intro]", desc: "Mở đầu" },
];

export function SunoModeForm() {
  const { createSunoMusic, isCreatingSuno, generateLyrics, isGeneratingLyrics } = useAIMusic();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [prompt, setPrompt] = useState("");
  const [lyrics, setLyrics] = useState("");
  const [style, setStyle] = useState("");
  const [instrumental, setInstrumental] = useState(false);
  const [isPublic, setIsPublic] = useState(false);

  const handleGenerateLyrics = async () => {
    if (!prompt.trim()) {
      toast.error("Vui lòng nhập mô tả bài hát trước");
      return;
    }
    try {
      const generatedLyrics = await generateLyrics({
        description: prompt,
        style: style,
        title: title || "Không có tiêu đề",
      });
      setLyrics(generatedLyrics);
      toast.success("🎵 Đã tạo lời bài hát!");
    } catch (error) {
      console.error("Error generating lyrics:", error);
      toast.error("Không thể tạo lời. Vui lòng thử lại.");
    }
  };

  const insertMetatag = (tag: string) => {
    setLyrics(prev => prev + (prev ? "\n" : "") + tag + "\n");
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error("Vui lòng nhập tên bài hát");
      return;
    }
    if (!prompt.trim() && !lyrics.trim()) {
      toast.error("Vui lòng nhập mô tả hoặc lời bài hát");
      return;
    }
    try {
      await createSunoMusic({
        title: title.trim(),
        prompt: prompt.trim() || undefined,
        lyrics: lyrics.trim() || undefined,
        style,
        instrumental,
        is_public: isPublic,
      });
      setTitle("");
      setPrompt("");
      setLyrics("");
      setStyle("");
      setInstrumental(false);
      setIsPublic(false);
      navigate("/my-ai-music");
    } catch (error) {
      console.error("Error creating Suno music:", error);
    }
  };

  const isLoading = isCreatingSuno || isGeneratingLyrics;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="space-y-2">
        <Label htmlFor="suno-title" className="flex items-center gap-2">
          <Star className="w-4 h-4 text-amber-500" />
          Tên bài hát
        </Label>
        <Input
          id="suno-title"
          placeholder="Nhập tên bài hát"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="suno-prompt" className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-500" />
          Mô tả bài hát
        </Label>
        <Textarea
          id="suno-prompt"
          placeholder="Mô tả ngắn gọn về bài hát bạn muốn tạo"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={isLoading}
          className="min-h-[80px]"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="suno-style" className="flex items-center gap-2">
          <Music className="w-4 h-4 text-cyan-500" />
          Phong cách nhạc
        </Label>
        <Input
          id="suno-style"
          placeholder="Ví dụ: Pop, Ballad, V-Pop, EDM..."
          value={style}
          onChange={(e) => setStyle(e.target.value)}
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="suno-lyrics">📝 Lời bài hát (tùy chọn)</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleGenerateLyrics}
            disabled={isLoading || !prompt.trim()}
          >
            {isGeneratingLyrics ? (
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            ) : (
              <Wand2 className="w-3 h-3 mr-1" />
            )}
            AI tạo lời
          </Button>
        </div>
        
        <div className="flex flex-wrap gap-1 mb-2">
          {METATAG_HINTS.map((hint) => (
            <button
              key={hint.tag}
              type="button"
              onClick={() => insertMetatag(hint.tag)}
              disabled={isLoading}
              className="text-xs px-2 py-1 bg-muted hover:bg-muted/80 rounded-full transition-colors"
              title={hint.desc}
            >
              {hint.tag}
            </button>
          ))}
        </div>
        
        <Textarea
          id="suno-lyrics"
          placeholder={`[Verse]\nViết lời bài hát...\n\n[Chorus]\nĐiệp khúc...`}
          value={lyrics}
          onChange={(e) => setLyrics(e.target.value)}
          disabled={isLoading}
          className="min-h-[150px] font-mono text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center justify-between p-3 bg-purple-50 rounded-xl">
          <Label htmlFor="suno-instrumental" className="text-sm cursor-pointer">
            🎵 Instrumental
          </Label>
          <Switch
            id="suno-instrumental"
            checked={instrumental}
            onCheckedChange={setInstrumental}
            disabled={isLoading}
          />
        </div>

        <div className="flex items-center justify-between p-3 bg-cyan-50 rounded-xl">
          <Label htmlFor="suno-public" className="text-sm cursor-pointer">
            🌍 Công khai
          </Label>
          <Switch
            id="suno-public"
            checked={isPublic}
            onCheckedChange={setIsPublic}
            disabled={isLoading}
          />
        </div>
      </div>

      <Button
        type="button"
        onClick={handleSubmit}
        disabled={isLoading || !title.trim() || (!prompt.trim() && !lyrics.trim())}
        className="w-full h-12 bg-gradient-to-r from-amber-500 via-orange-500 to-pink-500 hover:from-amber-600 hover:via-orange-600 hover:to-pink-600 text-white font-semibold"
      >
        {isCreatingSuno ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Đang tạo bài hát...
          </>
        ) : (
          <>
            <Star className="w-5 h-5 mr-2" />
            Tạo bài hát với Fun Music AI
          </>
        )}
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        ⏱️ Thời gian tạo: 1-3 phút • 🎵 Bài hát có thể dài đến 4 phút
      </p>
    </motion.div>
  );
}
