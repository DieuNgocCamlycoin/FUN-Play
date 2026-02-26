import { useRef, useEffect, useState } from "react";
import funplayLogo from "@/assets/funplay-logo.png";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

const WIDTH = 1200;
const HEIGHT = 630;

const GenerateOG = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
    grad.addColorStop(0, "#1a0533");
    grad.addColorStop(1, "#0a1628");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Subtle radial glow in center
    const radial = ctx.createRadialGradient(WIDTH / 2, HEIGHT / 2 - 40, 50, WIDTH / 2, HEIGHT / 2 - 40, 350);
    radial.addColorStop(0, "rgba(139, 92, 246, 0.25)");
    radial.addColorStop(1, "rgba(139, 92, 246, 0)");
    ctx.fillStyle = radial;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Load logo
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const logoSize = 180;
      const logoX = (WIDTH - logoSize) / 2;
      const logoY = 140;

      // Draw circular logo with clip
      ctx.save();
      ctx.beginPath();
      ctx.arc(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(img, logoX, logoY, logoSize, logoSize);
      ctx.restore();

      // "FUN Play" text
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 52px 'Inter', 'Segoe UI', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("FUN Play", WIDTH / 2, logoY + logoSize + 60);

      // Tagline
      ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
      ctx.font = "26px 'Inter', 'Segoe UI', sans-serif";
      ctx.fillText("Web3 AI Social", WIDTH / 2, logoY + logoSize + 100);

      setReady(true);
    };
    img.src = funplayLogo;
  }, []);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = "funplay-og-image.jpg";
    link.href = canvas.toDataURL("image/jpeg", 0.95);
    link.click();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-background p-4">
      <h1 className="text-2xl font-bold text-foreground">OG Image Generator</h1>
      <p className="text-muted-foreground text-sm">1200 × 630px — Tải về rồi thay thế public/images/funplay-og-image.jpg</p>
      <canvas
        ref={canvasRef}
        width={WIDTH}
        height={HEIGHT}
        className="border border-border rounded-lg max-w-full"
        style={{ aspectRatio: `${WIDTH}/${HEIGHT}` }}
      />
      {ready && (
        <Button onClick={handleDownload} size="lg" className="gap-2">
          <Download className="h-5 w-5" />
          Download JPG
        </Button>
      )}
    </div>
  );
};

export default GenerateOG;
