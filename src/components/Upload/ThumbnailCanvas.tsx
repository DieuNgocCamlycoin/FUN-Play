import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { AlignLeft, AlignCenter, AlignRight, Type, Download, RotateCcw, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface ThumbnailCanvasProps {
  baseImage: string | null;
  onExport: (blob: Blob, preview: string) => void;
}

const FONTS = [
  { value: "Inter", label: "Inter" },
  { value: "Roboto", label: "Roboto" },
  { value: "Montserrat", label: "Montserrat" },
  { value: "Playfair Display", label: "Playfair" },
  { value: "Oswald", label: "Oswald" },
  { value: "Poppins", label: "Poppins" },
  { value: "Lato", label: "Lato" },
];

// Rainbow color palette
const COLORS = [
  "#FFFFFF", "#000000", 
  "#FF0000", "#FF7F00", "#FFFF00", "#00FF00", "#0000FF", "#4B0082", "#9400D3",
  "#00E7FF", "#FF00E5", "#FFD700", "#7A2BFF",
];

export function ThumbnailCanvas({ baseImage, onExport }: ThumbnailCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [text, setText] = useState("");
  const [font, setFont] = useState("Inter");
  const [fontSize, setFontSize] = useState(48);
  const [color, setColor] = useState("#FFFFFF");
  const [align, setAlign] = useState<"left" | "center" | "right">("center");
  const [showStroke, setShowStroke] = useState(true);
  const [textPosition, setTextPosition] = useState({ x: 0.5, y: 0.5 }); // Normalized 0-1
  const [isDragging, setIsDragging] = useState(false);

  // Draw canvas
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background
    if (baseImage) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        // Cover fit
        const ratio = Math.max(canvas.width / img.width, canvas.height / img.height);
        const newWidth = img.width * ratio;
        const newHeight = img.height * ratio;
        const x = (canvas.width - newWidth) / 2;
        const y = (canvas.height - newHeight) / 2;

        ctx.drawImage(img, x, y, newWidth, newHeight);

        // Draw text overlay
        drawText(ctx, canvas);
      };
      img.src = baseImage;
    } else {
      // Aurora gradient background
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, "#00E7FF");
      gradient.addColorStop(0.33, "#7A2BFF");
      gradient.addColorStop(0.66, "#FF00E5");
      gradient.addColorStop(1, "#FFD700");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      drawText(ctx, canvas);
    }
  }, [baseImage, text, font, fontSize, color, align, showStroke, textPosition]);

  const drawText = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    if (!text.trim()) return;

    ctx.font = `bold ${fontSize}px ${font}`;
    ctx.textBaseline = "middle";

    // Calculate position based on textPosition and align
    let x = canvas.width * textPosition.x;
    if (align === "left") {
      ctx.textAlign = "left";
      x = Math.max(60, x - 200);
    } else if (align === "right") {
      ctx.textAlign = "right";
      x = Math.min(canvas.width - 60, x + 200);
    } else {
      ctx.textAlign = "center";
    }

    const y = canvas.height * textPosition.y;

    // Stroke (outline)
    if (showStroke) {
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = fontSize / 8;
      ctx.lineJoin = "round";
      ctx.strokeText(text, x, y);
    }

    // Fill
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
  };

  // Initial draw and on changes
  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  // Touch/Mouse handlers for dragging text position
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (!text.trim()) return;
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  }, [text]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    
    setTextPosition({ x, y });
  }, [isDragging]);

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Handle export
  const handleExport = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (blob) {
        const preview = URL.createObjectURL(blob);
        onExport(blob, preview);
      }
    }, "image/jpeg", 0.9);
  };

  // Reset text
  const handleReset = () => {
    setText("");
    setFont("Inter");
    setFontSize(48);
    setColor("#FFFFFF");
    setAlign("center");
    setShowStroke(true);
    setTextPosition({ x: 0.5, y: 0.5 });
  };

  return (
    <div className="space-y-4">
      {/* Canvas Preview with holographic border */}
      <div 
        ref={containerRef}
        className={cn(
          "relative rounded-xl overflow-hidden border-2 bg-muted cursor-move touch-none",
          isDragging 
            ? "border-[hsl(var(--cosmic-magenta))] shadow-lg shadow-[hsl(var(--cosmic-magenta)/0.3)]" 
            : "border-border hover:border-[hsl(var(--cosmic-cyan)/0.5)]"
        )}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {/* Holographic border glow */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[hsl(var(--cosmic-cyan))] via-[hsl(var(--cosmic-magenta))] to-[hsl(var(--cosmic-gold))] opacity-0 hover:opacity-30 transition-opacity -z-10 blur-sm" />
        
        <canvas
          ref={canvasRef}
          width={1280}
          height={720}
          className="w-full aspect-video"
        />
        {!baseImage && !text && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-sm text-white/80 bg-black/50 px-4 py-2 rounded-lg backdrop-blur-sm">
              Chọn ảnh từ tab "Tải lên" hoặc "Kho mẫu" trước
            </p>
          </div>
        )}
        {text && (
          <div className="absolute bottom-2 right-2 text-xs text-white/60 bg-black/40 px-2 py-1 rounded backdrop-blur-sm pointer-events-none">
            Kéo để di chuyển text
          </div>
        )}
      </div>

      {/* Text Controls - responsive grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Type className="w-4 h-4" />
              Text overlay
            </Label>
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Nhập tiêu đề..."
              maxLength={50}
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label>Font</Label>
            <Select value={font} onValueChange={setFont}>
              <SelectTrigger className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FONTS.map((f) => (
                  <SelectItem key={f.value} value={f.value}>
                    <span style={{ fontFamily: f.value }}>{f.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Cỡ chữ: {fontSize}px</Label>
            <Slider
              value={[fontSize]}
              onValueChange={([v]) => setFontSize(v)}
              min={24}
              max={120}
              step={2}
              className="py-2"
            />
          </div>

          <div className="space-y-2">
            <Label>Căn lề</Label>
            <ToggleGroup 
              type="single" 
              value={align} 
              onValueChange={(v) => v && setAlign(v as any)}
              className="justify-start"
            >
              <ToggleGroupItem value="left" aria-label="Căn trái" className="min-w-[44px] min-h-[44px]">
                <AlignLeft className="w-4 h-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="center" aria-label="Căn giữa" className="min-w-[44px] min-h-[44px]">
                <AlignCenter className="w-4 h-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="right" aria-label="Căn phải" className="min-w-[44px] min-h-[44px]">
                <AlignRight className="w-4 h-4" />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>
      </div>

      {/* Rainbow Color Picker */}
      <div className="space-y-2">
        <Label>Màu chữ</Label>
        <div className="flex flex-wrap gap-2">
          {COLORS.map((c) => (
            <motion.button
              key={c}
              onClick={() => setColor(c)}
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.95 }}
              className={cn(
                "w-8 h-8 sm:w-9 sm:h-9 rounded-full border-2 transition-all min-w-[32px] min-h-[32px]",
                color === c 
                  ? "ring-2 ring-[hsl(var(--cosmic-cyan))] ring-offset-2 ring-offset-background border-transparent" 
                  : "border-border hover:border-[hsl(var(--cosmic-cyan)/0.5)]"
              )}
              style={{ backgroundColor: c }}
            />
          ))}
          <div className="relative">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full cursor-pointer opacity-0 absolute inset-0"
            />
            <div 
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border-2 border-dashed border-border flex items-center justify-center bg-gradient-to-br from-red-500 via-green-500 to-blue-500"
            >
              <Sparkles className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <Button 
          variant="outline" 
          onClick={handleReset} 
          className="gap-2 min-h-[48px] flex-shrink-0"
        >
          <RotateCcw className="w-4 h-4" />
          Reset
        </Button>
        <Button 
          onClick={handleExport} 
          className="flex-1 gap-2 min-h-[48px] bg-gradient-to-r from-[hsl(var(--cosmic-cyan))] to-[hsl(var(--cosmic-magenta))] hover:from-[hsl(var(--cosmic-cyan)/0.9)] hover:to-[hsl(var(--cosmic-magenta)/0.9)] text-white shadow-lg" 
          disabled={!baseImage}
        >
          <Download className="w-4 h-4" />
          Áp dụng & Lưu
        </Button>
      </div>
    </div>
  );
}
