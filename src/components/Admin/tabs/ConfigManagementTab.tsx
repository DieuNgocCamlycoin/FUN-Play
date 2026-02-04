import { useState, useEffect, useRef } from "react";
import { useRewardConfig, CONFIG_KEYS } from "@/hooks/useRewardConfig";
import { useUpdateClaimSound } from "@/hooks/useClaimNotificationSound";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Settings, Coins, Eye, MessageSquare, Upload, Heart, 
  Clock, Hash, Save, History, RefreshCw, Bell, Play, Pause, Music, Volume2
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";

export function ConfigManagementTab() {
  const { configs, history, loading, updating, updateConfig } = useRewardConfig();
  const { updateClaimSound, updating: updatingSoundConfig } = useUpdateClaimSound();
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [claimSoundUrl, setClaimSoundUrl] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const values: Record<string, string> = {};
    configs.forEach(c => {
      values[c.config_key] = c.config_value.toString();
    });
    setEditValues(values);
  }, [configs]);

  useEffect(() => {
    const fetchClaimSound = async () => {
      const { data } = await supabase
        .from('reward_config')
        .select('config_text')
        .eq('config_key', 'CLAIM_NOTIFICATION_SOUND')
        .single();
      if (data?.config_text) {
        setClaimSoundUrl(data.config_text);
      }
    };
    fetchClaimSound();
  }, []);

  const handleSave = async (configKey: string) => {
    const newValue = parseFloat(editValues[configKey]);
    if (isNaN(newValue)) return;
    await updateConfig(configKey, newValue);
  };

  const handlePlayPreview = () => {
    if (!claimSoundUrl) return;
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    } else {
      audioRef.current = new Audio(claimSoundUrl);
      audioRef.current.volume = 0.6;
      audioRef.current.play().catch(console.error);
      audioRef.current.onended = () => setIsPlaying(false);
      setIsPlaying(true);
    }
  };

  const handleSaveClaimSound = async () => {
    if (!claimSoundUrl.trim()) {
      toast({ title: "Lỗi", description: "Vui lòng nhập URL nhạc chuông", variant: "destructive" });
      return;
    }
    const success = await updateClaimSound(claimSoundUrl.trim());
    if (success) {
      toast({ title: "Thành công", description: "Đã lưu nhạc chuông claim CAMLY!" });
    }
  };

  const getConfigIcon = (key: string) => {
    if (key.includes('VIEW')) return <Eye className="w-4 h-4" />;
    if (key.includes('COMMENT')) return <MessageSquare className="w-4 h-4" />;
    if (key.includes('UPLOAD')) return <Upload className="w-4 h-4" />;
    if (key.includes('LIKE')) return <Heart className="w-4 h-4" />;
    if (key.includes('WATCH') || key.includes('LIMIT')) return <Clock className="w-4 h-4" />;
    return <Coins className="w-4 h-4" />;
  };

  const getConfigCategory = (key: string): 'rewards' | 'limits' | 'validation' => {
    if (key.includes('REWARD') && !key.includes('LIMIT')) return 'rewards';
    if (key.includes('LIMIT') || key.includes('MAX')) return 'limits';
    return 'validation';
  };

  const rewardConfigs = configs.filter(c => getConfigCategory(c.config_key) === 'rewards');
  const limitConfigs = configs.filter(c => getConfigCategory(c.config_key) === 'limits');
  const validationConfigs = configs.filter(c => getConfigCategory(c.config_key) === 'validation');

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  const ConfigCard = ({ config }: { config: typeof configs[0] }) => {
    const hasChanged = editValues[config.config_key] !== config.config_value.toString();
    
    return (
      <Card className="hover:border-primary/50 transition-colors">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              {getConfigIcon(config.config_key)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-sm">{config.config_key}</span>
                {hasChanged && (
                  <Badge variant="outline" className="text-xs text-amber-500 border-amber-500">
                    Chưa lưu
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mb-3">{config.description}</p>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={editValues[config.config_key] || ''}
                  onChange={(e) => setEditValues(prev => ({
                    ...prev,
                    [config.config_key]: e.target.value
                  }))}
                  className="h-8 w-32"
                />
                <Button
                  size="sm"
                  onClick={() => handleSave(config.config_key)}
                  disabled={!hasChanged || updating}
                  className="h-8"
                >
                  <Save className="w-3 h-3 mr-1" />
                  Lưu
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Cập nhật: {format(new Date(config.updated_at), 'dd/MM/yyyy HH:mm')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <Tabs defaultValue="rewards" className="w-full">
      <TabsList className="grid w-full grid-cols-4 mb-4">
        <TabsTrigger value="rewards" className="gap-1 text-xs">
          <Coins className="w-3 h-3" /> Mức thưởng
        </TabsTrigger>
        <TabsTrigger value="limits" className="gap-1 text-xs">
          <Clock className="w-3 h-3" /> Giới hạn
        </TabsTrigger>
        <TabsTrigger value="notification" className="gap-1 text-xs">
          <Bell className="w-3 h-3" /> Nhạc chuông
        </TabsTrigger>
        <TabsTrigger value="history" className="gap-1 text-xs">
          <History className="w-3 h-3" /> Lịch sử
        </TabsTrigger>
      </TabsList>

      <TabsContent value="rewards">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-[#FFD700]" />
              Mức Thưởng CAMLY
            </CardTitle>
            <CardDescription>Số CAMLY người dùng nhận được cho mỗi hành động</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rewardConfigs.map(config => (
                <ConfigCard key={config.id} config={config} />
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="limits">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#FF6B6B]" />
              Giới Hạn Hàng Ngày
            </CardTitle>
            <CardDescription>Giới hạn phần thưởng để chống gian lận</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {limitConfigs.map(config => (
                <ConfigCard key={config.id} config={config} />
              ))}
            </div>
          </CardContent>
        </Card>

        {validationConfigs.length > 0 && (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-[#00E7FF]" />
                Điều Kiện Hợp Lệ
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {validationConfigs.map(config => (
                  <ConfigCard key={config.id} config={config} />
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="notification">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-[#FFD700]" />
              Nhạc Chuông Claim CAMLY
            </CardTitle>
            <CardDescription>Nhạc chuông phát cho tất cả người dùng khi claim thành công</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Music className="w-4 h-4" />
                URL Nhạc Chuông
              </Label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={claimSoundUrl}
                  onChange={(e) => setClaimSoundUrl(e.target.value)}
                  placeholder="https://example.com/sound.mp3"
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handlePlayPreview}
                  disabled={!claimSoundUrl}
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {claimSoundUrl && (
              <Card className="bg-gradient-to-r from-yellow-500/10 to-cyan-500/10 border-yellow-500/30">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-yellow-500/20">
                      <Volume2 className="w-5 h-5 text-yellow-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">Nhạc chuông hiện tại</p>
                      <p className="text-xs text-muted-foreground truncate">{claimSoundUrl}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Button
              onClick={handleSaveClaimSound}
              disabled={updatingSoundConfig}
              className="w-full bg-gradient-to-r from-yellow-500 to-cyan-500"
            >
              {updatingSoundConfig ? (
                <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Đang lưu...</>
              ) : (
                <><Save className="w-4 h-4 mr-2" /> Lưu Nhạc Chuông</>
              )}
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="history">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Lịch Sử Thay Đổi
            </CardTitle>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Chưa có lịch sử thay đổi</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Config Key</TableHead>
                    <TableHead>Giá trị cũ</TableHead>
                    <TableHead>Giá trị mới</TableHead>
                    <TableHead>Thời gian</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.slice(0, 50).map((h) => (
                    <TableRow key={h.id}>
                      <TableCell className="font-mono text-sm">{h.config_key}</TableCell>
                      <TableCell className="text-red-500">{h.old_value?.toLocaleString() ?? 'N/A'}</TableCell>
                      <TableCell className="text-green-500">{h.new_value.toLocaleString()}</TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(h.changed_at), 'dd/MM/yyyy HH:mm')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
