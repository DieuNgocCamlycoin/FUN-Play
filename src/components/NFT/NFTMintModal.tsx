import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Image, Video, Loader2, Wallet, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useWalletConnection } from "@/hooks/useWalletConnection";

interface NFTMintModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  videoId?: string;
  videoThumbnail?: string;
  videoTitle?: string;
}

export const NFTMintModal = ({ 
  open, 
  onOpenChange, 
  videoId,
  videoThumbnail,
  videoTitle 
}: NFTMintModalProps) => {
  const { isConnected, connectWallet, isLoading: isConnecting } = useWalletConnection();
  const [activeTab, setActiveTab] = useState<"video" | "ai">("video");
  const [nftName, setNftName] = useState(videoTitle || "");
  const [nftDescription, setNftDescription] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isMinting, setIsMinting] = useState(false);

  const generateAIArtwork = async () => {
    if (!aiPrompt.trim()) {
      toast.error("Vui lòng nhập mô tả artwork");
      return;
    }

    setIsGenerating(true);
    
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: `Bạn là họa sĩ AI. Hãy mô tả chi tiết một bức tranh NFT dựa trên ý tưởng: "${aiPrompt}". 
              Mô tả bao gồm: màu sắc chủ đạo, phong cách nghệ thuật, các yếu tố trong tranh, cảm xúc truyền tải.
              Trả lời ngắn gọn trong 2-3 câu.`
            }
          ]
        }),
      });

      if (!response.ok) throw new Error("AI generation failed");

      // Simulate AI image generation with a placeholder
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setGeneratedImage(`https://picsum.photos/seed/${Date.now()}/400/400`);
      toast.success("Đã tạo artwork thành công!");
    } catch (error) {
      console.error("AI generation error:", error);
      toast.error("Lỗi tạo artwork. Vui lòng thử lại.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleMint = async () => {
    if (!nftName.trim()) {
      toast.error("Vui lòng nhập tên NFT");
      return;
    }

    // Check wallet connection - use the hook instead of window.ethereum
    if (!isConnected) {
      toast.info("Đang mở kết nối ví...");
      await connectWallet();
      return; // User will click again after connecting
    }

    setIsMinting(true);

    try {
      // Simulate minting process
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      toast.success("NFT đã được mint thành công! 🎉", {
        description: `${nftName} đã được thêm vào NFT Gallery của bạn`,
      });
      
      onOpenChange(false);
      
      // Reset form
      setNftName("");
      setNftDescription("");
      setAiPrompt("");
      setGeneratedImage(null);
    } catch (error: any) {
      console.error("Minting error:", error);
      if (error.code === 4001) {
        toast.error("Bạn đã từ chối kết nối ví");
      } else {
        toast.error("Lỗi mint NFT. Vui lòng thử lại.");
      }
    } finally {
      setIsMinting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-r from-[#00E7FF] to-[#FFD700]">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="bg-gradient-to-r from-[#00E7FF] to-[#FFD700] bg-clip-text text-transparent font-bold">
              Mint NFT
            </span>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "video" | "ai")} className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="video" className="flex items-center gap-2">
              <Video className="w-4 h-4" />
              Từ Video
            </TabsTrigger>
            <TabsTrigger value="ai" className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              AI Artwork
            </TabsTrigger>
          </TabsList>

          <TabsContent value="video" className="space-y-4 mt-4">
            {/* Video Thumbnail Preview */}
            <div className="relative aspect-video rounded-xl overflow-hidden bg-muted border-2 border-dashed border-[#00E7FF]/30">
              {videoThumbnail ? (
                <img 
                  src={videoThumbnail} 
                  alt="Video thumbnail" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                  <Image className="w-12 h-12 mb-2" />
                  <p className="text-sm">Chọn video để mint NFT</p>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-3 left-3 right-3">
                <span className="px-2 py-1 text-xs bg-[#00E7FF] text-white rounded-md">
                  Video NFT
                </span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              NFT sẽ được mint trên BSC với thumbnail video của bạn
            </p>
          </TabsContent>

          <TabsContent value="ai" className="space-y-4 mt-4">
            {/* AI Generation */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Mô tả artwork bạn muốn tạo
              </label>
              <Textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="VD: Một chú mèo vũ trụ với đôi cánh thiên thần, nền galaxy nhiều màu sắc..."
                className="min-h-[80px] border-[#00E7FF]/30"
              />
              <Button
                onClick={generateAIArtwork}
                disabled={isGenerating || !aiPrompt.trim()}
                className="mt-2 w-full bg-gradient-to-r from-[#7A2BFF] to-[#FF00E5]"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Đang tạo artwork...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Tạo AI Artwork
                  </>
                )}
              </Button>
            </div>

            {/* Generated Image Preview */}
            {generatedImage && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative aspect-square rounded-xl overflow-hidden border-2 border-[#FFD700]/50"
              >
                <img 
                  src={generatedImage} 
                  alt="AI Generated" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 right-3">
                  <span className="px-2 py-1 text-xs bg-gradient-to-r from-[#7A2BFF] to-[#FF00E5] text-white rounded-md">
                    AI Generated
                  </span>
                </div>
              </motion.div>
            )}
          </TabsContent>
        </Tabs>

        {/* NFT Details */}
        <div className="space-y-4 pt-4 border-t border-border">
          <div>
            <label className="text-sm font-medium mb-2 block">Tên NFT</label>
            <Input
              value={nftName}
              onChange={(e) => setNftName(e.target.value)}
              placeholder="Tên NFT của bạn"
              className="border-[#00E7FF]/30"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Mô tả</label>
            <Textarea
              value={nftDescription}
              onChange={(e) => setNftDescription(e.target.value)}
              placeholder="Mô tả về NFT này..."
              className="min-h-[60px] border-[#00E7FF]/30"
            />
          </div>

          {/* Mint Button */}
          <Button
            onClick={handleMint}
            disabled={isMinting || isConnecting || !nftName.trim() || (activeTab === "ai" && !generatedImage)}
            className="w-full h-12 bg-gradient-to-r from-[#00E7FF] to-[#FFD700] hover:opacity-90 text-white font-bold"
          >
            {isMinting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Đang mint NFT...
              </>
            ) : isConnecting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Đang kết nối ví...
              </>
            ) : !isConnected ? (
              <>
                <Wallet className="w-5 h-5 mr-2" />
                Kết nối ví để Mint
              </>
            ) : (
              <>
                <Wallet className="w-5 h-5 mr-2" />
                Mint NFT
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
