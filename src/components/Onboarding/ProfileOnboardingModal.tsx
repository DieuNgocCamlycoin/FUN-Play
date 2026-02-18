import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { DragDropImageUpload } from "@/components/Profile/DragDropImageUpload";
import { validateUsernameFormat, isNameAppropriate } from "@/lib/nameFilter";
import { CheckCircle2, XCircle, Loader2, AtSign, Camera, Sparkles } from "lucide-react";
import { toast } from "sonner";

const ONBOARDING_KEY = "onboarding_completed";

export function ProfileOnboardingModal() {
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  
  // Username state
  const [username, setUsername] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken" | "invalid">("idle");
  const [usernameError, setUsernameError] = useState("");
  
  // Avatar state
  const [avatarUrl, setAvatarUrl] = useState("");
  const [saving, setSaving] = useState(false);

  // Determine if modal should show
  useEffect(() => {
    if (profileLoading || !user || !profile) return;
    
    const dismissed = localStorage.getItem(ONBOARDING_KEY);
    if (dismissed) return;

    const hasSystemUsername = profile.username?.startsWith("user_");
    const hasNoAvatar = !profile.avatar_url;

    if (hasSystemUsername || hasNoAvatar) {
      setOpen(true);
      // Start on step 1 if system username, step 2 if only missing avatar
      if (!hasSystemUsername && hasNoAvatar) {
        setStep(2);
      }
    }
  }, [user, profile, profileLoading]);

  // Debounced username check
  useEffect(() => {
    if (!username || username.length < 3) {
      setUsernameStatus("idle");
      return;
    }

    const formatCheck = validateUsernameFormat(username);
    if (!formatCheck.ok) {
      setUsernameStatus("invalid");
      setUsernameError(formatCheck.reason || "Username không hợp lệ");
      return;
    }

    const nameCheck = isNameAppropriate(username);
    if (!nameCheck.ok) {
      setUsernameStatus("invalid");
      setUsernameError(nameCheck.reason || "Username không phù hợp");
      return;
    }

    setUsernameStatus("checking");
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", username)
        .neq("id", user?.id || "")
        .maybeSingle();

      if (data) {
        setUsernameStatus("taken");
        setUsernameError("Username đã được sử dụng");
      } else {
        setUsernameStatus("available");
        setUsernameError("");
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [username, user?.id]);

  const handleDismiss = useCallback(() => {
    localStorage.setItem(ONBOARDING_KEY, "true");
    setOpen(false);
  }, []);

  const handleSaveUsername = async () => {
    if (usernameStatus !== "available") return;
    
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ username })
      .eq("id", user!.id);

    setSaving(false);
    if (error) {
      toast.error("Không thể lưu username: " + error.message);
      return;
    }
    
    toast.success(`Username @${username} đã được lưu!`);
    
    // If also missing avatar, go to step 2
    if (!profile?.avatar_url && !avatarUrl) {
      setStep(2);
    } else {
      handleDismiss();
    }
  };

  const handleSaveAvatar = async () => {
    if (!avatarUrl) return;
    
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ avatar_url: avatarUrl })
      .eq("id", user!.id);

    setSaving(false);
    if (error) {
      toast.error("Không thể lưu ảnh đại diện: " + error.message);
      return;
    }
    
    toast.success("Ảnh đại diện đã được cập nhật!");
    handleDismiss();
  };

  const handleSkip = () => {
    if (step === 1 && !profile?.avatar_url) {
      setStep(2);
    } else {
      handleDismiss();
    }
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleDismiss()}>
      <DialogContent className="sm:max-w-md" hideCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="w-5 h-5 text-primary" />
            {step === 1 ? "Chọn username của bạn" : "Tải ảnh đại diện"}
          </DialogTitle>
          <DialogDescription>
            {step === 1
              ? "Chọn một @username đẹp để mọi người dễ tìm thấy bạn và nhận thưởng CAMLY!"
              : "Thêm ảnh đại diện thật để hồ sơ của bạn nổi bật hơn!"}
          </DialogDescription>
        </DialogHeader>

        {step === 1 ? (
          <div className="space-y-4">
            <div className="relative">
              <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                placeholder="username_cua_ban"
                className="pl-9 pr-10"
                maxLength={30}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {usernameStatus === "checking" && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                {usernameStatus === "available" && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                {(usernameStatus === "taken" || usernameStatus === "invalid") && <XCircle className="w-4 h-4 text-destructive" />}
              </div>
            </div>
            
            {usernameError && (
              <p className="text-sm text-destructive">{usernameError}</p>
            )}
            {usernameStatus === "available" && (
              <p className="text-sm text-green-500">✓ Username khả dụng!</p>
            )}

            <p className="text-xs text-muted-foreground">
              3-30 ký tự, chỉ chữ thường, số và dấu gạch dưới
            </p>

            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={handleSkip} disabled={saving}>
                Bỏ qua
              </Button>
              <Button
                onClick={handleSaveUsername}
                disabled={usernameStatus !== "available" || saving}
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Lưu username
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <DragDropImageUpload
              currentImageUrl={avatarUrl || profile?.avatar_url || undefined}
              onImageUploaded={(url) => setAvatarUrl(url)}
              label="Ảnh đại diện"
              aspectRatio="aspect-square"
              maxSizeMB={1}
            />

            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={handleDismiss} disabled={saving}>
                Bỏ qua
              </Button>
              <Button
                onClick={handleSaveAvatar}
                disabled={!avatarUrl || saving}
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                <Camera className="w-4 h-4 mr-2" />
                Lưu ảnh đại diện
              </Button>
            </div>
          </div>
        )}

        {/* Step indicator */}
        <div className="flex justify-center gap-2 pt-2">
          <div className={`w-2 h-2 rounded-full ${step === 1 ? "bg-primary" : "bg-muted-foreground/30"}`} />
          <div className={`w-2 h-2 rounded-full ${step === 2 ? "bg-primary" : "bg-muted-foreground/30"}`} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
