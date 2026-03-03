import { cn } from "@/lib/utils";

interface ReactionGroup {
  emoji: string;
  count: number;
  hasMyReaction: boolean;
}

interface ChatMessageReactionsProps {
  reactions: ReactionGroup[];
  onToggleReaction: (emoji: string) => void;
  isMe: boolean;
}

const EMOJI_ORDER = ["🙏", "🥰", "❤️", "😂", "😮", "👍"];

export const ChatMessageReactions = ({
  reactions,
  onToggleReaction,
  isMe,
}: ChatMessageReactionsProps) => {
  if (!reactions || reactions.length === 0) return null;

  // Sort by defined order
  const sorted = [...reactions].sort(
    (a, b) => EMOJI_ORDER.indexOf(a.emoji) - EMOJI_ORDER.indexOf(b.emoji)
  );

  return (
    <div
      className={cn(
        "flex flex-wrap gap-1 mt-0.5",
        isMe ? "justify-end mr-1" : "justify-start ml-1"
      )}
    >
      {sorted.map(({ emoji, count, hasMyReaction }) => (
        <button
          key={emoji}
          onClick={() => onToggleReaction(emoji)}
          className={cn(
            "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs transition-colors",
            hasMyReaction
              ? "bg-purple-100 dark:bg-purple-900/40 border border-purple-300 dark:border-purple-600"
              : "bg-muted/80 hover:bg-muted border border-transparent"
          )}
        >
          <span className="text-sm">{emoji}</span>
          <span className={cn(
            "font-medium",
            hasMyReaction ? "text-purple-600 dark:text-purple-300" : "text-muted-foreground"
          )}>
            {count}
          </span>
        </button>
      ))}
    </div>
  );
};
