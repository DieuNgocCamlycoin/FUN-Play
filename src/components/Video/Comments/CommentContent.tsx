import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

interface CommentContentProps {
  content: string;
  onTimestampClick?: (seconds: number) => void;
  /** @deprecated Use onTimestampClick instead */
  onSeek?: (seconds: number) => void;
}

type ContentPart = {
  type: "text" | "timestamp" | "mention";
  value: string;
  seconds?: number;
  username?: string;
};

// Parse timestamp string to seconds
function parseTimestamp(timestamp: string): number {
  const parts = timestamp.split(":").map(Number);
  
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  
  return 0;
}

export function CommentContent({ content, onTimestampClick, onSeek }: CommentContentProps) {
  const navigate = useNavigate();
  const handleTimestamp = onTimestampClick || onSeek;

  const parts = useMemo(() => {
    const result: ContentPart[] = [];
    
    // Combined regex for timestamps and mentions
    const regex = /(@\w+)|(\d{1,2}:\d{2}(?::\d{2})?)/g;
    
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        result.push({
          type: "text",
          value: content.slice(lastIndex, match.index),
        });
      }

      if (match[1]) {
        // Mention
        const username = match[1].slice(1);
        result.push({
          type: "mention",
          value: match[1],
          username,
        });
      } else if (match[2]) {
        // Timestamp
        const seconds = parseTimestamp(match[2]);
        result.push({
          type: "timestamp",
          value: match[2],
          seconds,
        });
      }

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
      result.push({
        type: "text",
        value: content.slice(lastIndex),
      });
    }

    return result;
  }, [content]);

  const handleMentionClick = (username: string) => {
    navigate(`/channel?search=${username}`);
  };

  return (
    <span className="whitespace-pre-wrap break-words">
      {parts.map((part, index) => {
        if (part.type === "timestamp" && handleTimestamp) {
          return (
            <button
              key={index}
              onClick={() => handleTimestamp(part.seconds!)}
              className="text-primary hover:text-primary/80 font-medium hover:underline transition-colors"
            >
              {part.value}
            </button>
          );
        }

        if (part.type === "mention") {
          return (
            <button
              key={index}
              onClick={() => handleMentionClick(part.username!)}
              className="text-primary hover:text-primary/80 font-medium hover:underline transition-colors"
            >
              {part.value}
            </button>
          );
        }

        return <span key={index}>{part.value}</span>;
      })}
    </span>
  );
}
