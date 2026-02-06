import { useState, useRef, useCallback, KeyboardEvent } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EmojiPicker } from "./EmojiPicker";
import { MentionAutocomplete } from "./MentionAutocomplete";
import { useMentionSearch, type MentionUser } from "@/hooks/useMentionSearch";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

interface VideoCommentInputProps {
  onSubmit: (content: string) => Promise<boolean>;
  placeholder?: string;
  autoFocus?: boolean;
  onCancel?: () => void;
  submitting?: boolean;
  compact?: boolean;
}

export function VideoCommentInput({
  onSubmit,
  placeholder = "Viết bình luận...",
  autoFocus = false,
  onCancel,
  submitting = false,
  compact = false,
}: VideoCommentInputProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [content, setContent] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionIndex, setMentionIndex] = useState(0);
  const [showMentionPopup, setShowMentionPopup] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { results: mentionResults, loading: mentionLoading, searchUsers, clearResults } = useMentionSearch();

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const cursor = e.target.selectionStart || 0;
    setContent(value);
    setCursorPosition(cursor);

    // Check for @mention
    const textBeforeCursor = value.slice(0, cursor);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);

    if (mentionMatch) {
      const query = mentionMatch[1];
      setMentionQuery(query);
      setShowMentionPopup(true);
      setMentionIndex(0);
      searchUsers(query);
    } else {
      setShowMentionPopup(false);
      clearResults();
    }
  }, [searchUsers, clearResults]);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (showMentionPopup && mentionResults.length > 0) {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setMentionIndex(prev => (prev + 1) % mentionResults.length);
          break;
        case "ArrowUp":
          e.preventDefault();
          setMentionIndex(prev => (prev - 1 + mentionResults.length) % mentionResults.length);
          break;
        case "Enter":
          e.preventDefault();
          handleMentionSelect(mentionResults[mentionIndex]);
          break;
        case "Escape":
          e.preventDefault();
          setShowMentionPopup(false);
          clearResults();
          break;
      }
    } else if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }, [showMentionPopup, mentionResults, mentionIndex, clearResults]);

  const handleMentionSelect = useCallback((user: MentionUser) => {
    const textBeforeCursor = content.slice(0, cursorPosition);
    const textAfterCursor = content.slice(cursorPosition);
    
    // Find where the @ starts
    const mentionStart = textBeforeCursor.lastIndexOf("@");
    const newText = 
      textBeforeCursor.slice(0, mentionStart) + 
      `@${user.username} ` + 
      textAfterCursor;

    setContent(newText);
    setShowMentionPopup(false);
    clearResults();

    // Focus back to textarea
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPos = mentionStart + user.username.length + 2;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  }, [content, cursorPosition, clearResults]);

  const handleEmojiSelect = useCallback((emoji: string) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart || 0;
      const end = textarea.selectionEnd || 0;
      const newContent = content.slice(0, start) + emoji + content.slice(end);
      setContent(newContent);
      
      // Set cursor position after emoji
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + emoji.length, start + emoji.length);
      }, 0);
    } else {
      setContent(prev => prev + emoji);
    }
  }, [content]);

  const handleSubmit = async () => {
    if (!content.trim() || submitting) return;

    const success = await onSubmit(content);
    if (success) {
      setContent("");
      setIsFocused(false);
    }
  };

  const handleCancel = () => {
    setContent("");
    setIsFocused(false);
    onCancel?.();
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center py-4">
        <Button variant="outline" onClick={() => navigate("/auth")}>
          Đăng nhập để bình luận
        </Button>
      </div>
    );
  }

  return (
    <div className={`flex gap-3 ${compact ? "" : "mb-6"}`}>
      {!compact && (
        <Avatar className="h-10 w-10 flex-shrink-0">
          <AvatarFallback className="bg-primary text-primary-foreground">
            {user.email?.[0]?.toUpperCase() || "U"}
          </AvatarFallback>
        </Avatar>
      )}
      
      <div className="flex-1 relative">
        <Textarea
          ref={textareaRef}
          placeholder={placeholder}
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          autoFocus={autoFocus}
          className={`min-h-[${compact ? "60" : "40"}px] resize-none ${
            compact 
              ? "text-sm" 
              : "border-0 border-b border-border rounded-none px-0 focus-visible:ring-0 focus-visible:border-foreground"
          }`}
          rows={compact ? 2 : 1}
        />

        {/* Mention Autocomplete */}
        {showMentionPopup && (
          <MentionAutocomplete
            results={mentionResults}
            loading={mentionLoading}
            selectedIndex={mentionIndex}
            onSelect={handleMentionSelect}
          />
        )}

        {/* Actions */}
        {(isFocused || content.trim() || compact) && (
          <div className="flex items-center justify-between mt-2">
            <EmojiPicker onEmojiSelect={handleEmojiSelect} />
            
            <div className="flex gap-2">
              {(onCancel || !compact) && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleCancel}
                  disabled={submitting}
                >
                  Hủy
                </Button>
              )}
              <Button
                type="button"
                size={compact ? "icon" : "sm"}
                onClick={handleSubmit}
                disabled={!content.trim() || submitting}
              >
                {compact ? <Send className="h-4 w-4" /> : "Bình luận"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
