import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  Mail,
  MessageSquare,
  Smartphone,
  Music,
  Video,
  User,
  Check,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { awardShareReward } from "@/lib/enhancedRewards";
import { motion, AnimatePresence } from "framer-motion";

// TikTok SVG Icon
const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" className="h-6 w-6 text-white" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

// LinkedIn Icon
const LinkedInIcon = () => (
  <svg viewBox="0 0 24 24" className="h-6 w-6 text-white" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);

export type ShareContentType = 'video' | 'music' | 'channel';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  contentId?: string;
  contentTitle?: string;
  contentType?: ShareContentType;
  thumbnailUrl?: string;
  channelName?: string;
  userId?: string;
  // Legacy props for backward compatibility
  videoId?: string;
  videoTitle?: string;
}

export const ShareModal = ({
  isOpen,
  onClose,
  contentId,
  contentTitle,
  contentType = 'video',
  thumbnailUrl,
  channelName,
  userId,
  // Legacy props
  videoId,
  videoTitle,
}: ShareModalProps) => {
  const [showQR, setShowQR] = useState(false);
  const [hasShared, setHasShared] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const { toast } = useToast();
  
  // Support legacy props
  const id = contentId || videoId || '';
  const title = contentTitle || videoTitle || '';
  
  // Generate share URL based on content type
  const getShareUrl = () => {
    switch (contentType) {
      case 'video':
        return `${window.location.origin}/watch/${id}`;
      case 'music':
        return `${window.location.origin}/music/${id}`;
      case 'channel':
        return `${window.location.origin}/channel/${id}`;
      default:
        return `${window.location.origin}/watch/${id}`;
    }
  };

  // Generate prerender URL for social media crawlers (with proper OG tags)
  const getPrerenderUrl = () => {
    const path = contentType === 'video' ? `/watch/${id}` 
      : contentType === 'music' ? `/music/${id}` 
      : contentType === 'channel' ? `/channel/${id}` 
      : `/watch/${id}`;
    
    return `https://fzgjmvxtgrlwrluxdwjq.supabase.co/functions/v1/prerender?path=${encodeURIComponent(path)}`;
  };
  
  const shareUrl = getShareUrl();
  const prerenderUrl = getPrerenderUrl();
  
  const getContentTypeLabel = () => {
    switch (contentType) {
      case 'video': return 'video';
      case 'music': return 'bài hát';
      case 'channel': return 'kênh';
      default: return 'nội dung';
    }
  };

  const awardShare = async () => {
    if (!userId || hasShared) return;
    setHasShared(true);
    const result = await awardShareReward(userId, id);
    if (result?.milestone) {
      toast({
        title: "🎉 Chúc mừng! Milestone đạt được!",
        description: `Bạn đã đạt ${result.milestone} CAMLY tổng rewards!`,
        duration: 5000,
      });
    }
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
    awardShare();
    toast({
      title: "Đã copy link!",
      description: `Link ${getContentTypeLabel()} đã được copy vào clipboard (+2 CAMLY)`,
    });
  };

  // Native Web Share API
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: `Xem ${getContentTypeLabel()} "${title}" trên FUN Play! ✨`,
          url: shareUrl,
        });
        awardShare();
        toast({
          title: "Chia sẻ thành công!",
          description: "+2 CAMLY đã được cộng vào tài khoản",
        });
      } catch (err) {
        // User cancelled or error
        if ((err as Error).name !== 'AbortError') {
          console.error('Share failed:', err);
        }
      }
    }
  };

  const handleShare = (platform: string) => {
    awardShare();
    // Use prerender URL for social media platforms (for proper OG meta tags)
    // Use regular shareUrl for other platforms
    const usePrerenderUrl = ['facebook', 'twitter', 'linkedin', 'messenger'].includes(platform);
    const urlToShare = usePrerenderUrl ? prerenderUrl : shareUrl;
    const encodedUrl = encodeURIComponent(urlToShare);
    const encodedTitle = encodeURIComponent(title);
    const shareText = encodeURIComponent(`Xem ${getContentTypeLabel()} "${title}" trên FUN Play! ✨`);
    let shareLink = "";

    switch (platform) {
      case "facebook":
        shareLink = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        break;
      case "twitter":
        shareLink = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`;
        break;
      case "telegram":
        shareLink = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodedTitle}`;
        break;
      case "whatsapp":
        shareLink = `https://wa.me/?text=${encodedTitle}%20${encodeURIComponent(shareUrl)}`;
        break;
      case "zalo":
        shareLink = `https://zalo.me/share?url=${encodeURIComponent(shareUrl)}`;
        break;
      case "tiktok":
        // TikTok doesn't have a direct share URL, copy link instead
        navigator.clipboard.writeText(shareUrl);
        toast({
          title: "Link đã được copy!",
          description: "Dán link vào TikTok để chia sẻ (+2 CAMLY)",
        });
        return;
      case "linkedin":
        shareLink = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
        break;
      case "messenger":
        shareLink = `https://www.facebook.com/dialog/send?link=${encodedUrl}&app_id=966242223397117&redirect_uri=${encodeURIComponent(shareUrl)}`;
        break;
      case "email":
        shareLink = `mailto:?subject=${encodedTitle}&body=${shareText}%20${encodeURIComponent(shareUrl)}`;
        window.location.href = shareLink;
        return;
      case "sms":
        shareLink = `sms:?body=${shareText}%20${encodeURIComponent(shareUrl)}`;
        window.location.href = shareLink;
        return;
    }

    if (shareLink) {
      window.open(shareLink, "_blank", "width=600,height=400");
    }
  };

  const ContentTypeIcon = contentType === 'music' ? Music : contentType === 'channel' ? User : Video;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg glass-card border-2 border-cosmic-cyan/30 overflow-hidden">
        {/* Animated background - pointer-events-none to not block clicks */}
        <div className="absolute inset-0 bg-gradient-to-br from-cosmic-cyan/5 via-transparent to-cosmic-magenta/5 pointer-events-none -z-10" />
        
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Share2 className="w-5 h-5 text-cosmic-cyan" />
            Chia sẻ {getContentTypeLabel()}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Chia sẻ {title} lên các mạng xã hội hoặc sao chép liên kết
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 relative">
          {/* Content Preview */}
          {(thumbnailUrl || title) && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border border-border/50"
            >
              {thumbnailUrl ? (
                <img 
                  src={thumbnailUrl} 
                  alt={title}
                  className="w-16 h-16 rounded-lg object-cover ring-2 ring-cosmic-cyan/30"
                />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-cosmic-cyan to-cosmic-magenta flex items-center justify-center">
                  <ContentTypeIcon className="w-8 h-8 text-white" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground line-clamp-2">{title}</p>
                {channelName && (
                  <p className="text-sm text-muted-foreground">{channelName}</p>
                )}
              </div>
            </motion.div>
          )}

          {/* Copy Link Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-cosmic-cyan/20">
              <Input
                value={shareUrl}
                readOnly
                className="flex-1 bg-transparent border-0 text-sm focus-visible:ring-0 focus-visible:ring-offset-0 pr-2"
              />
              <Button
                onClick={handleCopyLink}
                className="bg-cosmic-cyan hover:bg-cosmic-cyan/90 shadow-[0_0_20px_rgba(0,231,255,0.4)] px-5 font-semibold gap-2"
              >
                <AnimatePresence mode="wait">
                  {copiedLink ? (
                    <motion.div
                      key="check"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                    >
                      <Check className="w-4 h-4" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="copy"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                    >
                      <Copy className="w-4 h-4" />
                    </motion.div>
                  )}
                </AnimatePresence>
                {copiedLink ? "Đã copy!" : "Sao chép"}
              </Button>
            </div>
          </div>

          {/* Native Share Button (Mobile) */}
          {typeof navigator !== 'undefined' && navigator.share && (
            <Button
              onClick={handleNativeShare}
              variant="outline"
              className="w-full gap-2 border-cosmic-cyan/30 hover:bg-cosmic-cyan/10"
            >
              <Smartphone className="w-4 h-4" />
              Chia sẻ qua ứng dụng khác
            </Button>
          )}

          {/* Social Media Share Buttons */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">Chia sẻ lên mạng xã hội</label>
            <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {/* Facebook */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleShare("facebook")}
                className="flex flex-col items-center gap-2 min-w-[70px] group"
              >
                <div className="w-14 h-14 rounded-full bg-[#1877F2] flex items-center justify-center shadow-lg shadow-[#1877F2]/30">
                  <Facebook className="h-6 w-6 text-white" />
                </div>
                <span className="text-xs text-foreground/80 group-hover:text-foreground">Facebook</span>
              </motion.button>
              
              {/* Messenger */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleShare("messenger")}
                className="flex flex-col items-center gap-2 min-w-[70px] group"
              >
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#00B2FF] to-[#006AFF] flex items-center justify-center shadow-lg shadow-[#006AFF]/30">
                  <MessageSquare className="h-6 w-6 text-white" />
                </div>
                <span className="text-xs text-foreground/80 group-hover:text-foreground">Messenger</span>
              </motion.button>
              
              {/* WhatsApp */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleShare("whatsapp")}
                className="flex flex-col items-center gap-2 min-w-[70px] group"
              >
                <div className="w-14 h-14 rounded-full bg-[#25D366] flex items-center justify-center shadow-lg shadow-[#25D366]/30">
                  <MessageCircle className="h-6 w-6 text-white" />
                </div>
                <span className="text-xs text-foreground/80 group-hover:text-foreground">WhatsApp</span>
              </motion.button>

              {/* X (Twitter) */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleShare("twitter")}
                className="flex flex-col items-center gap-2 min-w-[70px] group"
              >
                <div className="w-14 h-14 rounded-full bg-[#000000] flex items-center justify-center shadow-lg">
                  <Twitter className="h-6 w-6 text-white" />
                </div>
                <span className="text-xs text-foreground/80 group-hover:text-foreground">X</span>
              </motion.button>

              {/* TikTok */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleShare("tiktok")}
                className="flex flex-col items-center gap-2 min-w-[70px] group"
              >
                <div className="w-14 h-14 rounded-full bg-[#000000] flex items-center justify-center shadow-lg">
                  <TikTokIcon />
                </div>
                <span className="text-xs text-foreground/80 group-hover:text-foreground">TikTok</span>
              </motion.button>

              {/* Telegram */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleShare("telegram")}
                className="flex flex-col items-center gap-2 min-w-[70px] group"
              >
                <div className="w-14 h-14 rounded-full bg-[#0088cc] flex items-center justify-center shadow-lg shadow-[#0088cc]/30">
                  <Send className="h-6 w-6 text-white" />
                </div>
                <span className="text-xs text-foreground/80 group-hover:text-foreground">Telegram</span>
              </motion.button>

              {/* Zalo */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleShare("zalo")}
                className="flex flex-col items-center gap-2 min-w-[70px] group"
              >
                <div className="w-14 h-14 rounded-full bg-[#0068FF] flex items-center justify-center shadow-lg shadow-[#0068FF]/30">
                  <MessageCircle className="h-6 w-6 text-white" />
                </div>
                <span className="text-xs text-foreground/80 group-hover:text-foreground">Zalo</span>
              </motion.button>

              {/* LinkedIn */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleShare("linkedin")}
                className="flex flex-col items-center gap-2 min-w-[70px] group"
              >
                <div className="w-14 h-14 rounded-full bg-[#0A66C2] flex items-center justify-center shadow-lg shadow-[#0A66C2]/30">
                  <LinkedInIcon />
                </div>
                <span className="text-xs text-foreground/80 group-hover:text-foreground">LinkedIn</span>
              </motion.button>

              {/* Email */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleShare("email")}
                className="flex flex-col items-center gap-2 min-w-[70px] group"
              >
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg shadow-red-500/30">
                  <Mail className="h-6 w-6 text-white" />
                </div>
                <span className="text-xs text-foreground/80 group-hover:text-foreground">Email</span>
              </motion.button>

              {/* SMS */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleShare("sms")}
                className="flex flex-col items-center gap-2 min-w-[70px] group"
              >
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/30">
                  <MessageSquare className="h-6 w-6 text-white" />
                </div>
                <span className="text-xs text-foreground/80 group-hover:text-foreground">SMS</span>
              </motion.button>

              {/* QR Code */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowQR(!showQR)}
                className="flex flex-col items-center gap-2 min-w-[70px] group"
              >
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-cosmic-cyan to-cosmic-magenta flex items-center justify-center shadow-lg shadow-cosmic-cyan/30">
                  <QrCode className="h-6 w-6 text-white" />
                </div>
                <span className="text-xs text-foreground/80 group-hover:text-foreground">QR Code</span>
              </motion.button>
            </div>
          </div>

          {/* QR Code Display */}
          <AnimatePresence>
            {showQR && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex justify-center overflow-hidden"
              >
                <div className="p-4 bg-white rounded-xl shadow-lg">
                  <QRCodeSVG 
                    value={shareUrl} 
                    size={180} 
                    level="H"
                    includeMargin
                  />
                  <p className="text-center text-xs text-gray-500 mt-2">
                    Quét để xem {getContentTypeLabel()}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Reward Info */}
          <div className="text-center text-sm text-muted-foreground bg-muted/30 rounded-lg p-3">
            <span className="text-cosmic-gold">✨ +2 CAMLY</span> khi chia sẻ {getContentTypeLabel()}!
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
