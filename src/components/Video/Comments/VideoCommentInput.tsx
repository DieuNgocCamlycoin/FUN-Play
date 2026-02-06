import { useState, useRef, useEffect, useCallback } from "react";
import { Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  showCancel?: boolean;
  maxLength?: number;
  submitting?: boolean;
  avatarUrl?: string | null;
  compact?: boolean;
}

export function VideoCommentInput({
  onSubmit,
  placeholder = "Viết bình luận...",
  autoFocus = false,
  onCancel,
  showCancel = false,
  maxLength = 1000,
  submitting = false,
  compact = false,
}: VideoCommentInputProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [content, setContent] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Mention autocomplete state
  const { users: mentionUsers, loading: mentionLoading, searchUsers, clearUsers } = useMentionSearch();
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionStartIndex, setMentionStartIndex] = useState(-1);
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [content]);

  // Detect @mention while typing
  const handleContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value.slice(0, maxLength);
    setContent(newContent);

    const textarea = e.target;
    const cursorPos = textarea.selectionStart;
    const textBeforeCursor = newContent.slice(0, cursorPos);

    const lastAtIndex = textBeforeCursor.lastIndexOf("@");

    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1);
      const hasSpace = /\s/.test(textAfterAt);

      if (!hasSpace) {
        const query = textAfterAt;
        setMentionQuery(query);
        setMentionStartIndex(lastAtIndex);
        setShowMentions(true);
        setSelectedMentionIndex(0);
        searchUsers(query);
        return;
      }
    }

    setShowMentions(false);
    setMentionQuery("");
    setMentionStartIndex(-1);
    clearUsers();
  }, [maxLength, searchUsers, clearUsers]);

  const handleMentionSelect = useCallback((selectedUser: MentionUser) => {
    if (mentionStartIndex === -1) return;

    const beforeMention = content.slice(0, mentionStartIndex);
    const afterMention = content.slice(mentionStartIndex + 1 + mentionQuery.length);
    const newContent = `${beforeMention}@${selectedUser.username} ${afterMention}`;

    setContent(newContent);
    setShowMentions(false);
    setMentionQuery("");
    setMentionStartIndex(-1);
    clearUsers();

    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPos = beforeMention.length + selectedUser.username.length + 2;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  }, [content, mentionStartIndex, mentionQuery, clearUsers]);

  const handleSubmit = async () => {
    if (!content.trim() || submitting) return;

    setShowMentions(false);
    const success = await onSubmit(content);
    if (success) {
      setContent("");
      setIsFocused(false);
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Handle mention navigation
    if (showMentions && mentionUsers.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedMentionIndex(prev => prev < mentionUsers.length - 1 ? prev + 1 : 0);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedMentionIndex(prev => prev > 0 ? prev - 1 : mentionUsers.length - 1);
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        handleMentionSelect(mentionUsers[selectedMentionIndex]);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setShowMentions(false);
        clearUsers();
        return;
      }
    }

    // Ctrl+Enter to submit
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
    }

    if (e.key === "Escape") {
      handleCancel();
    }
  };

  const handleCancel = () => {
    setContent("");
    setIsFocused(false);
    setShowMentions(false);
    clearUsers();
    onCancel?.();
  };

  const handleEmojiSelect = (emoji: string) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent = content.slice(0, start) + emoji + content.slice(end);
      setContent(newContent);

      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
        textarea.focus();
      }, 0);
    } else {
      setContent(prev => prev + emoji);
    }
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
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleContentChange}
            onFocus={() => setIsFocused(true)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={1}
            className={cn(
              "w-full bg-transparent border-0 border-b border-muted focus:border-foreground outline-none resize-none text-sm text-foreground placeholder:text-muted-foreground py-2 pr-10 transition-colors",
              compact && "text-sm border rounded-lg px-3"
            )}
            disabled={submitting}
          />
          <MentionAutocomplete
            results={mentionUsers}
            loading={mentionLoading}
            visible={showMentions}
            selectedIndex={selectedMentionIndex}
            onSelect={handleMentionSelect}
          />
          <div className="absolute right-0 bottom-1">
            <EmojiPicker onEmojiSelect={handleEmojiSelect} />
          </div>
        </div>

        {/* Actions */}
        {(isFocused || content.trim()) && (
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-muted-foreground">
              {content.length}/{maxLength}
            </span>

            <div className="flex gap-2">
              {(showCancel || onCancel) && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleCancel}
                  disabled={submitting}
                >
                  {compact ? <X className="h-4 w-4" /> : "Hủy"}
                </Button>
              )}
              <Button
                type="button"
                size={compact ? "icon" : "sm"}
                onClick={handleSubmit}
                disabled={!content.trim() || submitting}
              >
                {submitting ? (
                  "⏳"
                ) : compact ? (
                  <Send className="h-4 w-4" />
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-1" />
                    Bình luận
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
