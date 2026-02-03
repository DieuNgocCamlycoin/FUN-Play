import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { AlignLeft, AlignCenter, AlignRight, Type, Download, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

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
];

const COLORS = [
  "#FFFFFF", "#000000", "#FF0000", "#00FF00", "#0000FF",
  "#FFFF00", "#FF00FF", "#00FFFF", "#FFD700", "#FF6B6B",
];

export function ThumbnailCanvas({ baseImage, onExport }: ThumbnailCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [text, setText] = useState("");
  const [font, setFont] = useState("Inter");
  const [fontSize, setFontSize] = useState(48);
  const [color, setColor] = useState("#FFFFFF");
  const [align, setAlign] = useState<"left" | "center" | "right">("center");
  const [showStroke, setShowStroke] = useState(true);

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
      // Gradient background
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, "#1a1a2e");
      gradient.addColorStop(0.5, "#16213e");
      gradient.addColorStop(1, "#0f3460");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      drawText(ctx, canvas);
    }
  }, [baseImage, text, font, fontSize, color, align, showStroke]);

  const drawText = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    if (!text.trim()) return;

    ctx.font = `bold ${fontSize}px ${font}`;
    ctx.textBaseline = "middle";

    // Calculate position
    let x = canvas.width / 2;
    if (align === "left") {
      ctx.textAlign = "left";
      x = 60;
    } else if (align === "right") {
      ctx.textAlign = "right";
      x = canvas.width - 60;
    } else {
      ctx.textAlign = "center";
    }

    const y = canvas.height / 2;

    // Stroke (outline)
    if (showStroke) {
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = fontSize / 10;
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
  };

  return (
    <div className="space-y-4">
      {/* Canvas Preview */}
      <div className="relative rounded-lg overflow-hidden border bg-muted">
        <canvas
          ref={canvasRef}
          width={1280}
          height={720}
          className="w-full aspect-video"
        />
        {!baseImage && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-sm text-muted-foreground bg-background/80 px-3 py-1 rounded">
              Chọn ảnh từ tab "Tải lên" hoặc "Kho mẫu" trước
            </p>
          </div>
        )}
      </div>

      {/* Text Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
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
            />
          </div>

          <div className="space-y-2">
            <Label>Font</Label>
            <Select value={font} onValueChange={setFont}>
              <SelectTrigger>
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

        <div className="space-y-3">
          <div className="space-y-2">
            <Label>Cỡ chữ: {fontSize}px</Label>
            <Slider
              value={[fontSize]}
              onValueChange={([v]) => setFontSize(v)}
              min={24}
              max={120}
              step={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Căn lề</Label>
            <ToggleGroup type="single" value={align} onValueChange={(v) => v && setAlign(v as any)}>
              <ToggleGroupItem value="left" aria-label="Căn trái">
                <AlignLeft className="w-4 h-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="center" aria-label="Căn giữa">
                <AlignCenter className="w-4 h-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="right" aria-label="Căn phải">
                <AlignRight className="w-4 h-4" />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>
      </div>

      {/* Color Picker */}
      <div className="space-y-2">
        <Label>Màu chữ</Label>
        <div className="flex flex-wrap gap-2">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={cn(
                "w-8 h-8 rounded-full border-2 transition-transform hover:scale-110",
                color === c ? "ring-2 ring-primary ring-offset-2" : "border-muted"
              )}
              style={{ backgroundColor: c }}
            />
          ))}
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-8 h-8 rounded-full cursor-pointer"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button variant="outline" onClick={handleReset} className="gap-2">
          <RotateCcw className="w-4 h-4" />
          Reset
        </Button>
        <Button onClick={handleExport} className="flex-1 gap-2" disabled={!baseImage}>
          <Download className="w-4 h-4" />
          Áp dụng & Lưu
        </Button>
      </div>
    </div>
  );
}
