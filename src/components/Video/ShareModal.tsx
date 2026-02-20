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
import { ScrollArea } from "@/components/ui/scroll-area";
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

import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { PRODUCTION_URL, copyToClipboard as sharedCopyToClipboard } from "@/lib/shareUtils";

const socialBtnClass = "flex flex-col items-center gap-2 group transition-transform duration-150 hover:scale-105 active:scale-95";
const socialIconClass = "w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shadow-md";
const socialLabelClass = "text-xs text-foreground/80 group-hover:text-foreground";

const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5 sm:h-6 sm:w-6 text-white" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

const LinkedInIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5 sm:h-6 sm:w-6 text-white" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);

export type ShareContentType = 'video' | 'music' | 'channel' | 'ai-music';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  contentId?: string;
  contentTitle?: string;
  contentType?: ShareContentType;
  thumbnailUrl?: string;
  channelName?: string;
  userId?: string;
  username?: string;
  slug?: string;
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
  username,
  slug,
  videoId,
  videoTitle,
}: ShareModalProps) => {
  const [showQR, setShowQR] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showCopySuccess, setShowCopySuccess] = useState(false);
  const { toast } = useToast();
  
  const id = contentId || videoId || '';
  const title = contentTitle || videoTitle || '';
  
  const getShareUrl = () => {
    const baseUrl = PRODUCTION_URL;
    switch (contentType) {
      case 'video':
        if (username && slug) {
          return `${baseUrl}/${username}/video/${slug}`;
        }
        return `${baseUrl}/watch/${id}`;
      case 'music':
        return `${baseUrl}/music/${id}`;
      case 'ai-music':
        return `${baseUrl}/ai-music/${id}`;
      case 'channel':
        if (username) {
          return `${baseUrl}/${username}`;
        }
        return `${baseUrl}/${id}`;
      default:
        return `${baseUrl}/watch/${id}`;
    }
  };

  const getPrerenderUrl = () => {
    let path: string;
    if (contentType === 'video' && username && slug) {
      path = `/${username}/video/${slug}`;
    } else if (contentType === 'video') {
      path = `/watch/${id}`;
    } else if (contentType === 'music') {
      path = `/music/${id}`;
    } else if (contentType === 'ai-music') {
      path = `/ai-music/${id}`;
    } else if (contentType === 'channel') {
      path = username ? `/${username}` : `/${id}`;
    } else {
      path = `/watch/${id}`;
    }
    return `https://fzgjmvxtgrlwrluxdwjq.supabase.co/functions/v1/prerender?path=${encodeURIComponent(path)}`;
  };
  
  const shareUrl = getShareUrl();
  const prerenderUrl = getPrerenderUrl();
  
  const getContentTypeLabel = () => {
    switch (contentType) {
      case 'video': return 'video';
      case 'music': return 'bài hát';
      case 'ai-music': return 'bài hát AI';
      case 'channel': return 'kênh';
      default: return 'nội dung';
    }
  };

  const copyToClipboard = sharedCopyToClipboard;

  const handleCopyLink = async () => {
    const success = await copyToClipboard(shareUrl);
    if (success) {
      setCopiedLink(true);
      setShowCopySuccess(true);
      setTimeout(() => setCopiedLink(false), 2000);
      setTimeout(() => setShowCopySuccess(false), 1500);
      toast({
        title: "Đã copy link!",
        description: `Link ${getContentTypeLabel()} đã được copy vào clipboard`,
      });
    } else {
      toast({
        title: "Không thể copy link",
        description: "Vui lòng copy link thủ công từ ô bên trên",
        variant: "destructive",
      });
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: `Xem ${getContentTypeLabel()} "${title}" trên FUN Play`,
          url: shareUrl,
        });
        toast({
          title: "Chia sẻ thành công!",
          description: "Cảm ơn bạn đã chia sẻ",
        });
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
        // Silent fallback: copy link when blocked (iframe/preview)
        const success = await copyToClipboard(shareUrl);
        if (success) {
          setCopiedLink(true);
          setTimeout(() => setCopiedLink(false), 2000);
          toast({
            title: "Đã sao chép liên kết để chia sẻ",
          });
        }
      }
    }
  };

  const handleShare = async (platform: string) => {
    const usePrerenderUrl = ['facebook', 'twitter', 'linkedin', 'messenger', 'telegram', 'whatsapp', 'zalo'].includes(platform);
    const urlToShare = usePrerenderUrl ? prerenderUrl : shareUrl;
    const encodedUrl = encodeURIComponent(urlToShare);
    const encodedTitle = encodeURIComponent(title);
    const shareText = encodeURIComponent(`Xem ${getContentTypeLabel()} "${title}" trên FUN Play`);
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
      case "tiktok":
        const tiktokCopySuccess = await copyToClipboard(shareUrl);
        if (tiktokCopySuccess) {
          toast({
            title: "Link đã được copy!",
            description: "Dán link vào TikTok để chia sẻ",
          });
        } else {
          toast({
            title: "Không thể copy link",
            description: "Vui lòng copy link thủ công từ ô bên trên",
            variant: "destructive",
          });
        }
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

  const ContentTypeIcon = (contentType === 'music' || contentType === 'ai-music') ? Music : contentType === 'channel' ? User : Video;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] bg-background/95 backdrop-blur-sm border border-border rounded-xl overflow-hidden p-0">
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Share2 className="w-5 h-5 text-cosmic-cyan" />
            Chia sẻ {getContentTypeLabel()}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Chia sẻ {title} lên các mạng xã hội hoặc sao chép liên kết
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(80vh-80px)]">
          <div className="space-y-4 px-6 pb-6">
            {/* Content Preview */}
            {(thumbnailUrl || title) && (
              <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border border-border/50 animate-fade-in">
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
              </div>
            )}

            {/* Copy Link Section */}
            <div className="space-y-3 relative">
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-cosmic-cyan/20">
                <Input
                  value={shareUrl}
                  readOnly
                  className="flex-1 bg-transparent border-0 text-sm focus-visible:ring-0 focus-visible:ring-offset-0 pr-2"
                />
                <Button
                  onClick={handleCopyLink}
                  className={cn(
                    "px-5 font-semibold gap-2 transition-all duration-300",
                    copiedLink 
                      ? "bg-green-500 hover:bg-green-600 shadow-[0_0_25px_rgba(34,197,94,0.6)]" 
                      : "bg-cosmic-cyan hover:bg-cosmic-cyan/90 shadow-[0_0_20px_rgba(0,231,255,0.4)]"
                  )}
                >
                  {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copiedLink ? "Đã copy!" : "Sao chép"}
                </Button>
              </div>

              {/* Copy Success Animation */}
              <AnimatePresence>
                {showCopySuccess && (
                  <motion.div
                    className="absolute inset-0 pointer-events-none flex items-center justify-center z-10"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <motion.div
                      className="absolute w-16 h-16 rounded-full border-4 border-green-400"
                      initial={{ scale: 0, opacity: 1 }}
                      animate={{ scale: 2.5, opacity: 0 }}
                      transition={{ duration: 0.7, ease: "easeOut" }}
                    />
                    <motion.div
                      className="w-14 h-14 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-[0_0_30px_rgba(34,197,94,0.7)]"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    >
                      <Check className="w-7 h-7 text-white" strokeWidth={3} />
                    </motion.div>
                    {[...Array(4)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute w-2 h-2 rounded-full bg-green-400"
                        initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
                        animate={{
                          scale: [0, 1.2, 0],
                          x: Math.cos((i * 90 * Math.PI) / 180) * 50,
                          y: Math.sin((i * 90 * Math.PI) / 180) * 50,
                          opacity: [1, 1, 0],
                        }}
                        transition={{ duration: 0.6, delay: 0.05 * i, ease: "easeOut" }}
                      />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
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

            {/* Social Media Grid */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">Chia sẻ lên mạng xã hội</label>
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 justify-items-center">
                <button onClick={() => handleShare("facebook")} className={socialBtnClass}>
                  <div className={cn(socialIconClass, "bg-[#1877F2]")}>
                    <Facebook className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <span className={socialLabelClass}>Facebook</span>
                </button>

                <button onClick={() => handleShare("messenger")} className={socialBtnClass}>
                  <div className={cn(socialIconClass, "bg-gradient-to-br from-[#00B2FF] to-[#006AFF]")}>
                    <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <span className={socialLabelClass}>Messenger</span>
                </button>

                <button onClick={() => handleShare("whatsapp")} className={socialBtnClass}>
                  <div className={cn(socialIconClass, "bg-[#25D366]")}>
                    <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <span className={socialLabelClass}>WhatsApp</span>
                </button>

                <button onClick={() => handleShare("twitter")} className={socialBtnClass}>
                  <div className={cn(socialIconClass, "bg-[#000000]")}>
                    <Twitter className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <span className={socialLabelClass}>X</span>
                </button>

                <button onClick={() => handleShare("tiktok")} className={socialBtnClass}>
                  <div className={cn(socialIconClass, "bg-[#000000]")}>
                    <TikTokIcon />
                  </div>
                  <span className={socialLabelClass}>TikTok</span>
                </button>

                <button onClick={() => handleShare("telegram")} className={socialBtnClass}>
                  <div className={cn(socialIconClass, "bg-[#0088cc]")}>
                    <Send className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <span className={socialLabelClass}>Telegram</span>
                </button>

                <button onClick={() => handleShare("zalo")} className={socialBtnClass}>
                  <div className={cn(socialIconClass, "bg-[#0068FF]")}>
                    <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <span className={socialLabelClass}>Zalo</span>
                </button>

                <button onClick={() => handleShare("linkedin")} className={socialBtnClass}>
                  <div className={cn(socialIconClass, "bg-[#0A66C2]")}>
                    <LinkedInIcon />
                  </div>
                  <span className={socialLabelClass}>LinkedIn</span>
                </button>

                <button onClick={() => handleShare("email")} className={socialBtnClass}>
                  <div className={cn(socialIconClass, "bg-gradient-to-br from-red-500 to-orange-500")}>
                    <Mail className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <span className={socialLabelClass}>Email</span>
                </button>

                <button onClick={() => handleShare("sms")} className={socialBtnClass}>
                  <div className={cn(socialIconClass, "bg-gradient-to-br from-green-500 to-emerald-500")}>
                    <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <span className={socialLabelClass}>SMS</span>
                </button>

                <button onClick={() => setShowQR(!showQR)} className={socialBtnClass}>
                  <div className={cn(socialIconClass, "bg-gradient-to-br from-cosmic-cyan to-cosmic-magenta")}>
                    <QrCode className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <span className={socialLabelClass}>QR Code</span>
                </button>
              </div>
            </div>

            {/* QR Code Display */}
            <AnimatePresence>
              {showQR && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex justify-center overflow-hidden pb-6"
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
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
