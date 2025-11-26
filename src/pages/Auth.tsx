import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Play, ArrowLeft } from "lucide-react";
import { User, Session } from "@supabase/supabase-js";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(() => {
            navigate("/");
          }, 0);
        }
      }
    );

    // Check for existing session
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
        description: "Your account has been created successfully!",
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

      toast({
        title: "Welcome Back",
        description: "You have successfully logged in!",
      });
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
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative">
      {/* Back Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => navigate("/")}
        className="absolute top-4 left-4"
      >
        <ArrowLeft className="h-6 w-6" />
      </Button>

      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="flex justify-center">
          <div className="flex items-center gap-2 bg-gradient-to-r from-[#00E7FF] via-[#7A2BFF] via-[#FF00E5] to-[#FFD700] px-4 py-2 rounded-lg shadow-lg">
            <Play className="h-8 w-8 text-white fill-white" />
            <div className="text-2xl font-bold text-white">
              FUN PLAY
            </div>
          </div>
        </div>

        {/* Auth Form */}
        <div className="bg-card border-2 border-[#7A2BFF] rounded-lg p-8 shadow-xl">
          <h2 className="text-2xl font-bold text-center mb-6 bg-gradient-to-r from-[#00E7FF] via-[#7A2BFF] via-[#FF00E5] to-[#FFD700] bg-clip-text text-transparent">
            {isLogin ? "Sign In" : "Create Account"}
          </h2>

          <form onSubmit={isLogin ? handleLogin : handleSignUp} className="space-y-4">
            {!isLogin && (
              <div>
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  type="text"
                  placeholder="Your Name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="mt-1"
                />
              </div>
            )}

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-[#00E7FF] via-[#7A2BFF] via-[#FF00E5] to-[#FFD700] hover:opacity-90 text-white"
              disabled={loading}
            >
              {loading ? "Loading..." : isLogin ? "Sign In" : "Sign Up"}
            </Button>
          </form>

          {isLogin && (
            <div className="mt-4">
              <Button
                variant="outline"
                className="w-full border-2 border-[#7A2BFF] bg-gradient-to-r from-[#00E7FF] via-[#7A2BFF] via-[#FF00E5] to-[#FFD700] bg-clip-text text-transparent hover:bg-gradient-to-r hover:from-[#00E7FF] hover:via-[#7A2BFF] hover:via-[#FF00E5] hover:to-[#FFD700] hover:text-white"
                onClick={handleContinueWithoutLogin}
              >
                Continue without login
              </Button>
            </div>
          )}

          <div className="mt-4 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="bg-gradient-to-r from-[#00E7FF] via-[#7A2BFF] via-[#FF00E5] to-[#FFD700] bg-clip-text text-transparent hover:underline text-sm font-semibold"
            >
              {isLogin
                ? "Don't have an account? Sign up"
                : "Already have an account? Sign in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
