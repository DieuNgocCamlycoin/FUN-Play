import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface CommentContentProps {
  content: string;
  onSeek?: (seconds: number) => void;
}

type ContentPart = {
  type: "text" | "timestamp" | "mention";
  value: string;
  seconds?: number;
  username?: string;
};

export function CommentContent({ content, onSeek }: CommentContentProps) {
  const navigate = useNavigate();

  const parts = useMemo(() => {
    const result: ContentPart[] = [];
    
    // Combined regex for timestamps and mentions
    // Timestamps: 0:00, 1:23, 12:34, 1:23:45
    // Mentions: @username
    const regex = /(@\w+)|(\d{1,2}:\d{2}(?::\d{2})?)/g;
    
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(content)) !== null) {
      // Add text before match
      if (match.index > lastIndex) {
        result.push({
          type: "text",
          value: content.slice(lastIndex, match.index),
        });
      }

      if (match[1]) {
        // Mention
        const username = match[1].slice(1); // Remove @
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

    // Add remaining text
    if (lastIndex < content.length) {
      result.push({
        type: "text",
        value: content.slice(lastIndex),
      });
    }

    return result;
  }, [content]);

  const handleMentionClick = async (username: string) => {
    try {
      // Find user by username and navigate to their channel
      const { data } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", username)
        .maybeSingle();

      if (data) {
        const { data: channel } = await supabase
          .from("channels")
          .select("id")
          .eq("user_id", data.id)
          .maybeSingle();

        if (channel) {
          navigate(`/channel/${channel.id}`);
        }
      }
    } catch (error) {
      console.error("Error finding user channel:", error);
    }
  };

  const handleTimestampClick = (seconds: number) => {
    if (onSeek) {
      onSeek(seconds);
    }
  };

  return (
    <span className="whitespace-pre-wrap break-words">
      {parts.map((part, index) => {
        if (part.type === "timestamp") {
          return (
            <button
              key={index}
              onClick={() => handleTimestampClick(part.seconds!)}
              className="text-primary hover:text-primary/80 font-medium hover:underline"
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
              className="text-blue-500 hover:text-blue-400 font-medium hover:underline"
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

// Parse timestamp string to seconds
function parseTimestamp(timestamp: string): number {
  const parts = timestamp.split(":").map(Number);
  
  if (parts.length === 3) {
    // HH:MM:SS
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    // MM:SS
    return parts[0] * 60 + parts[1];
  }
  
  return 0;
}
