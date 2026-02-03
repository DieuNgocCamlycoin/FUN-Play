import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, ArrowRight, Upload, ImageIcon, Wand2 } from "lucide-react";
import { ThumbnailUpload } from "./ThumbnailUpload";
import { ThumbnailGallery } from "./ThumbnailGallery";
import { ThumbnailCanvas } from "./ThumbnailCanvas";
import { extractVideoThumbnail } from "@/lib/videoThumbnail";
import { cn } from "@/lib/utils";

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
      {/* Current Thumbnail Preview */}
      <div className="flex flex-col sm:flex-row gap-6">
        <div className="flex-shrink-0">
          <p className="text-sm font-medium mb-2">Thumbnail hiện tại</p>
          <div className="relative w-full sm:w-64 aspect-video rounded-lg overflow-hidden bg-muted border-2 border-dashed">
            {currentThumbnail ? (
              <img
                src={currentThumbnail}
                alt="Current thumbnail"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                <ImageIcon className="w-12 h-12" />
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Khuyến nghị: 1280x720 (16:9)
          </p>
        </div>

        <div className="flex-1 flex flex-col justify-center gap-3">
          <Button
            variant="outline"
            onClick={handleAutoGenerate}
            disabled={isGenerating || !videoFile}
            className="w-full sm:w-auto"
          >
            <Wand2 className={cn("w-4 h-4 mr-2", isGenerating && "animate-spin")} />
            {isGenerating ? "Đang tạo..." : "Tạo tự động từ video"}
          </Button>
          <p className="text-xs text-muted-foreground">
            Hoặc chọn từ các tùy chọn bên dưới
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upload" className="gap-2">
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">Tải lên</span>
          </TabsTrigger>
          <TabsTrigger value="gallery" className="gap-2">
            <ImageIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Kho mẫu</span>
          </TabsTrigger>
          <TabsTrigger value="editor" className="gap-2">
            <Wand2 className="w-4 h-4" />
            <span className="hidden sm:inline">Chỉnh sửa</span>
          </TabsTrigger>
        </TabsList>

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
      </Tabs>

      {/* Navigation */}
      <div className="flex justify-between pt-4 border-t">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay lại
        </Button>
        <Button onClick={onNext}>
          Tiếp tục
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
