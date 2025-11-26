import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Copy,
  Facebook,
  MessageCircle,
  Send,
  Share2,
  QrCode,
  Twitter,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoId: string;
  videoTitle: string;
}

export const ShareModal = ({
  isOpen,
  onClose,
  videoId,
  videoTitle,
}: ShareModalProps) => {
  const [showQR, setShowQR] = useState(false);
  const { toast } = useToast();
  const shareUrl = `${window.location.origin}/watch/${videoId}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    toast({
      title: "Đã copy link!",
      description: "Link video đã được copy vào clipboard",
    });
  };

  const handleShare = (platform: string) => {
    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedTitle = encodeURIComponent(videoTitle);
    let shareLink = "";

    switch (platform) {
      case "facebook":
        shareLink = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        break;
      case "twitter":
        shareLink = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`;
        break;
      case "telegram":
        shareLink = `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`;
        break;
      case "whatsapp":
        shareLink = `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`;
        break;
      case "zalo":
        shareLink = `https://zalo.me/share?url=${encodedUrl}`;
        break;
      case "youtube":
        // YouTube doesn't have direct sharing, but users can copy link and share
        toast({
          title: "Copy link",
          description: "Copy link video và chia sẻ lên YouTube của bạn",
        });
        return;
    }

    if (shareLink) {
      window.open(shareLink, "_blank", "width=600,height=400");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md glass-card border-2 border-cosmic-cyan/30">
        <DialogHeader>
          <DialogTitle
            className="text-2xl font-bold"
            style={{
              background: "linear-gradient(135deg, #00E7FF, #7A2BFF, #FF00E5, #FFD700)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Chia sẻ video
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Copy Link Section */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Link video</label>
            <div className="flex gap-2">
              <Input
                value={shareUrl}
                readOnly
                className="flex-1 bg-muted/50 border-cosmic-cyan/30"
              />
              <Button
                onClick={handleCopyLink}
                size="icon"
                className="bg-cosmic-cyan hover:bg-cosmic-cyan/90 shadow-[0_0_30px_rgba(0,255,255,0.5)]"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Social Media Share Buttons */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Chia sẻ lên</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <Button
                variant="outline"
                className="flex items-center gap-2 border-cosmic-sapphire/50 hover:bg-cosmic-sapphire/20"
                onClick={() => handleShare("facebook")}
              >
                <Facebook className="h-4 w-4 text-cosmic-sapphire" />
                <span className="text-sm">Facebook</span>
              </Button>
              <Button
                variant="outline"
                className="flex items-center gap-2 border-cosmic-cyan/50 hover:bg-cosmic-cyan/20"
                onClick={() => handleShare("twitter")}
              >
                <Twitter className="h-4 w-4 text-cosmic-cyan" />
                <span className="text-sm">Twitter</span>
              </Button>
              <Button
                variant="outline"
                className="flex items-center gap-2 border-cosmic-magenta/50 hover:bg-cosmic-magenta/20"
                onClick={() => handleShare("telegram")}
              >
                <Send className="h-4 w-4 text-cosmic-magenta" />
                <span className="text-sm">Telegram</span>
              </Button>
              <Button
                variant="outline"
                className="flex items-center gap-2 border-glow-gold/50 hover:bg-glow-gold/20"
                onClick={() => handleShare("whatsapp")}
              >
                <MessageCircle className="h-4 w-4 text-glow-gold" />
                <span className="text-sm">WhatsApp</span>
              </Button>
              <Button
                variant="outline"
                className="flex items-center gap-2 border-divine-rose-gold/50 hover:bg-divine-rose-gold/20"
                onClick={() => handleShare("zalo")}
              >
                <MessageCircle className="h-4 w-4 text-divine-rose-gold" />
                <span className="text-sm">Zalo</span>
              </Button>
              <Button
                variant="outline"
                className="flex items-center gap-2 border-glow-white/50 hover:bg-glow-white/20"
                onClick={() => setShowQR(!showQR)}
              >
                <QrCode className="h-4 w-4 text-glow-white" />
                <span className="text-sm">QR Code</span>
              </Button>
            </div>
          </div>

          {/* QR Code Display */}
          {showQR && (
            <div className="flex justify-center p-4 bg-white rounded-lg">
              <QRCodeSVG value={shareUrl} size={200} level="H" />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
