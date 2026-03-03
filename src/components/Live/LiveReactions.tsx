import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

const REACTION_EMOJIS = ["🙏", "🥰", "❤️", "😂", "😮", "🎉"];

type FloatingReaction = {
  id: string;
  emoji: string;
  x: number;
};

interface LiveReactionsProps {
  livestreamId: string;
  onSendReaction?: (emoji: string) => void;
}

export const LiveReactions = ({ livestreamId, onSendReaction }: LiveReactionsProps) => {
  const [floating, setFloating] = useState<FloatingReaction[]>([]);

  useEffect(() => {
    const channel = supabase
      .channel(`reactions-${livestreamId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "livestream_reactions",
          filter: `livestream_id=eq.${livestreamId}`,
        },
        (payload) => {
          const r = payload.new as { id: string; emoji: string };
          const id = r.id;
          setFloating((prev) => [
            ...prev.slice(-20),
            { id, emoji: r.emoji, x: 10 + Math.random() * 80 },
          ]);
          setTimeout(() => {
            setFloating((prev) => prev.filter((f) => f.id !== id));
          }, 3000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [livestreamId]);

  const handleReact = useCallback(
    async (emoji: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from("livestream_reactions").insert({
        livestream_id: livestreamId,
        user_id: user.id,
        emoji,
      });
      onSendReaction?.(emoji);
    },
    [livestreamId, onSendReaction]
  );

  return (
    <>
      {/* Floating reactions overlay */}
      <div className="absolute bottom-20 right-4 w-16 h-64 pointer-events-none overflow-hidden">
        <AnimatePresence>
          {floating.map((r) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 1, y: 0, scale: 0.5 }}
              animate={{ opacity: 0, y: -250, scale: 1.2 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2.5, ease: "easeOut" }}
              className="absolute text-2xl"
              style={{ left: `${r.x}%` }}
            >
              {r.emoji}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Reaction buttons */}
      <div className="flex items-center gap-1">
        {REACTION_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => handleReact(emoji)}
            className="text-lg hover:scale-125 transition-transform p-1"
            title={emoji}
          >
            {emoji}
          </button>
        ))}
      </div>
    </>
  );
};
