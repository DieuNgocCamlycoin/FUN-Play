import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Lock, AlertCircle } from "lucide-react";

interface ChangePasswordFormProps {
  userEmail: string;
}

export function ChangePasswordForm({ userEmail }: ChangePasswordFormProps) {
  const { toast } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (!currentPassword) {
      newErrors.currentPassword = "Vui lòng nhập mật khẩu hiện tại";
    }

    if (!newPassword) {
      newErrors.newPassword = "Vui lòng nhập mật khẩu mới";
    } else if (newPassword.length < 6) {
      newErrors.newPassword = "Mật khẩu mới phải có ít nhất 6 ký tự";
    } else if (newPassword !== newPassword.trim()) {
      newErrors.newPassword = "Mật khẩu không được có khoảng trắng đầu/cuối";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Vui lòng xác nhận mật khẩu mới";
    } else if (confirmPassword !== newPassword) {
      newErrors.confirmPassword = "Mật khẩu xác nhận không khớp";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      // Step 1: Re-authenticate with current password
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: currentPassword,
      });

      if (authError) {
        setErrors({ currentPassword: "Mật khẩu hiện tại không đúng" });
        setIsSubmitting(false);
        return;
      }

      // Step 2: Update to new password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        throw updateError;
      }

      // Success - clear form
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setErrors({});

      toast({
        title: "Đổi mật khẩu thành công!",
        description: "Mật khẩu của bạn đã được cập nhật.",
      });
    } catch (error: any) {
      toast({
        title: "Lỗi đổi mật khẩu",
        description: error.message || "Không thể đổi mật khẩu. Vui lòng thử lại.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const PasswordInput = ({
    id,
    label,
    value,
    onChange,
    show,
    onToggleShow,
    error,
    placeholder,
  }: {
    id: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
    show: boolean;
    onToggleShow: () => void;
    error?: string;
    placeholder: string;
  }) => (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={show ? "text" : "password"}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`pr-10 ${error ? "border-destructive" : ""}`}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
          onClick={onToggleShow}
          tabIndex={-1}
        >
          {show ? (
            <EyeOff className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Eye className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>
      </div>
      {error && (
        <p className="text-sm text-destructive flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PasswordInput
        id="currentPassword"
        label="Mật khẩu hiện tại"
        value={currentPassword}
        onChange={setCurrentPassword}
        show={showCurrentPassword}
        onToggleShow={() => setShowCurrentPassword(!showCurrentPassword)}
        error={errors.currentPassword}
        placeholder="Nhập mật khẩu hiện tại"
      />

      <PasswordInput
        id="newPassword"
        label="Mật khẩu mới"
        value={newPassword}
        onChange={setNewPassword}
        show={showNewPassword}
        onToggleShow={() => setShowNewPassword(!showNewPassword)}
        error={errors.newPassword}
        placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
      />

      <PasswordInput
        id="confirmPassword"
        label="Xác nhận mật khẩu mới"
        value={confirmPassword}
        onChange={setConfirmPassword}
        show={showConfirmPassword}
        onToggleShow={() => setShowConfirmPassword(!showConfirmPassword)}
        error={errors.confirmPassword}
        placeholder="Nhập lại mật khẩu mới"
      />

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full gap-2"
      >
        <Lock className="h-4 w-4" />
        {isSubmitting ? "Đang xử lý..." : "Đổi Mật Khẩu"}
      </Button>
    </form>
  );
}
