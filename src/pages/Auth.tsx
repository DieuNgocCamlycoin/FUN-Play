import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAutoReward } from "@/hooks/useAutoReward";
import { Eye, EyeOff, Mail, Lock, User, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { User as SupabaseUser, Session } from "@supabase/supabase-js";

// Vietnamese error messages mapping
const getVietnameseError = (error: string): string => {
  const errorMap: Record<string, string> = {
    "Invalid login credentials": "Email hoặc mật khẩu không đúng. Vui lòng kiểm tra lại!",
    "Email not confirmed": "Email chưa được xác nhận. Vui lòng kiểm tra hộp thư của bạn!",
    "User already registered": "Email này đã được đăng ký. Vui lòng đăng nhập hoặc sử dụng email khác!",
    "Password should be at least 6 characters": "Mật khẩu phải có ít nhất 6 ký tự!",
    "Unable to validate email address: invalid format": "Email không hợp lệ. Vui lòng nhập đúng định dạng!",
    "Signup requires a valid password": "Vui lòng nhập mật khẩu hợp lệ!",
    "To signup, please provide your email": "Vui lòng nhập địa chỉ email!",
    "Email rate limit exceeded": "Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau vài phút!",
    "For security purposes, you can only request this once every 60 seconds": "Vui lòng đợi 60 giây trước khi thử lại!",
    "Network request failed": "Lỗi kết nối mạng. Vui lòng kiểm tra internet và thử lại!",
  };
  
  for (const [key, value] of Object.entries(errorMap)) {
    if (error.toLowerCase().includes(key.toLowerCase())) {
      return value;
    }
  }
  return `Đã xảy ra lỗi: ${error}`;
};

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [forgotPassword, setForgotPassword] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { awardSignupReward } = useAutoReward();
  const signupRewardedRef = useRef(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Award signup reward for new users
        if (event === 'SIGNED_IN' && session?.user && !signupRewardedRef.current) {
          signupRewardedRef.current = true;
          // Defer the reward to avoid blocking auth
          setTimeout(() => {
            awardSignupReward(session.user.id);
          }, 1000);
        }
        
        if (session?.user) {
          navigate("/");
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        navigate("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, awardSignupReward]);

  const clearMessages = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    setLoading(true);

    // Validation
    if (!email.trim()) {
      setErrorMessage("Vui lòng nhập địa chỉ email!");
      setLoading(false);
      return;
    }
    if (password.length < 6) {
      setErrorMessage("Mật khẩu phải có ít nhất 6 ký tự!");
      setLoading(false);
      return;
    }

    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            display_name: displayName || email.split("@")[0],
          },
        },
      });

      if (error) throw error;

      setSuccessMessage("Tạo tài khoản thành công! Chào mừng bạn đến FUN PLAY!");
      toast({
        title: "Tạo tài khoản thành công!",
        description: "Chào mừng bạn đến FUN PLAY!",
      });
    } catch (error: any) {
      const vietnameseError = getVietnameseError(error.message);
      setErrorMessage(vietnameseError);
      toast({
        title: "Đăng ký thất bại",
        description: vietnameseError,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    setLoading(true);

    // Validation
    if (!email.trim()) {
      setErrorMessage("Vui lòng nhập địa chỉ email!");
      setLoading(false);
      return;
    }
    if (!password.trim()) {
      setErrorMessage("Vui lòng nhập mật khẩu!");
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      setSuccessMessage("Đăng nhập thành công!");
    } catch (error: any) {
      const vietnameseError = getVietnameseError(error.message);
      setErrorMessage(vietnameseError);
      toast({
        title: "Đăng nhập thất bại",
        description: vietnameseError,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    setLoading(true);

    if (!email.trim()) {
      setErrorMessage("Vui lòng nhập địa chỉ email để đặt lại mật khẩu!");
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth`,
      });

      if (error) throw error;

      setSuccessMessage("Email đặt lại mật khẩu đã được gửi! Vui lòng kiểm tra hộp thư của bạn.");
      toast({
        title: "Email đã được gửi!",
        description: "Vui lòng kiểm tra hộp thư để đặt lại mật khẩu.",
      });
    } catch (error: any) {
      const vietnameseError = getVietnameseError(error.message);
      setErrorMessage(vietnameseError);
    } finally {
      setLoading(false);
    }
  };

  const handleContinueWithoutLogin = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Video Background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0"
      >
        <source src="/videos/heartbeat-bg.mp4" type="video/mp4" />
      </video>
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-[rgba(138,43,226,0.3)] to-[rgba(255,0,150,0.15)] z-10" />
      
      <div className="w-full max-w-md space-y-6 relative z-20">
        {/* Logo Video */}
        <div className="flex justify-center">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="h-24 w-auto rounded-2xl"
          >
            <source src="/videos/logo-animation.mp4" type="video/mp4" />
          </video>
        </div>

        {/* Auth Card - Transparent Frosted Glass */}
        <div className="bg-white/50 backdrop-blur-xl border border-white/30 rounded-2xl p-8 shadow-lg">
          <h2 className="text-2xl font-bold text-center mb-2 bg-gradient-to-r from-[#00E7FF] via-[#7A2BFF] to-[#FF00E5] bg-clip-text text-transparent">
            {forgotPassword ? "Quên Mật Khẩu" : isLogin ? "Đăng Nhập" : "Đăng Ký"}
          </h2>
          
          {/* Instruction text */}
          <p className="text-center text-gray-600 text-sm mb-6">
            {forgotPassword 
              ? "Nhập email để nhận link đặt lại mật khẩu" 
              : isLogin 
                ? "Chào mừng trở lại! Hãy đăng nhập để tiếp tục." 
                : "Tạo tài khoản mới để trải nghiệm FUN PLAY!"}
          </p>

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-4 p-3 rounded-lg bg-red-100 border border-red-300 flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 text-sm">{errorMessage}</p>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="mb-4 p-3 rounded-lg bg-green-100 border border-green-300 flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
              <p className="text-green-700 text-sm">{successMessage}</p>
            </div>
          )}

          {/* Forgot Password Form */}
          {forgotPassword ? (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-gray-700 flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); clearMessages(); }}
                  required
                  className="mt-1 h-12 border-gray-300 rounded-lg"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-lg font-semibold text-white bg-gradient-to-r from-[#00E7FF] via-[#7A2BFF] via-[#FF00E5] to-[#FFD700] hover:opacity-90 transition-opacity"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Đang gửi...
                  </span>
                ) : (
                  "Gửi Email Đặt Lại"
                )}
              </Button>

              <Button
                type="button"
                variant="ghost"
                onClick={() => { setForgotPassword(false); clearMessages(); }}
                className="w-full text-cosmic-cyan hover:text-glow-cyan"
              >
                ← Quay lại đăng nhập
              </Button>
            </form>
          ) : (
            <>
              {/* Email/Password Form */}
              <form onSubmit={isLogin ? handleLogin : handleSignUp} className="space-y-4">
                {!isLogin && (
                  <div>
                    <Label htmlFor="displayName" className="text-gray-700 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Tên hiển thị
                    </Label>
                    <Input
                      id="displayName"
                      type="text"
                      placeholder="Tên của bạn"
                      value={displayName}
                      onChange={(e) => { setDisplayName(e.target.value); clearMessages(); }}
                      className="mt-1 h-12 border-gray-300 rounded-lg"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Tên này sẽ hiển thị trên profile của bạn
                    </p>
                  </div>
                )}

                <div>
                  <Label htmlFor="email" className="text-gray-700 flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); clearMessages(); }}
                    required
                    className="mt-1 h-12 border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <Label htmlFor="password" className="text-gray-700 flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Mật khẩu
                  </Label>
                  <div className="relative mt-1">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); clearMessages(); }}
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
                  {!isLogin && (
                    <p className="text-xs text-gray-500 mt-1">
                      Mật khẩu phải có ít nhất 6 ký tự
                    </p>
                  )}
                </div>

                {/* Forgot Password Link */}
                {isLogin && (
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => { setForgotPassword(true); clearMessages(); }}
                      className="text-sm text-cosmic-cyan hover:text-glow-cyan font-medium"
                    >
                      Quên mật khẩu?
                    </button>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 rounded-lg font-semibold text-white bg-gradient-to-r from-[#00E7FF] via-[#7A2BFF] via-[#FF00E5] to-[#FFD700] hover:opacity-90 transition-opacity"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {isLogin ? "Đang đăng nhập..." : "Đang đăng ký..."}
                    </span>
                  ) : (
                    isLogin ? "Đăng Nhập" : "Đăng Ký"
                  )}
                </Button>
              </form>

              {/* Continue without login */}
              <Button
                type="button"
                variant="outline"
                onClick={handleContinueWithoutLogin}
                className="w-full h-12 mt-4 rounded-lg border-cosmic-cyan text-cosmic-cyan hover:bg-cosmic-cyan/10 font-medium"
              >
                Tiếp tục không đăng nhập
              </Button>

              {/* Toggle Login/Signup */}
              <p className="text-center mt-6 text-gray-600">
                {isLogin ? "Chưa có " : "Đã có "}
                <span className="text-cosmic-cyan">tài khoản</span>
                {isLogin ? "? " : "? "}
                <button
                  type="button"
                  onClick={() => { setIsLogin(!isLogin); clearMessages(); }}
                  className="text-cosmic-cyan hover:text-glow-cyan font-semibold"
                >
                  {isLogin ? "Đăng ký ngay" : "Đăng nhập"}
                </button>
              </p>

              {/* Help text */}
              <div className="mt-4 p-3 rounded-lg bg-blue-50 border border-blue-200">
                <p className="text-xs text-blue-700 text-center">
                  💡 <strong>Gợi ý:</strong> Nếu bạn gặp vấn đề đăng nhập, hãy thử đặt lại mật khẩu hoặc liên hệ hỗ trợ.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
