import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Upload } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

export const StudioSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Channel info
  const [channelName, setChannelName] = useState("");
  const [channelDescription, setChannelDescription] = useState("");
  const [banner, setBanner] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [currentBannerUrl, setCurrentBannerUrl] = useState<string | null>(null);
  const [channelId, setChannelId] = useState<string | null>(null);

  // Profile info
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string | null>(null);

  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch channel
      const { data: channelData, error: channelError } = await supabase
        .from("channels")
        .select("id, name, description, banner_url")
        .eq("user_id", user?.id)
        .single();

      if (channelError) throw channelError;

      if (channelData) {
        setChannelId(channelData.id);
        setChannelName(channelData.name);
        setChannelDescription(channelData.description || "");
        setCurrentBannerUrl(channelData.banner_url);
        setBannerPreview(channelData.banner_url);
      }

      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("display_name, username, bio, avatar_url")
        .eq("id", user?.id)
        .single();

      if (profileError) throw profileError;

      if (profileData) {
        setDisplayName(profileData.display_name || "");
        setUsername(profileData.username || "");
        setBio(profileData.bio || "");
        setCurrentAvatarUrl(profileData.avatar_url);
        setAvatarPreview(profileData.avatar_url);
      }
    } catch (error: any) {
      console.error("Error fetching data:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tải thông tin",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBanner(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setBannerPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatar(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveChannel = async () => {
    if (!channelName.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập tên kênh",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);

      let bannerUrl = currentBannerUrl;

      if (banner) {
        const fileExt = banner.name.split(".").pop();
        const fileName = `banner-${user?.id}-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("thumbnails")
          .upload(fileName, banner);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("thumbnails")
          .getPublicUrl(fileName);

        bannerUrl = publicUrl;
      }

      const { error } = await supabase
        .from("channels")
        .update({
          name: channelName.trim(),
          description: channelDescription.trim() || null,
          banner_url: bannerUrl,
        })
        .eq("id", channelId);

      if (error) throw error;

      toast({
        title: "Thành công",
        description: "Thông tin kênh đã được cập nhật",
      });

      fetchData();
    } catch (error: any) {
      console.error("Error updating channel:", error);
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);

      let avatarUrl = currentAvatarUrl;

      if (avatar) {
        const fileExt = avatar.name.split(".").pop();
        const fileName = `avatar-${user?.id}-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("thumbnails")
          .upload(fileName, avatar);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("thumbnails")
          .getPublicUrl(fileName);

        avatarUrl = publicUrl;
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: displayName.trim() || null,
          username: username.trim(),
          bio: bio.trim() || null,
          avatar_url: avatarUrl,
        })
        .eq("id", user?.id);

      if (error) throw error;

      toast({
        title: "Thành công",
        description: "Hồ sơ đã được cập nhật",
      });

      fetchData();
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-semibold mb-6">Cài đặt kênh</h1>

      <Tabs defaultValue="channel" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="channel">Thông tin kênh</TabsTrigger>
          <TabsTrigger value="profile">Hồ sơ cá nhân</TabsTrigger>
        </TabsList>

        <TabsContent value="channel" className="space-y-6">
          <div className="bg-card border border-border rounded-lg p-6 space-y-6">
            <div>
              <Label htmlFor="channel-name">Tên kênh (bắt buộc)</Label>
              <Input
                id="channel-name"
                value={channelName}
                onChange={(e) => setChannelName(e.target.value)}
                placeholder="Nhập tên kênh"
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="channel-description">Mô tả kênh</Label>
              <Textarea
                id="channel-description"
                value={channelDescription}
                onChange={(e) => setChannelDescription(e.target.value)}
                placeholder="Giới thiệu về kênh của bạn"
                className="mt-2 min-h-[150px]"
              />
            </div>

            <div>
              <Label>Banner kênh</Label>
              <p className="text-sm text-muted-foreground mb-2">Khuyến nghị: 2560 x 1440 px</p>
              <label htmlFor="banner" className="cursor-pointer block">
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors">
                  {bannerPreview ? (
                    <img src={bannerPreview} alt="Banner preview" className="w-full max-h-48 object-cover rounded" />
                  ) : (
                    <div className="space-y-2">
                      <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Nhấn để chọn banner</p>
                    </div>
                  )}
                </div>
                <Input
                  id="banner"
                  type="file"
                  accept="image/*"
                  onChange={handleBannerChange}
                  className="hidden"
                />
              </label>
            </div>

            <Button onClick={handleSaveChannel} disabled={saving || !channelName.trim()} size="lg">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Lưu thay đổi kênh
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="profile" className="space-y-6">
          <div className="bg-card border border-border rounded-lg p-6 space-y-6">
            <div>
              <Label>Ảnh đại diện</Label>
              <p className="text-sm text-muted-foreground mb-2">Khuyến nghị: 800 x 800 px</p>
              <label htmlFor="avatar" className="cursor-pointer block">
                <div className="flex items-center gap-4">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar" className="w-24 h-24 rounded-full object-cover" />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center">
                      <Upload className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="text-sm text-muted-foreground">
                    Nhấn để thay đổi ảnh đại diện
                  </div>
                </div>
                <Input
                  id="avatar"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </label>
            </div>

            <div>
              <Label htmlFor="display-name">Tên hiển thị</Label>
              <Input
                id="display-name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Tên của bạn"
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="username">Tên người dùng</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="@username"
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="bio">Tiểu sử</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Giới thiệu về bạn"
                className="mt-2 min-h-[100px]"
              />
            </div>

            <Button onClick={handleSaveProfile} disabled={saving} size="lg">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Lưu thay đổi hồ sơ
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
