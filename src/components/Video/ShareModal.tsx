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
import { awardShareReward } from "@/lib/enhancedRewards";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoId: string;
  videoTitle: string;
  userId?: string;
}

export const ShareModal = ({
  isOpen,
  onClose,
  videoId,
  videoTitle,
  userId,
}: ShareModalProps) => {
  const [showQR, setShowQR] = useState(false);
  const [hasShared, setHasShared] = useState(false);
  const { toast } = useToast();
  const shareUrl = `${window.location.origin}/watch/${videoId}`;

  const awardShare = async () => {
    if (!userId || hasShared) return;
    setHasShared(true);
    const result = await awardShareReward(userId, videoId);
    if (result?.milestone) {
      toast({
        title: "🎉 Chúc mừng! Milestone đạt được!",
        description: `Bạn đã đạt ${result.milestone} CAMLY tổng rewards!`,
        duration: 5000,
      });
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    awardShare();
    toast({
      title: "Đã copy link!",
      description: "Link video đã được copy vào clipboard (+2 CAMLY)",
    });
  };

  const handleShare = (platform: string) => {
    awardShare();
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
    }

    if (shareLink) {
      window.open(shareLink, "_blank", "width=600,height=400");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg glass-card border-2 border-cosmic-cyan/30">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-foreground">
            Chia sẻ video
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Copy Link Section - Prominent YouTube Style */}
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-cosmic-cyan/20">
              <Input
                value={shareUrl}
                readOnly
                className="flex-1 bg-transparent border-0 text-sm focus-visible:ring-0 focus-visible:ring-offset-0 pr-2"
              />
              <Button
                onClick={handleCopyLink}
                className="bg-cosmic-cyan hover:bg-cosmic-cyan/90 shadow-[0_0_20px_rgba(0,231,255,0.4)] px-6 font-semibold"
              >
                Sao chép
              </Button>
            </div>
          </div>

          {/* Social Media Share Buttons */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">Chia sẻ</label>
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              <button
                onClick={() => handleShare("facebook")}
                className="flex flex-col items-center gap-2 min-w-[70px] group"
              >
                <div className="w-14 h-14 rounded-full bg-[#1877F2] flex items-center justify-center hover:scale-110 transition-transform shadow-lg">
                  <Facebook className="h-6 w-6 text-white" />
                </div>
                <span className="text-xs text-foreground/80 group-hover:text-foreground">Facebook</span>
              </button>
              
              <button
                onClick={() => handleShare("whatsapp")}
                className="flex flex-col items-center gap-2 min-w-[70px] group"
              >
                <div className="w-14 h-14 rounded-full bg-[#25D366] flex items-center justify-center hover:scale-110 transition-transform shadow-lg">
                  <MessageCircle className="h-6 w-6 text-white" />
                </div>
                <span className="text-xs text-foreground/80 group-hover:text-foreground">WhatsApp</span>
              </button>

              <button
                onClick={() => handleShare("twitter")}
                className="flex flex-col items-center gap-2 min-w-[70px] group"
              >
                <div className="w-14 h-14 rounded-full bg-[#000000] flex items-center justify-center hover:scale-110 transition-transform shadow-lg">
                  <Twitter className="h-6 w-6 text-white" />
                </div>
                <span className="text-xs text-foreground/80 group-hover:text-foreground">X</span>
              </button>

              <button
                onClick={() => handleShare("telegram")}
                className="flex flex-col items-center gap-2 min-w-[70px] group"
              >
                <div className="w-14 h-14 rounded-full bg-[#0088cc] flex items-center justify-center hover:scale-110 transition-transform shadow-lg">
                  <Send className="h-6 w-6 text-white" />
                </div>
                <span className="text-xs text-foreground/80 group-hover:text-foreground">Telegram</span>
              </button>

              <button
                onClick={() => handleShare("zalo")}
                className="flex flex-col items-center gap-2 min-w-[70px] group"
              >
                <div className="w-14 h-14 rounded-full bg-[#0068FF] flex items-center justify-center hover:scale-110 transition-transform shadow-lg">
                  <MessageCircle className="h-6 w-6 text-white" />
                </div>
                <span className="text-xs text-foreground/80 group-hover:text-foreground">Zalo</span>
              </button>

              <button
                onClick={() => setShowQR(!showQR)}
                className="flex flex-col items-center gap-2 min-w-[70px] group"
              >
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-cosmic-cyan to-cosmic-magenta flex items-center justify-center hover:scale-110 transition-transform shadow-lg">
                  <QrCode className="h-6 w-6 text-white" />
                </div>
                <span className="text-xs text-foreground/80 group-hover:text-foreground">QR Code</span>
              </button>
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
