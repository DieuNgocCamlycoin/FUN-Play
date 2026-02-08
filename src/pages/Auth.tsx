import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAutoReward } from "@/hooks/useAutoReward";
import { Eye, EyeOff, Mail, Lock, User, AlertCircle, CheckCircle, Loader2, AlertTriangle } from "lucide-react";
import { User as SupabaseUser, Session } from "@supabase/supabase-js";
import SetNewPasswordForm from "@/components/Auth/SetNewPasswordForm";

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
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
  const [showInvalidCredentialsHelp, setShowInvalidCredentialsHelp] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { awardSignupReward } = useAutoReward();
  const signupRewardedRef = useRef(false);

  // Check for password with leading/trailing spaces
  const hasPasswordSpaces = password.length > 0 && (password.startsWith(' ') || password.endsWith(' '));

  // Sanitize email: trim whitespace and convert to lowercase
  const sanitizeEmail = (email: string) => email.trim().toLowerCase();
  const isRecoveryRef = useRef(false); // Synchronous flag for immediate checks

  useEffect(() => {
    // 🔴 CRITICAL: Check URL hash SYNCHRONOUSLY before ANY async operations
    const checkRecoveryMode = () => {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const recoveryType = hashParams.get('type');
      const accessToken = hashParams.get('access_token');
      
      // Recovery mode if type=recovery OR if we have access_token in hash (email link)
      if (recoveryType === 'recovery' || (accessToken && recoveryType === 'recovery')) {
        console.log("[Auth] Recovery mode detected from URL hash");
        isRecoveryRef.current = true;
        setIsPasswordRecovery(true);
        return true;
      }
      return false;
    };
    
    // Run IMMEDIATELY - before any Supabase calls
    const isRecovery = checkRecoveryMode();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("[Auth] State change:", { event, hasSession: !!session, isRecoveryRef: isRecoveryRef.current });
        
        // 🔴 PRIORITY 1: Handle PASSWORD_RECOVERY event FIRST
        if (event === 'PASSWORD_RECOVERY') {
          console.log("[Auth] PASSWORD_RECOVERY event - blocking all redirects");
          isRecoveryRef.current = true;
          setIsPasswordRecovery(true);
          setSession(session);
          setUser(session?.user ?? null);
          return; // STOP - don't process further
        }
        
        // 🔴 PRIORITY 2: If in recovery mode, block ALL redirects
        if (isRecoveryRef.current) {
          console.log("[Auth] Recovery mode active - blocking redirect");
          // Still update session/user for the password form to work
          if (session) {
            setSession(session);
            setUser(session.user);
          }
          return; // STOP - don't redirect
        }
        
        // Normal flow - update state
        setSession(session);
        setUser(session?.user ?? null);
        
        // Award signup reward for new users
        if (event === 'SIGNED_IN' && session?.user && !signupRewardedRef.current) {
          signupRewardedRef.current = true;
          setTimeout(() => {
            awardSignupReward(session.user.id);
          }, 1000);
        }
        
        // 🔴 ONLY redirect if NOT in recovery mode AND user is logged in
        if (event === 'SIGNED_IN' && session?.user && !isRecoveryRef.current) {
          console.log("[Auth] Redirecting to home - not in recovery mode");
          navigate("/");
        }
      }
    );

    // Initial session check - but NEVER redirect if in recovery mode
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("[Auth] getSession:", { hasSession: !!session, isRecoveryRef: isRecoveryRef.current });
      
      // If we detected recovery mode from URL, don't do anything here
      if (isRecoveryRef.current) {
        console.log("[Auth] getSession: Recovery mode - skipping redirect");
        if (session) {
          setSession(session);
          setUser(session.user);
        }
        return;
      }
      
      setSession(session);
      setUser(session?.user ?? null);
      // Note: Don't navigate here - let onAuthStateChange handle it
    });

    return () => subscription.unsubscribe();
  }, [navigate, awardSignupReward]);

  const clearMessages = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setShowInvalidCredentialsHelp(false);
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
      const cleanEmail = sanitizeEmail(email);
      
      const { error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            display_name: displayName || cleanEmail.split("@")[0],
          },
        },
      });

      if (error) throw error;

      // Track IP for signup (non-blocking)
      try {
        const { data: { session: newSession } } = await supabase.auth.getSession();
        if (newSession?.access_token) {
          supabase.functions.invoke('track-ip', {
            body: { action_type: 'signup' },
          }).catch(e => console.warn('[Auth] track-ip signup failed:', e));
        }
      } catch (e) {
        console.warn('[Auth] track-ip error:', e);
      }

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
      const cleanEmail = sanitizeEmail(email);
      
      const { error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) throw error;
      
      // Track IP for login (non-blocking)
      supabase.functions.invoke('track-ip', {
        body: { action_type: 'login' },
      }).catch(e => console.warn('[Auth] track-ip login failed:', e));

      setSuccessMessage("Đăng nhập thành công!");
    } catch (error: any) {
      const vietnameseError = getVietnameseError(error.message);
      setErrorMessage(vietnameseError);
      
      // Show helpful link if invalid credentials
      if (error.message?.toLowerCase().includes("invalid login credentials")) {
        setShowInvalidCredentialsHelp(true);
      }
      
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
      const cleanEmail = sanitizeEmail(email);
      
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
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
            {isPasswordRecovery 
              ? "Đặt Mật Khẩu Mới" 
              : forgotPassword 
                ? "Quên Mật Khẩu" 
                : isLogin 
                  ? "Đăng Nhập" 
                  : "Đăng Ký"}
          </h2>
          
          {/* Instruction text */}
          <p className="text-center text-gray-600 text-sm mb-6">
            {isPasswordRecovery 
              ? "Nhập mật khẩu mới cho tài khoản của bạn"
              : forgotPassword 
                ? "Nhập email để nhận link đặt lại mật khẩu" 
                : isLogin 
                  ? "Chào mừng trở lại! Hãy đăng nhập để tiếp tục." 
                  : "Tạo tài khoản mới để trải nghiệm FUN PLAY!"}
          </p>

          {/* Password Recovery Form */}
          {isPasswordRecovery ? (
            <SetNewPasswordForm 
              onSuccess={() => {
                isRecoveryRef.current = false; // Reset ref để cho phép redirect
                setIsPasswordRecovery(false);
                toast({
                  title: "Mật khẩu đã được cập nhật!",
                  description: "Hãy đăng nhập với mật khẩu mới.",
                });
                setSuccessMessage("Mật khẩu đã được đặt lại thành công!");
              }}
              onBackToLogin={async () => {
                isRecoveryRef.current = false; // Reset ref nếu user quay lại
                await supabase.auth.signOut();
                setIsPasswordRecovery(false);
              }}
            />
          ) : (
            <>

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-4 p-3 rounded-lg bg-red-100 border border-red-300">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-red-700 text-sm">{errorMessage}</p>
              </div>
              {showInvalidCredentialsHelp && (
                <button
                  type="button"
                  onClick={() => { setForgotPassword(true); clearMessages(); }}
                  className="mt-2 text-sm text-purple-600 hover:text-purple-700 font-medium underline"
                >
                  Quên mật khẩu? Nhấn vào đây để đặt lại
                </button>
              )}
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
                className="w-full text-purple-600 hover:text-purple-700"
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
                  {hasPasswordSpaces && (
                    <div className="flex items-center gap-1 mt-1">
                      <AlertTriangle className="h-3 w-3 text-amber-500" />
                      <p className="text-xs text-amber-600">
                        Mật khẩu có khoảng trắng ở đầu hoặc cuối
                      </p>
                    </div>
                  )}
                </div>

                {/* Forgot Password Link */}
                {isLogin && (
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => { setForgotPassword(true); clearMessages(); }}
                      className="text-sm text-purple-600 hover:text-purple-700 font-medium"
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

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white/50 text-gray-500">Hoặc tiếp tục với</span>
                </div>
              </div>

              {/* Google Sign-In Button */}
              <Button
                type="button"
                variant="outline"
                onClick={async () => {
                  setLoading(true);
                  clearMessages();
                  const { error } = await lovable.auth.signInWithOAuth("google", {
                    redirect_uri: window.location.origin,
                  });
                  if (error) {
                    setErrorMessage(getVietnameseError(error.message));
                  }
                  setLoading(false);
                }}
                disabled={loading}
                className="w-full h-12 rounded-lg border-gray-300 bg-white hover:bg-gray-50 font-medium flex items-center justify-center gap-3"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                <span className="text-gray-700">Đăng nhập với Google</span>
              </Button>

              {/* Continue without login */}
              <Button
                type="button"
                variant="outline"
                onClick={handleContinueWithoutLogin}
                className="w-full h-12 mt-3 rounded-lg border-purple-300 text-purple-600 hover:bg-purple-50 font-medium"
              >
                Tiếp tục không đăng nhập
              </Button>

              {/* Toggle Login/Signup */}
              <p className="text-center mt-6 text-gray-600">
                {isLogin ? "Chưa có " : "Đã có "}
                <span className="text-purple-600">tài khoản</span>
                {isLogin ? "? " : "? "}
                <button
                  type="button"
                  onClick={() => { setIsLogin(!isLogin); clearMessages(); }}
                  className="text-pink-500 hover:text-pink-600 font-semibold"
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
          </>
          )}
        </div>
      </div>
    </div>
  );
}
