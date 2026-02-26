import { useState, useRef, KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Heart, Loader2, ImagePlus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useR2Upload } from "@/hooks/useR2Upload";
import { useToast } from "@/hooks/use-toast";
import { resizeImage } from "@/lib/imageUtils";

interface ChatInputProps {
  onSend: (content: string, imageUrl?: string) => Promise<boolean>;
  disabled?: boolean;
}

const MAX_IMAGE_SIZE_MB = 5;

export const ChatInput = ({ onSend, disabled }: ChatInputProps) => {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadToR2, uploading } = useR2Upload({ folder: "chat" });
  const { toast } = useToast();

  const handleSend = async () => {
    if ((!message.trim() && !imageFile) || sending || disabled || uploading) return;

    setSending(true);
    const content = message.trim();
    setMessage("");

    let imageUrl: string | undefined;

    // Upload image if selected
    if (imageFile) {
      try {
        let fileToUpload = imageFile;
        try {
          fileToUpload = await resizeImage(imageFile, 800, 800, 0.85);
        } catch {
          // fallback to original
        }
        const result = await uploadToR2(fileToUpload);
        if (result) {
          imageUrl = result.publicUrl;
        } else {
          toast({ title: "Lỗi", description: "Không thể tải ảnh lên", variant: "destructive" });
          setSending(false);
          return;
        }
      } catch {
        toast({ title: "Lỗi", description: "Không thể tải ảnh lên", variant: "destructive" });
        setSending(false);
        return;
      }
    }

    clearImage();
    await onSend(content || (imageUrl ? "📷 Hình ảnh" : ""), imageUrl);
    setSending(false);
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Lỗi", description: "Chỉ hỗ trợ file hình ảnh", variant: "destructive" });
      return;
    }

    if (file.size / (1024 * 1024) > MAX_IMAGE_SIZE_MB) {
      toast({ title: "Lỗi", description: `Ảnh phải dưới ${MAX_IMAGE_SIZE_MB}MB`, variant: "destructive" });
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);

    // Reset input so the same file can be selected again
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const isBusy = sending || uploading;

  return (
    <div className="border-t bg-background/95 backdrop-blur p-3">
      {/* Image preview */}
      {imagePreview && (
        <div className="mb-2 relative inline-block">
          <img
            src={imagePreview}
            alt="Preview"
            className="h-20 w-20 object-cover rounded-xl border"
          />
          <button
            type="button"
            onClick={clearImage}
            className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full p-0.5"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <div className="flex items-end gap-2">
        {/* Image picker button */}
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-11 w-11 rounded-full flex-shrink-0 text-muted-foreground hover:text-purple-500"
          disabled={disabled || isBusy}
          onClick={() => fileInputRef.current?.click()}
        >
          <ImagePlus className="h-5 w-5" />
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageSelect}
        />

        {/* Input */}
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Nhắn tin yêu thương..."
            disabled={disabled || isBusy}
            rows={1}
            className={cn(
              "min-h-[44px] max-h-32 resize-none pr-12",
              "bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-purple-300",
              "rounded-2xl py-3 px-4"
            )}
          />
        </div>

        {/* Send button */}
        <Button
          size="icon"
          onClick={handleSend}
          disabled={(!message.trim() && !imageFile) || isBusy || disabled}
          className={cn(
            "h-11 w-11 rounded-full flex-shrink-0",
            "bg-gradient-to-br from-purple-500 via-pink-500 to-purple-600",
            "hover:from-purple-600 hover:via-pink-600 hover:to-purple-700",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40",
            "transition-all duration-200"
          )}
        >
          {isBusy ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : message.trim() || imageFile ? (
            <Send className="h-5 w-5" />
          ) : (
            <Heart className="h-5 w-5" />
          )}
        </Button>
      </div>
      
      {/* Hint */}
      <p className="text-[10px] text-muted-foreground mt-1.5 ml-2">
        Enter để gửi • Shift+Enter xuống dòng
      </p>
    </div>
  );
};
