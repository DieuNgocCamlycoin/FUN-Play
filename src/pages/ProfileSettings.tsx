import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save } from "lucide-react";
import { Header } from "@/components/Layout/Header";

export default function ProfileSettings() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [displayName, setDisplayName] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bio, setBio] = useState("");
  const [musicUrl, setMusicUrl] = useState("");
  const [voiceGender, setVoiceGender] = useState("female");
  const [voicePitch, setVoicePitch] = useState("high");
  const [saving, setSaving] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    // Load voice settings from localStorage
    const savedGender = localStorage.getItem("voiceGender") || "female";
    const savedPitch = localStorage.getItem("voicePitch") || "high";
    setVoiceGender(savedGender);
    setVoicePitch(savedPitch);
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
      return;
    }

    if (user) {
      fetchProfile();
    }
  }, [user, loading, navigate]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setDisplayName(data.display_name || "");
        setWalletAddress(data.wallet_address || "");
        setAvatarUrl(data.avatar_url || "");
        setBio(data.bio || "");
        setMusicUrl(data.music_url || "");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load profile",
        variant: "destructive",
      });
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: displayName,
          wallet_address: walletAddress,
          avatar_url: avatarUrl,
          bio: bio,
          music_url: musicUrl,
        })
        .eq("id", user!.id);

      if (error) throw error;

      // Save voice settings to localStorage
      localStorage.setItem("voiceGender", voiceGender);
      localStorage.setItem("voicePitch", voicePitch);

      toast({
        title: "Đã cập nhật",
        description: "Cài đặt của bạn đã được lưu thành công!",
      });
    } catch (error: any) {
      toast({
        title: "Cập nhật thất bại",
        description: error.message || "Không thể cập nhật thông tin",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading || loadingProfile) {
    return (
      <div className="min-h-screen bg-background">
        <Header onMenuClick={() => {}} />
        <div className="flex items-center justify-center pt-20">
          <div className="text-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header onMenuClick={() => {}} />
      
      <main className="pt-20 pb-10 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold text-foreground">Profile Settings</h1>
          </div>

          {/* Form */}
          <div className="bg-card border border-border rounded-lg p-6 shadow-lg">
            <form onSubmit={handleSave} className="space-y-6">
              <div>
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  type="text"
                  placeholder="Your display name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  This is how your name will appear on your channel and comments
                </p>
              </div>

              <div>
                <Label htmlFor="walletAddress">Wallet Address (BSC)</Label>
                <Input
                  id="walletAddress"
                  type="text"
                  placeholder="0x..."
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  className="mt-1 font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Your BSC wallet address where you'll receive tips
                </p>
              </div>

              <div>
                <Label htmlFor="avatarUrl">Avatar URL</Label>
                <Input
                  id="avatarUrl"
                  type="url"
                  placeholder="https://..."
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Link to your profile picture
                </p>
              </div>

              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell viewers about yourself..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="mt-1 min-h-[100px]"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Write a short bio for your channel
                </p>
              </div>

              <div className="border-t border-border pt-6 mt-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  Cài đặt thông báo giọng nói "RICH"
                </h3>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="musicUrl">Link nhạc Suno</Label>
                    <Input
                      id="musicUrl"
                      type="url"
                      placeholder="https://suno.com/..."
                      value={musicUrl}
                      onChange={(e) => setMusicUrl(e.target.value)}
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground">
                      Link đến nhạc chuông từ Suno để phát khi nhận tiền
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="voiceGender">Giọng nói</Label>
                    <Select value={voiceGender} onValueChange={setVoiceGender}>
                      <SelectTrigger id="voiceGender">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="female">Nữ (Baby Angel)</SelectItem>
                        <SelectItem value="male">Nam</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Chọn giọng nói cho thông báo nhận tiền
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="voicePitch">Độ cao giọng</Label>
                    <Select value={voicePitch} onValueChange={setVoicePitch}>
                      <SelectTrigger id="voicePitch">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">Cao (2.0)</SelectItem>
                        <SelectItem value="medium">Trung bình (1.5)</SelectItem>
                        <SelectItem value="low">Thấp (1.0)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Điều chỉnh độ cao của giọng nói
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/")}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="gap-2"
                >
                  <Save className="h-4 w-4" />
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
