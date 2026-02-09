import { useState } from 'react';
import { Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const POSITIVE_EMOJI_CATEGORIES = [
  { name: "Tim ❤️", emojis: ["❤️", "😊", "😄", "😃", "😆", "😅", "😂", "🥰", "😍", "😘"] },
  { name: "Vui vẻ 😄", emojis: ["😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😜", "😝", "😋"] },
  { name: "Cảm xúc 😍", emojis: ["😍", "🥰", "😘", "😗", "😙", "😚", "😋", "😎", "😏", "😇"] },
  { name: "Năng lượng ⚡", emojis: ["⚡", "🔥", "💪", "🏆", "🎉", "🎊", "🥳", "🚀", "🌟", "✨"] },
];

interface PostEmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  selectedEmoji?: string | null;
}

export const PostEmojiPicker = ({ onEmojiSelect, selectedEmoji }: PostEmojiPickerProps) => {
  const [open, setOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState(0);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          {selectedEmoji ? (
            <span className="text-base">{selectedEmoji}</span>
          ) : (
            <Smile className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3" align="start" side="top">
        <div className="flex gap-1 mb-2 overflow-x-auto">
          {POSITIVE_EMOJI_CATEGORIES.map((cat, i) => (
            <Button
              key={cat.name}
              variant={activeCategory === i ? "default" : "ghost"}
              size="sm"
              className="text-xs whitespace-nowrap h-7 px-2"
              onClick={() => setActiveCategory(i)}
            >
              {cat.name}
            </Button>
          ))}
        </div>
        <div className="grid grid-cols-5 gap-1">
          {POSITIVE_EMOJI_CATEGORIES[activeCategory].emojis.map((emoji) => (
            <button
              key={emoji}
              className="text-xl hover:bg-muted rounded-md p-1.5 transition-colors cursor-pointer"
              onClick={() => {
                onEmojiSelect(emoji);
                setOpen(false);
              }}
            >
              {emoji}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};
