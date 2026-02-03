import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
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
import { 
  Settings, Coins, Eye, MessageSquare, Upload, Heart, 
  Clock, Hash, ShieldX, Save, History, ArrowLeft, RefreshCw,
  Bell, Play, Pause, Music, Volume2
} from "lucide-react";
import { format } from "date-fns";
import { Navigate, useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

const AdminRewardConfig = () => {
  const { user, loading: authLoading } = useAuth();
  const { configs, history, loading, updating, updateConfig } = useRewardConfig();
  const { updateClaimSound, updating: updatingSoundConfig } = useUpdateClaimSound();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const navigate = useNavigate();
  
  // Notification sound states
  const [claimSoundUrl, setClaimSoundUrl] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const checkAdminRole = async () => {
      if (!user) {
        setCheckingRole(false);
        return;
      }
      
      // Check BOTH admin and owner roles
      const { data: adminData } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: 'admin'
      });
      
      const { data: ownerData } = await supabase.rpc('is_owner', {
        _user_id: user.id,
      });
      
      setIsAdmin(adminData === true || ownerData === true);
      setCheckingRole(false);
    };
    checkAdminRole();
  }, [user]);

  useEffect(() => {
    // Initialize edit values from configs
    const values: Record<string, string> = {};
    configs.forEach(c => {
      values[c.config_key] = c.config_value.toString();
    });
    setEditValues(values);
  }, [configs]);

  // Fetch claim notification sound URL
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
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập URL nhạc chuông",
        variant: "destructive"
      });
      return;
    }

    const success = await updateClaimSound(claimSoundUrl.trim());
    if (success) {
      toast({
        title: "Thành công",
        description: "Đã lưu nhạc chuông claim CAMLY cho tất cả người dùng!",
      });
    } else {
      toast({
        title: "Lỗi",
        description: "Không thể lưu nhạc chuông. Vui lòng thử lại.",
        variant: "destructive"
      });
    }
  };

  const getConfigIcon = (key: string) => {
    switch (key) {
      case CONFIG_KEYS.VIEW_REWARD:
      case CONFIG_KEYS.DAILY_VIEW_LIMIT:
        return <Eye className="w-4 h-4" />;
      case CONFIG_KEYS.COMMENT_REWARD:
      case CONFIG_KEYS.DAILY_COMMENT_LIMIT:
      case CONFIG_KEYS.MAX_COMMENTS_PER_VIDEO:
        return <MessageSquare className="w-4 h-4" />;
      case CONFIG_KEYS.UPLOAD_REWARD:
      case CONFIG_KEYS.DAILY_UPLOAD_LIMIT:
        return <Upload className="w-4 h-4" />;
      case CONFIG_KEYS.LIKE_REWARD:
        return <Heart className="w-4 h-4" />;
      case CONFIG_KEYS.MIN_WATCH_PERCENTAGE:
        return <Clock className="w-4 h-4" />;
      case CONFIG_KEYS.MIN_COMMENT_LENGTH:
        return <Hash className="w-4 h-4" />;
      default:
        return <Coins className="w-4 h-4" />;
    }
  };

  const getConfigCategory = (key: string): 'rewards' | 'limits' | 'validation' => {
    if (key.includes('REWARD') && !key.includes('LIMIT')) return 'rewards';
    if (key.includes('LIMIT') || key.includes('MAX')) return 'limits';
    return 'validation';
  };

  const rewardConfigs = configs.filter(c => getConfigCategory(c.config_key) === 'rewards');
  const limitConfigs = configs.filter(c => getConfigCategory(c.config_key) === 'limits');
  const validationConfigs = configs.filter(c => getConfigCategory(c.config_key) === 'validation');

  if (authLoading || loading || checkingRole) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-xl flex items-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin" />
          Đang tải...
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 text-center">
          <ShieldX className="w-16 h-16 mx-auto text-destructive mb-4" />
          <p className="text-lg font-semibold">Truy cập bị từ chối</p>
          <p className="text-muted-foreground mt-2">Chỉ admin mới có quyền truy cập trang này</p>
        </Card>
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
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate('/admin')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-black bg-gradient-to-r from-[#00E7FF] via-[#7A2BFF] to-[#FF00E5] bg-clip-text text-transparent">
              Cấu Hình Phần Thưởng CAMLY
            </h1>
            <p className="text-muted-foreground mt-1">Điều chỉnh các mức thưởng và giới hạn hệ thống</p>
          </div>
        </div>

        <Tabs defaultValue="rewards" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="rewards" className="flex items-center gap-2">
              <Coins className="w-4 h-4" />
              Mức thưởng
            </TabsTrigger>
            <TabsTrigger value="limits" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Giới hạn
            </TabsTrigger>
            <TabsTrigger value="validation" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Validation
            </TabsTrigger>
            <TabsTrigger value="notification" className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Nhạc chuông
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="w-4 h-4" />
              Lịch sử
            </TabsTrigger>
          </TabsList>

          <TabsContent value="rewards">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Coins className="w-5 h-5 text-[#FFD700]" />
                  Mức Thưởng CAMLY
                </CardTitle>
                <CardDescription>
                  Số CAMLY người dùng nhận được cho mỗi hành động
                </CardDescription>
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
                <CardDescription>
                  Giới hạn phần thưởng để chống gian lận
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {limitConfigs.map(config => (
                    <ConfigCard key={config.id} config={config} />
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="validation">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-[#00E7FF]" />
                  Điều Kiện Hợp Lệ
                </CardTitle>
                <CardDescription>
                  Các điều kiện để xác định hành động hợp lệ được thưởng
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {validationConfigs.map(config => (
                    <ConfigCard key={config.id} config={config} />
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notification">
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-[#FFD700]" />
                  Cài Đặt Nhạc Chuông Claim CAMLY
                </CardTitle>
                <CardDescription>
                  Nhạc chuông này sẽ phát cho <span className="font-bold text-primary">TẤT CẢ NGƯỜI DÙNG</span> khi họ claim CAMLY thành công
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Current Sound URL */}
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
                      title={isPlaying ? "Dừng" : "Nghe thử"}
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Hỗ trợ: .mp3, .wav, .ogg (tối đa 10MB). Nhạc này sẽ phát khi user claim CAMLY thành công.
                  </p>
                </div>

                {/* Preview Card */}
                {claimSoundUrl && (
                  <Card className="bg-gradient-to-r from-yellow-500/10 via-cyan-500/10 to-yellow-500/10 border-yellow-500/30">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-yellow-500/20">
                          <Volume2 className="w-5 h-5 text-yellow-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">Nhạc chuông hiện tại</p>
                          <p className="text-xs text-muted-foreground truncate">{claimSoundUrl}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handlePlayPreview}
                          className="gap-1"
                        >
                          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                          {isPlaying ? "Dừng" : "Nghe thử"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Save Button */}
                <Button
                  onClick={handleSaveClaimSound}
                  disabled={updatingSoundConfig}
                  className="w-full bg-gradient-to-r from-yellow-500 to-cyan-500 hover:from-yellow-600 hover:to-cyan-600"
                >
                  {updatingSoundConfig ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Lưu Nhạc Chuông Cho Tất Cả User
                    </>
                  )}
                </Button>

                {/* Info */}
                <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                  <h4 className="font-medium text-sm flex items-center gap-2">
                    <Bell className="w-4 h-4" />
                    Thông tin
                  </h4>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Nhạc chuông này được dùng cho: <span className="font-medium text-foreground">Claim CAMLY</span> và <span className="font-medium text-foreground">Rich Notification</span></li>
                    <li>• Tất cả người dùng sẽ dùng chung nhạc này khi nhận CAMLY</li>
                    <li>• Có thể thay đổi bất cứ lúc nào, thay đổi sẽ áp dụng ngay lập tức</li>
                  </ul>
                </div>
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
                <CardDescription>
                  50 thay đổi cấu hình gần nhất
                </CardDescription>
              </CardHeader>
              <CardContent>
                {history.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Chưa có lịch sử thay đổi
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Thời gian</TableHead>
                        <TableHead>Cấu hình</TableHead>
                        <TableHead>Giá trị cũ</TableHead>
                        <TableHead>Giá trị mới</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {history.map((h) => (
                        <TableRow key={h.id}>
                          <TableCell className="text-sm">
                            {format(new Date(h.changed_at), 'dd/MM/yyyy HH:mm')}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{h.config_key}</Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {h.old_value?.toLocaleString() || '-'}
                          </TableCell>
                          <TableCell className="font-medium text-primary">
                            {h.new_value.toLocaleString()}
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

        {/* Summary Card */}
        <Card className="bg-gradient-to-br from-muted/50 to-muted/30">
          <CardHeader>
            <CardTitle className="text-lg">Tóm Tắt Cấu Hình Hiện Tại</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="p-3 rounded-lg bg-background/50">
                <div className="text-muted-foreground mb-1">View Reward</div>
                <div className="font-bold text-lg text-[#00E7FF]">
                  {configs.find(c => c.config_key === CONFIG_KEYS.VIEW_REWARD)?.config_value.toLocaleString() || 0} CAMLY
                </div>
              </div>
              <div className="p-3 rounded-lg bg-background/50">
                <div className="text-muted-foreground mb-1">Comment Reward</div>
                <div className="font-bold text-lg text-[#7A2BFF]">
                  {configs.find(c => c.config_key === CONFIG_KEYS.COMMENT_REWARD)?.config_value.toLocaleString() || 0} CAMLY
                </div>
              </div>
              <div className="p-3 rounded-lg bg-background/50">
                <div className="text-muted-foreground mb-1">Upload Reward</div>
                <div className="font-bold text-lg text-[#FF00E5]">
                  {configs.find(c => c.config_key === CONFIG_KEYS.UPLOAD_REWARD)?.config_value.toLocaleString() || 0} CAMLY
                </div>
              </div>
              <div className="p-3 rounded-lg bg-background/50">
                <div className="text-muted-foreground mb-1">Daily View Limit</div>
                <div className="font-bold text-lg text-[#FFD700]">
                  {configs.find(c => c.config_key === CONFIG_KEYS.DAILY_VIEW_LIMIT)?.config_value.toLocaleString() || 0} CAMLY
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminRewardConfig;
