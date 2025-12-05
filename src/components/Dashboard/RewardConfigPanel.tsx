import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Settings, Save, RefreshCw } from "lucide-react";

interface RewardConfig {
  reward_enabled: boolean;
  reward_amount: number;
  min_watch_percentage: number;
  reward_token: string;
}

export const RewardConfigPanel = () => {
  const [config, setConfig] = useState<RewardConfig>({
    reward_enabled: true,
    reward_amount: 9.999,
    min_watch_percentage: 80,
    reward_token: "CAMLY",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const { data, error } = await supabase
        .from("reward_settings")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setConfig({
          reward_enabled: data.reward_enabled,
          reward_amount: Number(data.reward_amount),
          min_watch_percentage: data.min_watch_percentage,
          reward_token: data.reward_token,
        });
      }
    } catch (error) {
      console.error("Error fetching reward config:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("reward_settings")
        .update({
          reward_enabled: config.reward_enabled,
          reward_amount: config.reward_amount,
          min_watch_percentage: config.min_watch_percentage,
          reward_token: config.reward_token,
          updated_at: new Date().toISOString(),
        })
        .eq("id", (await supabase.from("reward_settings").select("id").limit(1).single()).data?.id);

      if (error) throw error;

      toast({
        title: "Đã lưu cấu hình",
        description: "Cấu hình phần thưởng đã được cập nhật",
      });
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể lưu cấu hình",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <CardTitle>Cấu hình phần thưởng</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-32 bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-[#FFD700]/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-[#FFD700]" />
          Cấu hình phần thưởng
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="reward-enabled" className="text-base font-medium">
              Kích hoạt phần thưởng
            </Label>
            <p className="text-sm text-muted-foreground">
              Bật/tắt hệ thống phần thưởng CAMLY
            </p>
          </div>
          <Switch
            id="reward-enabled"
            checked={config.reward_enabled}
            onCheckedChange={(checked) =>
              setConfig({ ...config, reward_enabled: checked })
            }
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="reward-amount">Số CAMLY mỗi lượt xem</Label>
            <Input
              id="reward-amount"
              type="number"
              step="0.001"
              value={config.reward_amount}
              onChange={(e) =>
                setConfig({ ...config, reward_amount: parseFloat(e.target.value) || 0 })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="min-watch">Phần trăm xem tối thiểu (%)</Label>
            <Input
              id="min-watch"
              type="number"
              min="1"
              max="100"
              value={config.min_watch_percentage}
              onChange={(e) =>
                setConfig({ ...config, min_watch_percentage: parseInt(e.target.value) || 80 })
              }
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="reward-token">Token phần thưởng</Label>
          <Input
            id="reward-token"
            value={config.reward_token}
            onChange={(e) =>
              setConfig({ ...config, reward_token: e.target.value })
            }
            disabled
          />
          <p className="text-xs text-muted-foreground">
            Token address: 0x0910320181889fefde0bb1ca63962b0a8882e413 (BSC)
          </p>
        </div>

        <div className="flex gap-2">
          <Button onClick={saveConfig} disabled={saving} className="flex-1">
            {saving ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Lưu cấu hình
          </Button>
          <Button variant="outline" onClick={fetchConfig}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
