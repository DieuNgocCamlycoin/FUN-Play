import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

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

  if (!user) {
    return (
      <div className="bg-muted/50 rounded-lg p-4 text-center text-muted-foreground">
        <p>Vui lòng <a href="/auth" className="text-primary hover:underline">đăng nhập</a> để bình luận</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoFocus={autoFocus}
        disabled={submitting}
        className={cn(
          "resize-none transition-all duration-200 bg-background/50 border-border/50 focus:border-primary/50",
          compact ? "min-h-[60px]" : "min-h-[80px]",
          isFocused && "min-h-[100px]"
        )}
        maxLength={1000}
      />
      
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
