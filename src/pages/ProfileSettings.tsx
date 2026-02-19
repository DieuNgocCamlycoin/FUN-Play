import { useState, useEffect, useRef, useCallback } from "react";
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
import { ArrowLeft, Save, Play, Pause, Lock, ShieldCheck, Loader2, CheckCircle2, XCircle, AtSign } from "lucide-react";
import { MainLayout } from "@/components/Layout/MainLayout";
import { DragDropImageUpload } from "@/components/Profile/DragDropImageUpload";
import { ProfileCompletionIndicator } from "@/components/Profile/ProfileCompletionIndicator";
import { ChangePasswordForm } from "@/components/Profile/ChangePasswordForm";
import { isNameAppropriate, validateUsernameFormat, validateDisplayName } from "@/lib/nameFilter";

export default function ProfileSettings() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { uploadToR2 } = useR2Upload({ folder: 'music' });
  
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [usernameInput, setUsernameInput] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken" | "invalid">("idle");
  const [usernameError, setUsernameError] = useState("");
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
  const [avatarVerified, setAvatarVerified] = useState<boolean | null>(null);
  const [angelaiUrl, setAngelaiUrl] = useState("");
  const [funplayUrl, setFunplayUrl] = useState("");
  const [facebookUrl, setFacebookUrl] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [twitterUrl, setTwitterUrl] = useState("");
  const [telegramUrl, setTelegramUrl] = useState("");
  const [tiktokUrl, setTiktokUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [zaloUrl, setZaloUrl] = useState("");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const musicFileInputRef = useRef<HTMLInputElement | null>(null);
  const usernameDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Username availability check (debounced)
  const checkUsernameAvailability = useCallback(async (value: string) => {
    const formatCheck = validateUsernameFormat(value);
    if (!formatCheck.ok) {
      setUsernameStatus("invalid");
      setUsernameError(formatCheck.reason || "");
      return;
    }

    setUsernameStatus("checking");
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", value)
        .neq("id", user!.id)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setUsernameStatus("taken");
        setUsernameError("Username này đã được sử dụng");
      } else {
        setUsernameStatus("available");
        setUsernameError("");
      }
    } catch {
      setUsernameStatus("idle");
    }
  }, [user]);

  const handleUsernameChange = (value: string) => {
    const cleaned = value.toLowerCase().replace(/[^a-z0-9_]/g, "");
    setUsernameInput(cleaned);

    if (usernameDebounceRef.current) clearTimeout(usernameDebounceRef.current);

    if (!cleaned) {
      setUsernameStatus("idle");
      setUsernameError("");
      return;
    }

    const formatCheck = validateUsernameFormat(cleaned);
    if (!formatCheck.ok) {
      setUsernameStatus("invalid");
      setUsernameError(formatCheck.reason || "");
      return;
    }

    setUsernameStatus("checking");
    usernameDebounceRef.current = setTimeout(() => {
      checkUsernameAvailability(cleaned);
    }, 500);
  };


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
        setUsername(data.username || "");
        setUsernameInput(data.username?.startsWith("user_") ? "" : data.username || "");
        setWalletAddress(data.wallet_address || "");
        setAvatarUrl(data.avatar_url || "");
        setBio(data.bio || "");
        setMusicUrl(data.music_url || "");
        setAvatarVerified(data.avatar_verified ?? null);
        setAngelaiUrl(data.angelai_url || "");
        setFunplayUrl(data.funplay_url || "");
        setFacebookUrl(data.facebook_url || "");
        setYoutubeUrl(data.youtube_url || "");
        setTwitterUrl(data.twitter_url || "");
        setTelegramUrl(data.telegram_url || "");
        setTiktokUrl(data.tiktok_url || "");
        setLinkedinUrl(data.linkedin_url || "");
        setZaloUrl(data.zalo_url || "");
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
        title: "Lỗi",
        description: error.message || "Không thể tải thông tin cá nhân",
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

    // Validate display name (includes spam + offensive check)
    const nameCheck = validateDisplayName(displayName);
    if (!nameCheck.ok) {
      toast({
        title: "Tên không hợp lệ",
        description: nameCheck.reason,
        variant: "destructive",
      });
      return;
    }

    // Validate username if user entered one
    if (usernameInput) {
      const formatCheck = validateUsernameFormat(usernameInput);
      if (!formatCheck.ok) {
        toast({
          title: "Username không hợp lệ",
          description: formatCheck.reason,
          variant: "destructive",
        });
        return;
      }
      if (usernameStatus === "taken") {
        toast({
          title: "Username đã tồn tại",
          description: "Vui lòng chọn username khác",
          variant: "destructive",
        });
        return;
      }
      if (usernameStatus === "checking") {
        toast({
          title: "Đang kiểm tra",
          description: "Vui lòng chờ kiểm tra username",
          variant: "destructive",
        });
        return;
      }
    }

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
      const updateData: Record<string, any> = {
        display_name: displayName,
        wallet_address: walletAddress,
        avatar_url: avatarUrl,
        bio: bio,
        music_url: finalMusicUrl,
        angelai_url: angelaiUrl || null,
        funplay_url: funplayUrl || null,
        facebook_url: facebookUrl || null,
        youtube_url: youtubeUrl || null,
        twitter_url: twitterUrl || null,
        telegram_url: telegramUrl || null,
        tiktok_url: tiktokUrl || null,
        linkedin_url: linkedinUrl || null,
        zalo_url: zaloUrl || null,
      };

      // Update username if user provided a custom one
      if (usernameInput && usernameStatus === "available") {
        updateData.username = usernameInput;
      }

      const { error } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", user!.id);

      if (error) throw error;

      // Fetch social avatars in background (non-blocking)
      const socialPlatforms: Record<string, string | null> = {};
      if (facebookUrl) socialPlatforms.facebook = facebookUrl;
      if (youtubeUrl) socialPlatforms.youtube = youtubeUrl;
      if (twitterUrl) socialPlatforms.twitter = twitterUrl;
      if (tiktokUrl) socialPlatforms.tiktok = tiktokUrl;
      if (telegramUrl) socialPlatforms.telegram = telegramUrl;
      if (angelaiUrl) socialPlatforms.angelai = angelaiUrl;
      if (funplayUrl) socialPlatforms.funplay = funplayUrl;
      if (linkedinUrl) socialPlatforms.linkedin = linkedinUrl;
      if (zaloUrl) socialPlatforms.zalo = zaloUrl;

      if (Object.keys(socialPlatforms).length > 0) {
        supabase.functions.invoke("fetch-social-avatar", {
          body: { userId: user!.id, platforms: socialPlatforms },
        }).catch((e) => console.warn("Social avatar fetch failed:", e));
      }

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
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-foreground">Đang tải...</div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <main className="pb-10 px-4">
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
            <h1 className="text-2xl font-bold text-foreground">Cài đặt hồ sơ</h1>
          </div>

          {/* Profile Completion Indicator */}
          <div className="mb-6">
            <ProfileCompletionIndicator
              avatar={!!avatarUrl}
              banner={!!bannerUrl}
              bio={!!bio}
              wallet={!!walletAddress}
              username={!username?.startsWith("user_")}
            />
          </div>

          {/* Form */}
          <div className="bg-card border border-border rounded-lg p-6 shadow-lg">
            <form onSubmit={handleSave} className="space-y-6">
              <div>
                <Label htmlFor="displayName">Tên hiển thị</Label>
                <Input
                  id="displayName"
                  type="text"
                  placeholder="Tên hiển thị của bạn"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Đây là tên sẽ hiển thị trên kênh và bình luận của bạn
                </p>
              </div>

              {/* Username field */}
              <div>
                <Label htmlFor="username" className="flex items-center gap-1.5">
                  <AtSign className="h-3.5 w-3.5" />
                  Username
                </Label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
                  <Input
                    id="username"
                    type="text"
                    placeholder="ten_cua_ban"
                    value={usernameInput}
                    onChange={(e) => handleUsernameChange(e.target.value)}
                    className="pl-7"
                    maxLength={30}
                  />
                  {usernameInput && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2">
                      {usernameStatus === "checking" && (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      )}
                      {usernameStatus === "available" && (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      )}
                      {(usernameStatus === "taken" || usernameStatus === "invalid") && (
                        <XCircle className="h-4 w-4 text-destructive" />
                      )}
                    </span>
                  )}
                </div>
                {usernameError && (
                  <p className="text-xs text-destructive mt-1">{usernameError}</p>
                )}
                {usernameStatus === "available" && (
                  <p className="text-xs text-green-600 mt-1">Username khả dụng! ✅</p>
                )}
                {!usernameInput && username?.startsWith("user_") && (
                  <p className="text-xs text-amber-600 mt-1">
                    Bạn đang dùng username hệ thống ({username}). Hãy chọn username đẹp hơn!
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  3-30 ký tự, chỉ chữ thường, số và dấu gạch dưới. Dùng cho URL hồ sơ: play.fun.rich/@username
                </p>
              </div>

              <div>
                <Label htmlFor="walletAddress">Địa chỉ ví (BSC)</Label>
                <Input
                  id="walletAddress"
                  type="text"
                  placeholder="0x..."
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  className="mt-1 font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Địa chỉ ví BSC để nhận donate từ người xem
                </p>
              </div>

              <DragDropImageUpload
                currentImageUrl={avatarUrl}
                onImageUploaded={async (url) => {
                  setAvatarUrl(url);
                  if (url) {
                    // Avatar uploaded and resized client-side, mark as verified
                    try {
                      await supabase
                        .from("profiles")
                        .update({ avatar_verified: true } as any)
                        .eq("id", user!.id);
                      setAvatarVerified(true);
                      toast({
                        title: "✅ Ảnh đại diện đã cập nhật",
                        description: "Ảnh đã được tải lên và xác minh thành công",
                      });
                    } catch (err: any) {
                      console.error("Avatar verified update error:", err);
                    }
                  } else {
                    setAvatarVerified(null);
                  }
                }}
                label="Ảnh đại diện (Avatar)"
                aspectRatio="aspect-square"
                folderPath="avatars"
                maxSizeMB={1}
              />

              {/* Avatar verification status */}
              {avatarUrl && avatarVerified === true && (
                <div className="flex items-center gap-2 p-2.5 rounded-lg text-xs bg-green-500/10 border border-green-500/30">
                  <ShieldCheck className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="text-green-600">Ảnh chân dung đã được xác minh ✅</span>
                </div>
              )}

              <DragDropImageUpload
                currentImageUrl={bannerUrl}
                onImageUploaded={(url) => setBannerUrl(url)}
                label="Ảnh bìa trang chủ (Banner)"
                aspectRatio="aspect-[16/9]"
                folderPath="banners"
                maxSizeMB={10}
              />

              <div>
                <Label htmlFor="bio">Giới thiệu</Label>
                <Textarea
                  id="bio"
                  placeholder="Giới thiệu về bản thân bạn..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="mt-1 min-h-[100px]"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Viết mô tả ngắn cho kênh của bạn
                </p>
              </div>

              {/* Social Media Links */}
              <div className="border-t border-border pt-6 mt-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  Liên kết mạng xã hội
                </h3>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="funplayUrl">Fun Profile</Label>
                    <Input id="funplayUrl" type="url" placeholder="https://play.fun.rich/@username" value={funplayUrl} onChange={(e) => setFunplayUrl(e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="angelaiUrl">Angel AI</Label>
                    <Input id="angelaiUrl" type="url" placeholder="https://angel.ai/profile" value={angelaiUrl} onChange={(e) => setAngelaiUrl(e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="facebookUrl">Facebook</Label>
                    <Input id="facebookUrl" type="url" placeholder="https://facebook.com/username" value={facebookUrl} onChange={(e) => setFacebookUrl(e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="youtubeUrl">YouTube</Label>
                    <Input id="youtubeUrl" type="url" placeholder="https://youtube.com/@channel" value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="twitterUrl">X / Twitter</Label>
                    <Input id="twitterUrl" type="url" placeholder="https://x.com/username" value={twitterUrl} onChange={(e) => setTwitterUrl(e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="telegramUrl">Telegram</Label>
                    <Input id="telegramUrl" type="url" placeholder="https://t.me/username" value={telegramUrl} onChange={(e) => setTelegramUrl(e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="tiktokUrl">TikTok</Label>
                    <Input id="tiktokUrl" type="url" placeholder="https://tiktok.com/@username" value={tiktokUrl} onChange={(e) => setTiktokUrl(e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="linkedinUrl">LinkedIn</Label>
                    <Input id="linkedinUrl" type="url" placeholder="https://linkedin.com/in/username" value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="zaloUrl">Zalo</Label>
                    <Input id="zaloUrl" type="url" placeholder="https://zalo.me/username" value={zaloUrl} onChange={(e) => setZaloUrl(e.target.value)} className="mt-1" />
                  </div>
                  <p className="text-xs text-muted-foreground">Các link sẽ hiển thị quanh avatar trên trang cá nhân của bạn (tối đa 9 nền tảng)</p>
                </div>
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
                  Hủy
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="gap-2"
                >
                  <Save className="h-4 w-4" />
                  {saving ? "Đang lưu..." : "Lưu thay đổi"}
                </Button>
              </div>
            </form>

            {/* Security Section - Change Password */}
            <div className="border-t border-border pt-6 mt-6">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Bảo Mật
              </h3>
              <ChangePasswordForm userEmail={user?.email || ""} />
            </div>
          </div>
        </div>
      </main>
    </MainLayout>
  );
}
