import { useState } from "react";
import { Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
}

const EMOJI_CATEGORIES = {
  "Thường dùng": ["😀", "😂", "🥰", "😍", "🤩", "😎", "🙌", "👏", "🔥", "💯", "❤️", "💕"],
  "Cảm xúc": ["😊", "😁", "😆", "😅", "🤣", "😢", "😭", "😤", "😠", "🥺", "😱", "🤯"],
  "Cử chỉ": ["👍", "👎", "👌", "✌️", "🤞", "🤙", "💪", "🙏", "🤝", "👊", "✊", "🫶"],
  "Vật thể": ["🎉", "🎊", "🎁", "🏆", "⭐", "🌟", "💡", "💰", "📱", "💻", "🎮", "🎵"],
};

export function EmojiPicker({ onEmojiSelect }: EmojiPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

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
      <PopoverContent className="w-72 p-2" align="start">
        <div className="space-y-3">
          {Object.entries(EMOJI_CATEGORIES).map(([category, emojis]) => (
            <div key={category}>
              <p className="text-xs text-muted-foreground mb-1 px-1">{category}</p>
              <div className="flex flex-wrap gap-1">
                {emojis.map((emoji) => (
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
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
