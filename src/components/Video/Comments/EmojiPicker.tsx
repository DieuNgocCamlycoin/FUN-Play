import { useState } from "react";
import { Smile, Heart, ThumbsUp, Star, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
}

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
    name: "Tim & Yêu thương",
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

export function EmojiPicker({ onEmojiSelect }: EmojiPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  const handleSelect = (emoji: string) => {
    onEmojiSelect(emoji);
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
        >
          <Smile className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-2" align="start">
        {/* Category tabs */}
        <div className="flex gap-1 mb-2 border-b border-border pb-2">
          {EMOJI_CATEGORIES.map((category, index) => {
            const Icon = category.icon;
            return (
              <Button
                key={category.name}
                type="button"
                variant={activeTab === index ? "secondary" : "ghost"}
                size="icon"
                className="h-7 w-7"
                onClick={() => setActiveTab(index)}
                title={category.name}
              >
                <Icon className="h-4 w-4" />
              </Button>
            );
          })}
        </div>

        {/* Emoji grid */}
        <div>
          <p className="text-xs text-muted-foreground mb-1 px-1">
            {EMOJI_CATEGORIES[activeTab].name}
          </p>
          <div className="grid grid-cols-8 gap-1">
            {EMOJI_CATEGORIES[activeTab].emojis.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => handleSelect(emoji)}
                className="w-8 h-8 flex items-center justify-center text-lg hover:bg-muted rounded transition-colors"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
