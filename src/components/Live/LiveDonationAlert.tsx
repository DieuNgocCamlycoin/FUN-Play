import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Gift } from "lucide-react";

type DonationAlert = {
  id: string;
  senderName: string;
  amount: number;
  message?: string;
};

interface LiveDonationAlertProps {
  livestreamId: string;
}

export const LiveDonationAlert = ({ livestreamId }: LiveDonationAlertProps) => {
  const [alerts, setAlerts] = useState<DonationAlert[]>([]);

  useEffect(() => {
    const channel = supabase
      .channel(`donation-alerts-${livestreamId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "livestream_chat",
          filter: `livestream_id=eq.${livestreamId}`,
        },
        async (payload) => {
          const msg = payload.new as any;
          if (msg.message_type !== "donation") return;

          const { data: profile } = await supabase
            .from("profiles")
            .select("display_name, username")
            .eq("id", msg.user_id)
            .single();

          // Parse donation info from content (format: "amount|message")
          const [amountStr, ...msgParts] = (msg.content || "0").split("|");

          const alert: DonationAlert = {
            id: msg.id,
            senderName: profile?.display_name || profile?.username || "Ẩn danh",
            amount: parseFloat(amountStr) || 0,
            message: msgParts.join("|") || undefined,
          };

          setAlerts((prev) => [...prev, alert]);
          setTimeout(() => {
            setAlerts((prev) => prev.filter((a) => a.id !== alert.id));
          }, 5000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [livestreamId]);

  return (
    <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
      <AnimatePresence>
        {alerts.map((alert) => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, y: -30, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            transition={{ type: "spring", damping: 15 }}
            className="bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl px-5 py-3 shadow-lg mb-2 flex items-center gap-3"
          >
            <Gift className="h-6 w-6 shrink-0" />
            <div>
              <p className="font-bold text-sm">
                {alert.senderName} đã tặng {alert.amount.toLocaleString("vi-VN")} CAMLY
              </p>
              {alert.message && (
                <p className="text-xs text-white/80 mt-0.5">{alert.message}</p>
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
