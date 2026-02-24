import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { formatViewsShort } from "@/lib/formatters";

interface MiniProfileCardProps {
  channelId: string;
  channelName: string;
  subscriberCount: number;
  onSubscribeChange?: () => void;
  isOwnChannel?: boolean;
}

export const MiniProfileCard = ({
  channelId,
  channelName,
  subscriberCount,
  onSubscribeChange,
  isOwnChannel = false,
}: MiniProfileCardProps) => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && channelId) {
      checkSubscription();
    }
  }, [user, channelId]);

  const checkSubscription = async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from("subscriptions")
        .select("id")
        .eq("channel_id", channelId)
        .eq("subscriber_id", user.id)
        .maybeSingle();

      setIsSubscribed(!!data);
    } catch (error) {
      console.error("Error checking subscription:", error);
    }
  };

  const handleSubscribe = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!user) {
      navigate("/auth");
      return;
    }

    setLoading(true);
    try {
      if (isSubscribed) {
        await supabase
          .from("subscriptions")
          .delete()
          .eq("channel_id", channelId)
          .eq("subscriber_id", user.id);

        // subscriber_count is updated automatically by database trigger

        setIsSubscribed(false);
        toast({
          title: "Đã hủy đăng ký",
          description: "Bạn đã hủy đăng ký kênh này",
        });
      } else {
        await supabase.from("subscriptions").insert({
          channel_id: channelId,
          subscriber_id: user.id,
        });

        // subscriber_count is updated automatically by database trigger

        setIsSubscribed(true);
        toast({
          title: "Đã đăng ký!",
          description: "Bạn đã đăng ký kênh này",
        });
      }

      if (onSubscribeChange) {
        onSubscribeChange();
      }
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="absolute z-50 p-4 glass-card border-2 border-cosmic-cyan/30 shadow-[0_0_40px_rgba(0,255,255,0.3)] min-w-[280px]">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cosmic-sapphire via-cosmic-cyan to-cosmic-magenta flex items-center justify-center text-foreground font-bold text-xl shadow-[0_0_30px_rgba(0,255,255,0.7)]">
          {channelName[0]}
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-foreground">{channelName}</h3>
          <p className="text-sm text-muted-foreground">
            {formatViewsShort(subscriberCount)} người đăng ký
          </p>
        </div>
      </div>
      {!isOwnChannel && (
        <Button
          onClick={handleSubscribe}
          disabled={loading}
          className={`w-full rounded-full ${
            isSubscribed
              ? "bg-muted hover:bg-muted/80 text-foreground"
              : "bg-gradient-to-r from-cosmic-sapphire to-cosmic-cyan hover:from-cosmic-sapphire/90 hover:to-cosmic-cyan/90 text-foreground shadow-[0_0_30px_rgba(0,255,255,0.5)]"
          }`}
        >
          {isSubscribed ? "Đã đăng ký" : "Đăng ký"}
        </Button>
      )}
    </Card>
  );
};
