import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, ArrowRight, Upload, ImageIcon, Wand2, Sparkles } from "lucide-react";
import { ThumbnailUpload } from "./ThumbnailUpload";
import { ThumbnailGallery } from "./ThumbnailGallery";
import { ThumbnailCanvas } from "./ThumbnailCanvas";
import { extractVideoThumbnail } from "@/lib/videoThumbnail";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface ThumbnailEditorProps {
  videoFile: File | null;
  currentThumbnail: string | null;
  onThumbnailChange: (blob: Blob, preview: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export function ThumbnailEditor({
  videoFile,
  currentThumbnail,
  onThumbnailChange,
  onNext,
  onBack,
}: ThumbnailEditorProps) {
  const [activeTab, setActiveTab] = useState("upload");
  const [selectedBase, setSelectedBase] = useState<string | null>(currentThumbnail);
  const [isGenerating, setIsGenerating] = useState(false);

  // Auto-generate thumbnail from video at different timestamps
  const handleAutoGenerate = useCallback(async () => {
    if (!videoFile) return;
    
    setIsGenerating(true);
    try {
      // Try different positions: 25%, 50%, 75%
      const positions = [0.25, 0.5, 0.75];
      for (const pos of positions) {
        const blob = await extractVideoThumbnail(videoFile, pos);
        if (blob) {
          const preview = URL.createObjectURL(blob);
          setSelectedBase(preview);
          onThumbnailChange(blob, preview);
          break;
        }
      }
    } catch (err) {
      console.error("Auto-generate failed:", err);
    } finally {
      setIsGenerating(false);
    }
  }, [videoFile, onThumbnailChange]);

  // Handle custom upload
  const handleUpload = useCallback((blob: Blob, preview: string) => {
    setSelectedBase(preview);
    onThumbnailChange(blob, preview);
  }, [onThumbnailChange]);

  // Handle gallery selection
  const handleGallerySelect = useCallback(async (url: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const preview = URL.createObjectURL(blob);
      setSelectedBase(preview);
      onThumbnailChange(blob, preview);
    } catch (err) {
      console.error("Gallery fetch failed:", err);
    }
  }, [onThumbnailChange]);

  // Handle canvas export
  const handleCanvasExport = useCallback((blob: Blob, preview: string) => {
    setSelectedBase(preview);
    onThumbnailChange(blob, preview);
  }, [onThumbnailChange]);

  return (
    <div className="space-y-6">
      {/* Current Thumbnail Preview with holographic border */}
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
        <div className="flex-shrink-0">
          <p className="text-sm font-semibold mb-2 flex items-center gap-2">
            <ImageIcon className="w-4 h-4" />
            Thumbnail hiện tại
          </p>
          <motion.div 
            className="relative w-full sm:w-64 aspect-video rounded-xl overflow-hidden border-2 border-dashed group"
            whileHover={{ scale: 1.02 }}
          >
            {/* Holographic border effect */}
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[hsl(var(--cosmic-cyan))] via-[hsl(var(--cosmic-magenta))] to-[hsl(var(--cosmic-gold))] opacity-0 group-hover:opacity-50 transition-opacity -z-10 blur-sm" />
            
            {currentThumbnail ? (
              <img
                src={currentThumbnail}
                alt="Current thumbnail"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground">
                <ImageIcon className="w-12 h-12" />
              </div>
            )}
          </motion.div>
          <p className="text-xs text-muted-foreground mt-2">
            Khuyến nghị: 1280x720 (16:9)
          </p>
        </div>

        <div className="flex-1 flex flex-col justify-center gap-4">
          {/* Auto-generate button with shimmer effect */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              variant="outline"
              onClick={handleAutoGenerate}
              disabled={isGenerating || !videoFile}
              className={cn(
                "w-full sm:w-auto min-h-[52px] relative overflow-hidden border-2 border-[hsl(var(--cosmic-cyan)/0.4)] hover:border-[hsl(var(--cosmic-cyan))] hover:bg-[hsl(var(--cosmic-cyan)/0.1)] transition-all",
                isGenerating && "border-[hsl(var(--cosmic-magenta))]"
              )}
            >
              {/* Shimmer effect when generating */}
              {isGenerating && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[hsl(var(--cosmic-cyan)/0.3)] to-transparent animate-shimmer" />
              )}
              <Wand2 className={cn("w-5 h-5 mr-2", isGenerating && "animate-spin")} />
              {isGenerating ? (
                <span className="flex items-center gap-2">
                  Đang tạo
                  <Sparkles className="w-4 h-4 text-[hsl(var(--cosmic-gold))]" />
                </span>
              ) : (
                "Tạo tự động từ video"
              )}
            </Button>
          </motion.div>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            Hoặc chọn từ các tùy chọn bên dưới
          </p>
        </div>
      </div>

      {/* Tabs - with touch-friendly swipe support */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 h-12 p-1 bg-muted/50">
          <TabsTrigger 
            value="upload" 
            className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[hsl(var(--cosmic-cyan)/0.2)] data-[state=active]:to-[hsl(var(--cosmic-magenta)/0.2)] data-[state=active]:text-foreground min-h-[40px]"
          >
            <Upload className="w-4 h-4" />
            <span className="hidden xs:inline sm:inline">Tải lên</span>
          </TabsTrigger>
          <TabsTrigger 
            value="gallery" 
            className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[hsl(var(--cosmic-cyan)/0.2)] data-[state=active]:to-[hsl(var(--cosmic-magenta)/0.2)] data-[state=active]:text-foreground min-h-[40px]"
          >
            <ImageIcon className="w-4 h-4" />
            <span className="hidden xs:inline sm:inline">Kho mẫu</span>
          </TabsTrigger>
          <TabsTrigger 
            value="editor" 
            className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[hsl(var(--cosmic-cyan)/0.2)] data-[state=active]:to-[hsl(var(--cosmic-magenta)/0.2)] data-[state=active]:text-foreground min-h-[40px]"
          >
            <Wand2 className="w-4 h-4" />
            <span className="hidden xs:inline sm:inline">Chỉnh sửa</span>
          </TabsTrigger>
        </TabsList>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <TabsContent value="upload" className="mt-4">
              <ThumbnailUpload onUpload={handleUpload} />
            </TabsContent>

            <TabsContent value="gallery" className="mt-4">
              <ThumbnailGallery onSelect={handleGallerySelect} />
            </TabsContent>

            <TabsContent value="editor" className="mt-4">
              <ThumbnailCanvas
                baseImage={selectedBase}
                onExport={handleCanvasExport}
              />
            </TabsContent>
          </motion.div>
        </AnimatePresence>
      </Tabs>

      {/* Navigation */}
      <div className="flex justify-between pt-4 border-t border-border/50">
        <Button variant="ghost" onClick={onBack} className="gap-2 min-h-[48px]">
          <ArrowLeft className="w-4 h-4" />
          Quay lại
        </Button>
        <Button 
          onClick={onNext}
          className="gap-2 min-h-[48px] bg-gradient-to-r from-[hsl(var(--cosmic-cyan))] to-[hsl(var(--cosmic-magenta))] hover:from-[hsl(var(--cosmic-cyan)/0.9)] hover:to-[hsl(var(--cosmic-magenta)/0.9)] text-white shadow-lg"
        >
          Tiếp tục
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
