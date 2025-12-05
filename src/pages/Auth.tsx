import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Play, Eye, EyeOff } from "lucide-react";
import { User, Session } from "@supabase/supabase-js";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
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
  }, [navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

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

      toast({
        title: "Account Created",
        description: "Welcome to FUN PLAY!",
      });
    } catch (error: any) {
      toast({
        title: "Sign Up Failed",
        description: error.message || "Failed to create account",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "Failed to log in",
        variant: "destructive",
      });
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
        {/* Logo */}
        <div className="flex justify-center">
          <div className="flex items-center gap-3 bg-gradient-to-r from-[#00E7FF] via-[#7A2BFF] via-[#FF00E5] to-[#FFD700] px-6 py-3 rounded-2xl shadow-lg">
            <Play className="h-8 w-8 text-white fill-white" />
            <div className="text-2xl font-bold text-white tracking-wider">
              FUN PLAY
            </div>
          </div>
        </div>

        {/* Auth Card - Frosted Glass */}
        <div className="bg-white/80 backdrop-blur-xl border-2 border-purple-500/50 rounded-2xl p-8 shadow-lg">
          <h2 className="text-2xl font-bold text-center mb-6 bg-gradient-to-r from-[#00E7FF] via-[#7A2BFF] to-[#FF00E5] bg-clip-text text-transparent">
            {isLogin ? "Sign In" : "Sign Up"}
          </h2>

          {/* Email/Password Form */}
          <form onSubmit={isLogin ? handleLogin : handleSignUp} className="space-y-4">
            {!isLogin && (
              <div>
                <Label htmlFor="displayName" className="text-gray-700">Display Name</Label>
                <Input
                  id="displayName"
                  type="text"
                  placeholder="Your Name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="mt-1 h-12 border-gray-300 rounded-lg"
                />
              </div>
            )}

            <div>
              <Label htmlFor="email" className="text-gray-700">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 h-12 border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-gray-700">Password</Label>
              <div className="relative mt-1">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-lg font-semibold text-white bg-gradient-to-r from-[#00E7FF] via-[#7A2BFF] via-[#FF00E5] to-[#FFD700] hover:opacity-90 transition-opacity"
            >
              {loading ? "Loading..." : isLogin ? "Sign In" : "Sign Up"}
            </Button>
          </form>

          {/* Continue without login */}
          <Button
            type="button"
            variant="outline"
            onClick={handleContinueWithoutLogin}
            className="w-full h-12 mt-4 rounded-lg border-purple-300 text-purple-600 hover:bg-purple-50 font-medium"
          >
            Continue without login
          </Button>

          {/* Toggle Login/Signup */}
          <p className="text-center mt-6 text-gray-600">
            {isLogin ? "Don't have an " : "Already have an "}
            <span className="text-purple-600">account</span>
            {isLogin ? "? " : "? "}
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-pink-500 hover:text-pink-600 font-semibold"
            >
              {isLogin ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
