import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useR2Upload } from "@/hooks/useR2Upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Play, Pause } from "lucide-react";
import { Header } from "@/components/Layout/Header";
import { DragDropImageUpload } from "@/components/Profile/DragDropImageUpload";
import { ProfileCompletionIndicator } from "@/components/Profile/ProfileCompletionIndicator";

export default function ProfileSettings() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { uploadToR2 } = useR2Upload({ folder: 'music' });
  
  const [displayName, setDisplayName] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [bio, setBio] = useState("");
  const [musicUrl, setMusicUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [channelId, setChannelId] = useState<string | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [isUploadingMusic, setIsUploadingMusic] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const musicFileInputRef = useRef<HTMLInputElement | null>(null);


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

      // Fetch channel info for banner
      const { data: channelData } = await supabase
        .from("channels")
        .select("id, banner_url")
        .eq("user_id", user!.id)
        .maybeSingle();

      if (channelData) {
        setChannelId(channelData.id);
        setBannerUrl(channelData.banner_url || "");
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

  const extractSunoAudioUrl = async (sunoPageUrl: string): Promise<string | null> => {
    // Extract song ID from Suno page URL
    const songIdMatch = sunoPageUrl.match(/suno\.com\/song\/([a-zA-Z0-9-]+)/);
    const shortLinkMatch = sunoPageUrl.match(/suno\.com\/s\/([a-zA-Z0-9-]+)/);
    
    if (songIdMatch || shortLinkMatch) {
      const songId = songIdMatch ? songIdMatch[1] : shortLinkMatch[1];
      // Construct direct audio URL
      return `https://cdn1.suno.ai/${songId}.mp3`;
    }
    
    return null;
  };

  const handleAudioPreview = async () => {
    if (!musicUrl) {
      toast({
        title: "Chưa có link nhạc",
        description: "Vui lòng nhập link nhạc trước",
        variant: "destructive",
      });
      return;
    }

    let audioUrlToPlay = musicUrl;

    // Check if it's a Suno song page URL and extract audio URL
    const isSunoPageUrl = /suno\.com\/(song|s)\//i.test(musicUrl);
    if (isSunoPageUrl) {
      const extractedUrl = await extractSunoAudioUrl(musicUrl);
      if (extractedUrl) {
        audioUrlToPlay = extractedUrl;
        toast({
          title: "Đã chuyển đổi link Suno",
          description: "Tự động trích xuất link nhạc từ trang Suno",
        });
      }
    }

    // Check if it's a valid audio URL format
    const isDirectAudioUrl = /\.(mp3|wav|ogg|m4a|aac|flac)(\?.*)?$/i.test(audioUrlToPlay);
    const isYouTubeUrl = /youtube\.com|youtu\.be/i.test(musicUrl);

    if (isYouTubeUrl) {
      toast({
        title: "YouTube không được hỗ trợ",
        description: "Vui lòng sử dụng link nhạc trực tiếp (.mp3, .wav, .ogg) hoặc tải file nhạc lên",
        variant: "destructive",
      });
      return;
    }

    if (isPlayingPreview && audioRef.current) {
      audioRef.current.pause();
      setIsPlayingPreview(false);
    } else {
      if (!audioRef.current) {
        audioRef.current = new Audio(audioUrlToPlay);
        audioRef.current.addEventListener('ended', () => setIsPlayingPreview(false));
        audioRef.current.addEventListener('error', () => {
          toast({
            title: "Không thể phát nhạc",
            description: "Link nhạc không hợp lệ. Vui lòng sử dụng link nhạc trực tiếp (.mp3, .wav, .ogg)",
            variant: "destructive",
          });
          setIsPlayingPreview(false);
        });
      } else {
        audioRef.current.src = audioUrlToPlay;
      }
      
      audioRef.current.play().catch((error) => {
        console.error("Audio playback error:", error);
        toast({
          title: "Không thể phát nhạc",
          description: "Link nhạc không hợp lệ. Vui lòng sử dụng link file nhạc trực tiếp (.mp3, .wav, .ogg) thay vì link trang web",
          variant: "destructive",
        });
        setIsPlayingPreview(false);
      });
      setIsPlayingPreview(true);
    }
  };

  const handleMusicFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|ogg|m4a)$/i)) {
      toast({
        title: "File không hợp lệ",
        description: "Vui lòng chọn file nhạc định dạng .mp3, .wav, .ogg hoặc .m4a",
        variant: "destructive",
      });
      return;
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File quá lớn",
        description: "Kích thước file không được vượt quá 10MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingMusic(true);

    try {
      // Upload to R2
      const result = await uploadToR2(file);
      
      if (result) {
        setMusicUrl(result.publicUrl);
        toast({
          title: "Tải lên thành công",
          description: "File nhạc đã được tải lên R2 và sẵn sàng sử dụng",
        });
      }
    } catch (error: any) {
      toast({
        title: "Lỗi tải lên",
        description: error.message || "Không thể tải file nhạc lên",
        variant: "destructive",
      });
    } finally {
      setIsUploadingMusic(false);
      if (musicFileInputRef.current) {
        musicFileInputRef.current.value = '';
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    // Stop preview if playing
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlayingPreview(false);
    }

    // Optimistic update - dispatch event immediately to show changes in UI
    window.dispatchEvent(new Event('profile-updated'));

    // Convert Suno page URL to direct audio URL before saving
    let finalMusicUrl = musicUrl;
    const isSunoPageUrl = /suno\.com\/(song|s)\//i.test(musicUrl);
    if (isSunoPageUrl) {
      const extractedUrl = await extractSunoAudioUrl(musicUrl);
      if (extractedUrl) {
        finalMusicUrl = extractedUrl;
      }
    }

    try {
      // First check if profile exists, if not create it
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user!.id)
        .maybeSingle();

      if (!existingProfile) {
        // Create profile first
        const { error: insertError } = await supabase
          .from("profiles")
          .insert({
            id: user!.id,
            display_name: displayName,
            username: `user_${user!.id.substring(0, 8)}`,
          });

        if (insertError) throw insertError;
      }

      // Now update the profile
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: displayName,
          wallet_address: walletAddress,
          avatar_url: avatarUrl,
          bio: bio,
          music_url: finalMusicUrl,
        })
        .eq("id", user!.id);

      if (error) throw error;

      // Update channel banner if channel exists
      if (channelId && bannerUrl !== undefined) {
        const { error: channelError } = await supabase
          .from("channels")
          .update({ banner_url: bannerUrl })
          .eq("id", channelId);

        if (channelError) throw channelError;
      }

      toast({
        title: "Đã cập nhật",
        description: "Cài đặt của bạn đã được lưu thành công!",
      });
    } catch (error: any) {
      // On error, refetch to revert optimistic update
      await fetchProfile();
      window.dispatchEvent(new Event('profile-updated'));
      
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

          {/* Profile Completion Indicator */}
          <div className="mb-6">
            <ProfileCompletionIndicator
              avatar={!!avatarUrl}
              banner={!!bannerUrl}
              bio={!!bio}
              wallet={!!walletAddress}
            />
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

              <DragDropImageUpload
                currentImageUrl={avatarUrl}
                onImageUploaded={(url) => setAvatarUrl(url)}
                label="Ảnh đại diện (Avatar)"
                aspectRatio="aspect-square"
                folderPath="avatars"
                maxSizeMB={5}
              />

              <DragDropImageUpload
                currentImageUrl={bannerUrl}
                onImageUploaded={(url) => setBannerUrl(url)}
                label="Ảnh bìa trang chủ (Banner)"
                aspectRatio="aspect-[16/9]"
                folderPath="banners"
                maxSizeMB={10}
              />

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
                    <Label htmlFor="musicUrl">Link nhạc thông báo</Label>
                    <div className="flex gap-2">
                      <Input
                        id="musicUrl"
                        type="url"
                        placeholder="https://suno.com/s/... hoặc https://example.com/music.mp3"
                        value={musicUrl}
                        onChange={(e) => setMusicUrl(e.target.value)}
                        className="mt-1 flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={handleAudioPreview}
                        className="mt-1"
                        title="Test nhạc"
                      >
                        {isPlayingPreview ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    
                    {/* File upload button */}
                    <div className="flex items-center gap-2">
                      <input
                        ref={musicFileInputRef}
                        type="file"
                        accept=".mp3,.wav,.ogg,.m4a,audio/mpeg,audio/wav,audio/ogg,audio/m4a"
                        onChange={handleMusicFileUpload}
                        className="hidden"
                        id="music-file-upload"
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => musicFileInputRef.current?.click()}
                        disabled={isUploadingMusic}
                        className="gap-2"
                      >
                        {isUploadingMusic ? (
                          <>
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            Đang tải lên...
                          </>
                        ) : (
                          <>
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            Hoặc tải file lên
                          </>
                        )}
                      </Button>
                    </div>
                    
                    <p className="text-xs text-muted-foreground">
                      Hỗ trợ: Link Suno trực tiếp (suno.com/s/...), file nhạc trực tiếp (.mp3, .wav, .ogg), hoặc tải file lên (tối đa 10MB).
                      <strong className="text-foreground"> KHÔNG</strong> hỗ trợ YouTube/Spotify.
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
