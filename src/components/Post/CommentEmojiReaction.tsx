import { useState } from 'react';
import { Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const REACTION_EMOJIS = ["❤️", "😍", "😂", "😮", "😢", "👏", "🔥", "🎉"];

interface CommentEmojiReactionProps {
  onEmojiSelect: (emoji: string) => void;
  selectedEmoji?: string;
}

export const CommentEmojiReaction = ({ onEmojiSelect, selectedEmoji }: CommentEmojiReactionProps) => {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
        >
          <Smile className="h-3.5 w-3.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2" align="start" side="top">
        <div className="flex gap-1">
          {REACTION_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              className="text-lg hover:bg-muted rounded-md p-1 transition-colors cursor-pointer hover:scale-125"
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
