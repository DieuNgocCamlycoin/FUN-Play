import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Loader2, Smile } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const COMMENT_EMOJIS = [
  "❤️", "🧡", "💛", "💚", "💙", "💜", "😊", "😄", "🥳",
  "🤗", "😍", "😘", "🥰", "😎", "🤩", "👍", "👏", "💪",
  "✌️", "🙌", "🤝", "✨", "🔥", "⭐", "🥇", "🏆", "🎉",
  "💯", "🌟", "🦋", "🌸",
];

interface PostCommentInputProps {
  onSubmit: (content: string) => Promise<boolean>;
  submitting?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
  onCancel?: () => void;
  showCancelButton?: boolean;
  compact?: boolean;
}

export const PostCommentInput: React.FC<PostCommentInputProps> = ({
  onSubmit,
  submitting = false,
  placeholder = "Viết bình luận...",
  autoFocus = false,
  onCancel,
  showCancelButton = false,
  compact = false
}) => {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim() || submitting) return;

    const success = await onSubmit(content);
    if (success) {
      setContent('');
      setIsFocused(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent = content.slice(0, start) + emoji + content.slice(end);
      setContent(newContent);
      requestAnimationFrame(() => {
        textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
        textarea.focus();
      });
    } else {
      setContent(prev => prev + emoji);
    }
    setEmojiOpen(false);
  };

  if (!user) {
    return (
      <div className="bg-muted/50 rounded-lg p-4 text-center text-muted-foreground">
        <p>Vui lòng <a href="/auth" className="text-primary hover:underline">đăng nhập</a> để bình luận</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="relative">
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          disabled={submitting}
          className={cn(
            "resize-none transition-all duration-200 bg-background/50 border-border/50 focus:border-primary/50 pr-10",
            compact ? "min-h-[60px]" : "min-h-[80px]",
            isFocused && "min-h-[100px]"
          )}
          maxLength={1000}
        />
        
        {/* Emoji picker button */}
        <Popover open={emojiOpen} onOpenChange={setEmojiOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-2 top-2 h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
            >
              <Smile className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-3" align="end" side="top">
            <div className="grid grid-cols-7 gap-1">
              {COMMENT_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  className="text-lg hover:bg-muted rounded-md p-1 transition-colors cursor-pointer"
                  onClick={() => handleEmojiSelect(emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>
      
      {(isFocused || content.trim()) && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {content.length}/1000 • Ctrl+Enter để gửi
          </span>
          
          <div className="flex gap-2">
            {showCancelButton && onCancel && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setContent('');
                  setIsFocused(false);
                  onCancel();
                }}
                disabled={submitting}
              >
                Hủy
              </Button>
            )}
            
            <Button
              type="submit"
              size="sm"
              disabled={!content.trim() || submitting}
              className="gap-2"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Gửi
            </Button>
          </div>
        </div>
      )}
    </form>
  );
};
