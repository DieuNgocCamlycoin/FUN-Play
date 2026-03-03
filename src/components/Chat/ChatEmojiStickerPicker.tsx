import { useState } from "react";
import { Smile, Heart, ThumbsUp, Star, Music, Cat, PartyPopper } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface ChatEmojiStickerPickerProps {
  onEmojiSelect: (emoji: string) => void;
  onSendSticker: (sticker: string) => void;
  disabled?: boolean;
}

type TabType = "emoji" | "sticker";

const EMOJI_CATEGORIES = [
  {
    name: "Thường dùng",
    icon: Smile,
    emojis: ["😀", "😂", "🥰", "😍", "🤩", "😎", "🙌", "👏", "🔥", "💯", "❤️", "💕", "😊", "😁", "😆", "😅"],
  },
  {
    name: "Cảm xúc",
    icon: Star,
    emojis: ["🤣", "😢", "😭", "😤", "😠", "🥺", "😱", "🤯", "😴", "🤔", "🤗", "😇", "🥳", "😏", "😬", "🫣"],
  },
  {
    name: "Tim",
    icon: Heart,
    emojis: ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "💖", "💗", "💓", "💞", "💕", "💘", "💝", "😘"],
  },
  {
    name: "Cử chỉ",
    icon: ThumbsUp,
    emojis: ["👍", "👎", "👌", "✌️", "🤞", "🤙", "💪", "🙏", "🤝", "👊", "✊", "🫶", "👋", "🤲", "🤜", "🤛"],
  },
  {
    name: "Vật thể",
    icon: Music,
    emojis: ["🎉", "🎊", "🎁", "🏆", "⭐", "🌟", "💡", "💰", "📱", "💻", "🎮", "🎵", "🎶", "🎸", "🎤", "🎬"],
  },
];

const STICKER_CATEGORIES = [
  {
    name: "Dễ thương",
    icon: Cat,
    stickers: ["🐱", "🐶", "🐰", "🐻", "🐼", "🦊", "🐸", "🐵", "🦄", "🐥", "🐧", "🦋"],
  },
  {
    name: "Chúc mừng",
    icon: PartyPopper,
    stickers: ["🎉", "🎊", "🥳", "🎁", "🏆", "🎂", "🎈", "🪅", "🎆", "🎇", "✨", "🌈"],
  },
  {
    name: "Yêu thương",
    icon: Heart,
    stickers: ["💖", "💕", "💗", "💓", "💘", "💝", "🥰", "😍", "😘", "🫶", "💑", "💐"],
  },
];

export function ChatEmojiStickerPicker({
  onEmojiSelect,
  onSendSticker,
  disabled,
}: ChatEmojiStickerPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tab, setTab] = useState<TabType>("emoji");
  const [emojiCatIdx, setEmojiCatIdx] = useState(0);
  const [stickerCatIdx, setStickerCatIdx] = useState(0);

  const handleEmojiSelect = (emoji: string) => {
    onEmojiSelect(emoji);
  };

  const handleStickerSelect = (sticker: string) => {
    onSendSticker(sticker);
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-11 w-11 rounded-full flex-shrink-0 text-muted-foreground hover:text-yellow-500"
          disabled={disabled}
        >
          <Smile className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start" side="top">
        {/* Main tabs: Emoji / Sticker */}
        <div className="flex border-b border-border">
          <button
            type="button"
            onClick={() => setTab("emoji")}
            className={cn(
              "flex-1 py-2 text-xs font-medium transition-colors",
              tab === "emoji"
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            😊 Emoji
          </button>
          <button
            type="button"
            onClick={() => setTab("sticker")}
            className={cn(
              "flex-1 py-2 text-xs font-medium transition-colors",
              tab === "sticker"
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            🐱 Sticker
          </button>
        </div>

        <div className="p-2">
          {tab === "emoji" ? (
            <>
              {/* Emoji category tabs */}
              <div className="flex gap-1 mb-2 border-b border-border pb-2">
                {EMOJI_CATEGORIES.map((cat, idx) => {
                  const Icon = cat.icon;
                  return (
                    <Button
                      key={cat.name}
                      type="button"
                      variant={emojiCatIdx === idx ? "secondary" : "ghost"}
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setEmojiCatIdx(idx)}
                      title={cat.name}
                    >
                      <Icon className="h-4 w-4" />
                    </Button>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground mb-1 px-1">
                {EMOJI_CATEGORIES[emojiCatIdx].name}
              </p>
              <div className="grid grid-cols-8 gap-1">
                {EMOJI_CATEGORIES[emojiCatIdx].emojis.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => handleEmojiSelect(emoji)}
                    className="w-8 h-8 flex items-center justify-center text-lg hover:bg-muted rounded transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              {/* Sticker category tabs */}
              <div className="flex gap-1 mb-2 border-b border-border pb-2">
                {STICKER_CATEGORIES.map((cat, idx) => {
                  const Icon = cat.icon;
                  return (
                    <Button
                      key={cat.name}
                      type="button"
                      variant={stickerCatIdx === idx ? "secondary" : "ghost"}
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setStickerCatIdx(idx)}
                      title={cat.name}
                    >
                      <Icon className="h-4 w-4" />
                    </Button>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground mb-1 px-1">
                {STICKER_CATEGORIES[stickerCatIdx].name}
              </p>
              <div className="grid grid-cols-6 gap-1">
                {STICKER_CATEGORIES[stickerCatIdx].stickers.map((sticker) => (
                  <button
                    key={sticker}
                    type="button"
                    onClick={() => handleStickerSelect(sticker)}
                    className="w-12 h-12 flex items-center justify-center text-3xl hover:bg-muted rounded-lg transition-colors hover:scale-110"
                  >
                    {sticker}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground mt-2 text-center">
                Nhấn sticker để gửi ngay
              </p>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
