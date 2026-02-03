import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, ImageIcon, Wand2, Sparkles, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThumbnailUpload } from "../../ThumbnailUpload";
import { ThumbnailGallery } from "../../ThumbnailGallery";
import { ThumbnailCanvas } from "../../ThumbnailCanvas";
import { extractVideoThumbnail } from "@/lib/videoThumbnail";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";

interface ThumbnailPickerProps {
  videoFile: File;
  currentThumbnail: string | null;
  onThumbnailChange: (blob: Blob, preview: string) => void;
  onBack: () => void;
}

export function ThumbnailPicker({
  videoFile,
  currentThumbnail,
  onThumbnailChange,
  onBack,
}: ThumbnailPickerProps) {
  const [activeTab, setActiveTab] = useState("upload");
  const [selectedBase, setSelectedBase] = useState<string | null>(currentThumbnail);
  const [isGenerating, setIsGenerating] = useState(false);
  const { lightTap, mediumTap } = useHapticFeedback();

  // Touch swipe state for mobile tab navigation
  const [touchStart, setTouchStart] = useState(0);
  const tabOrder = ["upload", "gallery", "editor"];

  // Handle touch swipe for tabs
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;
    const currentIndex = tabOrder.indexOf(activeTab);

    if (Math.abs(diff) > 50) {
      if (diff > 0 && currentIndex < tabOrder.length - 1) {
        setActiveTab(tabOrder[currentIndex + 1]);
        lightTap();
      } else if (diff < 0 && currentIndex > 0) {
        setActiveTab(tabOrder[currentIndex - 1]);
        lightTap();
      }
    }
  };

  // Auto-generate thumbnail from video
  const handleAutoGenerate = useCallback(async () => {
    if (!videoFile) return;

    setIsGenerating(true);
    mediumTap();

    try {
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
  }, [videoFile, onThumbnailChange, mediumTap]);

  // Handle custom upload
  const handleUpload = useCallback(
    (blob: Blob, preview: string) => {
      lightTap();
      setSelectedBase(preview);
      onThumbnailChange(blob, preview);
    },
    [onThumbnailChange, lightTap]
  );

  // Handle gallery selection
  const handleGallerySelect = useCallback(
    async (url: string) => {
      lightTap();
      try {
        const response = await fetch(url);
        const blob = await response.blob();
        const preview = URL.createObjectURL(blob);
        setSelectedBase(preview);
        onThumbnailChange(blob, preview);
      } catch (err) {
        console.error("Gallery fetch failed:", err);
      }
    },
    [onThumbnailChange, lightTap]
  );

  // Handle canvas export
  const handleCanvasExport = useCallback(
    (blob: Blob, preview: string) => {
      lightTap();
      setSelectedBase(preview);
      onThumbnailChange(blob, preview);
    },
    [onThumbnailChange, lightTap]
  );

  return (
    <div className="flex flex-col h-full">
      {/* Current Thumbnail Preview */}
      <div className="p-4 border-b border-border">
        <p className="text-sm font-semibold mb-3 flex items-center gap-2">
          <ImageIcon className="w-4 h-4" />
          Thumbnail hiện tại
        </p>
        <motion.div
          className="relative w-full aspect-video rounded-xl overflow-hidden border-2 border-dashed group"
          whileTap={{ scale: 0.98 }}
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

        {/* Auto-generate button */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleAutoGenerate}
          disabled={isGenerating}
          className={cn(
            "w-full mt-4 py-3 rounded-xl border-2 border-[hsl(var(--cosmic-cyan)/0.4)] font-medium flex items-center justify-center gap-2 transition-all min-h-[48px]",
            isGenerating
              ? "border-[hsl(var(--cosmic-magenta))] bg-[hsl(var(--cosmic-magenta)/0.1)]"
              : "hover:border-[hsl(var(--cosmic-cyan))] hover:bg-[hsl(var(--cosmic-cyan)/0.1)]"
          )}
        >
          <Wand2 className={cn("w-5 h-5", isGenerating && "animate-spin")} />
          {isGenerating ? (
            <span className="flex items-center gap-2">
              Đang tạo
              <Sparkles className="w-4 h-4 text-[hsl(var(--cosmic-gold))]" />
            </span>
          ) : (
            "Tạo tự động từ video"
          )}
        </motion.button>
      </div>

      {/* Tabs */}
      <div
        className="flex-1 overflow-y-auto"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-3 h-12 p-1 bg-muted/50 rounded-none border-b border-border">
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
              className="flex-1 p-4"
            >
              <TabsContent value="upload" className="mt-0 h-full">
                <ThumbnailUpload onUpload={handleUpload} />
              </TabsContent>

              <TabsContent value="gallery" className="mt-0 h-full">
                <ThumbnailGallery onSelect={handleGallerySelect} />
              </TabsContent>

              <TabsContent value="editor" className="mt-0 h-full">
                <ThumbnailCanvas baseImage={selectedBase} onExport={handleCanvasExport} />
              </TabsContent>
            </motion.div>
          </AnimatePresence>
        </Tabs>
      </div>

      {/* Save Button */}
      <div className="p-4 border-t border-border bg-background sticky bottom-0">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            mediumTap();
            onBack();
          }}
          className="w-full py-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 min-h-[56px] bg-gradient-to-r from-[hsl(var(--cosmic-cyan))] to-[hsl(var(--cosmic-magenta))] shadow-lg"
        >
          <Check className="w-5 h-5" />
          Xong
        </motion.button>
      </div>
    </div>
  );
}
