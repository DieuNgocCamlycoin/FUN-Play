import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Lock, AlertCircle, CheckCircle, Loader2, AlertTriangle } from "lucide-react";

interface SetNewPasswordFormProps {
  onSuccess: () => void;
  onBackToLogin: () => void;
}

export default function SetNewPasswordForm({ onSuccess, onBackToLogin }: SetNewPasswordFormProps) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const hasWhitespace = (str: string) => str !== str.trim();

  const handleSetNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (newPassword.length < 6) {
      setErrorMessage("Mật khẩu phải có ít nhất 6 ký tự!");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("Mật khẩu xác nhận không khớp!");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) throw error;

      setSuccessMessage("Đặt mật khẩu mới thành công!");
      
      // Sign out and redirect after short delay
      await supabase.auth.signOut();
      
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (error: any) {
      console.error("[Auth] Password update error:", { message: error.message });
      
      if (error.message.includes("same as the old password")) {
        setErrorMessage("Mật khẩu mới phải khác mật khẩu cũ!");
      } else if (error.message.includes("should be at least")) {
        setErrorMessage("Mật khẩu phải có ít nhất 6 ký tự!");
      } else {
        setErrorMessage(`Không thể đặt mật khẩu mới: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSetNewPassword} className="space-y-4">
      {errorMessage && (
        <div className="p-3 rounded-lg bg-red-100 border border-red-300 flex items-start gap-2">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-red-700 text-sm">{errorMessage}</p>
        </div>
      )}

      {successMessage && (
        <div className="p-3 rounded-lg bg-green-100 border border-green-300 flex items-start gap-2">
          <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
          <p className="text-green-700 text-sm">{successMessage}</p>
        </div>
      )}

      <div>
        <Label htmlFor="newPassword" className="text-gray-700 flex items-center gap-2">
          <Lock className="h-4 w-4" />
          Mật khẩu mới
        </Label>
        <div className="relative mt-1">
          <Input
            id="newPassword"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            value={newPassword}
            onChange={(e) => { setNewPassword(e.target.value); setErrorMessage(null); }}
            required
            className="h-12 pr-10 border-gray-300 rounded-lg"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
        {hasWhitespace(newPassword) && (
          <div className="flex items-center gap-1 mt-1 text-amber-600">
            <AlertTriangle className="h-3 w-3" />
            <p className="text-xs">Mật khẩu có khoảng trắng đầu/cuối!</p>
          </div>
        )}
        <p className="text-xs text-gray-500 mt-1">Mật khẩu phải có ít nhất 6 ký tự</p>
      </div>

      <div>
        <Label htmlFor="confirmPassword" className="text-gray-700 flex items-center gap-2">
          <Lock className="h-4 w-4" />
          Xác nhận mật khẩu
        </Label>
        <div className="relative mt-1">
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => { setConfirmPassword(e.target.value); setErrorMessage(null); }}
            required
            className="h-12 pr-10 border-gray-300 rounded-lg"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
        {confirmPassword && newPassword !== confirmPassword && (
          <p className="text-xs text-red-500 mt-1">Mật khẩu xác nhận không khớp</p>
        )}
      </div>

      <Button
        type="submit"
        disabled={loading || !newPassword || !confirmPassword}
        className="w-full h-12 rounded-lg font-semibold text-white bg-gradient-to-r from-[#00E7FF] via-[#7A2BFF] via-[#FF00E5] to-[#FFD700] hover:opacity-90 transition-opacity"
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Đang cập nhật...
          </span>
        ) : (
          "Đặt Mật Khẩu Mới"
        )}
      </Button>

      <Button
        type="button"
        variant="ghost"
        onClick={onBackToLogin}
        className="w-full text-purple-600 hover:text-purple-700"
      >
        ← Quay lại đăng nhập
      </Button>
    </form>
  );
}
