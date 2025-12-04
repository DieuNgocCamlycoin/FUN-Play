import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Play, ArrowLeft, Eye, EyeOff, Wallet, Mail } from "lucide-react";
import { User, Session } from "@supabase/supabase-js";
import { getWeb3Modal, wagmiConfig } from "@/lib/web3Config";
import { getAccount, disconnect } from "@wagmi/core";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [walletLoading, setWalletLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Initialize Web3Modal
    getWeb3Modal();
    
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

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });

      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Google Login Failed",
        description: error.message || "Failed to log in with Google",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const handleWalletLogin = async () => {
    setWalletLoading(true);
    
    try {
      const modal = getWeb3Modal();
      if (!modal) {
        throw new Error("Web3Modal not initialized");
      }

      await modal.open();
      
      // Wait for connection
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const account = getAccount(wagmiConfig);
      
      if (account.isConnected && account.address) {
        const walletAddress = account.address;
        
        // Check if user exists with this wallet address
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id, username')
          .eq('wallet_address', walletAddress)
          .single();

        if (existingProfile) {
          // User exists - sign in with a special wallet-based email
          const walletEmail = `${walletAddress.toLowerCase()}@wallet.funplay.local`;
          
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email: walletEmail,
            password: walletAddress, // Use wallet address as password
          });

          if (signInError) {
            // If sign in fails, the user might have registered differently
            toast({
              title: "Wallet Connected",
              description: "Please link this wallet to your existing account in Profile Settings.",
            });
            
            // Store wallet address temporarily
            localStorage.setItem('pendingWalletAddress', walletAddress);
            navigate("/");
          } else {
            toast({
              title: "Welcome Back",
              description: `Logged in with wallet ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`,
            });
          }
        } else {
          // New user - create account with wallet
          const walletEmail = `${walletAddress.toLowerCase()}@wallet.funplay.local`;
          const username = `user_${walletAddress.slice(2, 10).toLowerCase()}`;
          
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: walletEmail,
            password: walletAddress,
            options: {
              data: {
                display_name: `Wallet ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`,
                wallet_address: walletAddress,
              },
            },
          });

          if (signUpError) {
            // Try to sign in if already exists
            const { error: retrySignIn } = await supabase.auth.signInWithPassword({
              email: walletEmail,
              password: walletAddress,
            });
            
            if (retrySignIn) {
              throw retrySignIn;
            }
          }

          // Update profile with wallet address
          if (signUpData?.user) {
            await supabase
              .from('profiles')
              .update({ 
                wallet_address: walletAddress,
                wallet_type: 'MetaMask'
              })
              .eq('id', signUpData.user.id);
          }

          toast({
            title: "Account Created",
            description: `Welcome! Your wallet ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)} is now connected.`,
          });
        }
      } else {
        toast({
          title: "Connection Cancelled",
          description: "Wallet connection was cancelled.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Wallet login error:", error);
      toast({
        title: "Wallet Login Failed",
        description: error.message || "Failed to connect wallet",
        variant: "destructive",
      });
    } finally {
      setWalletLoading(false);
    }
  };

  const handleContinueWithoutLogin = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a1a] via-[#1a0a2e] to-[#0a1a2e] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-[500px] h-[500px] bg-[#7A2BFF]/20 rounded-full blur-3xl -top-48 -left-48 animate-pulse" />
        <div className="absolute w-[400px] h-[400px] bg-[#FF00E5]/20 rounded-full blur-3xl -bottom-32 -right-32 animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute w-[300px] h-[300px] bg-[#00E7FF]/20 rounded-full blur-3xl top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Back Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => navigate("/")}
        className="absolute top-4 left-4 text-white hover:bg-white/10"
      >
        <ArrowLeft className="h-6 w-6" />
      </Button>

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Logo */}
        <div className="flex justify-center">
          <div className="flex items-center gap-3 bg-gradient-to-r from-[#00E7FF] via-[#7A2BFF] via-[#FF00E5] to-[#FFD700] px-6 py-3 rounded-2xl shadow-2xl shadow-[#7A2BFF]/30">
            <Play className="h-10 w-10 text-white fill-white" />
            <div className="text-3xl font-bold text-white tracking-wider">
              FUN PLAY
            </div>
          </div>
        </div>

        {/* Auth Form */}
        <div className="bg-black/40 backdrop-blur-xl border border-[#7A2BFF]/50 rounded-2xl p-8 shadow-2xl shadow-[#7A2BFF]/20">
          <h2 className="text-2xl font-bold text-center mb-6 bg-gradient-to-r from-[#00E7FF] via-[#7A2BFF] via-[#FF00E5] to-[#FFD700] bg-clip-text text-transparent">
            {isLogin ? "Welcome Back" : "Create Account"}
          </h2>

          {/* Wallet Login Section */}
          <div className="mb-6 space-y-3">
            <Button
              type="button"
              onClick={handleWalletLogin}
              disabled={walletLoading}
              className="w-full bg-gradient-to-r from-[#F6851B] to-[#E2761B] hover:from-[#E2761B] hover:to-[#CD6116] text-white font-semibold py-6 rounded-xl flex items-center justify-center gap-3 transition-all duration-300 shadow-lg shadow-[#F6851B]/30"
            >
              <Wallet className="h-5 w-5" />
              {walletLoading ? "Connecting..." : "Connect with MetaMask"}
            </Button>

            <Button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full bg-white hover:bg-gray-100 text-gray-800 font-semibold py-6 rounded-xl flex items-center justify-center gap-3 transition-all duration-300"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </Button>
          </div>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/20"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-transparent text-white/60">or continue with email</span>
            </div>
          </div>

          <form onSubmit={isLogin ? handleLogin : handleSignUp} className="space-y-4">
            {!isLogin && (
              <div>
                <Label htmlFor="displayName" className="text-white/80">Display Name</Label>
                <Input
                  id="displayName"
                  type="text"
                  placeholder="Your Name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="mt-1 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-[#7A2BFF] focus:ring-[#7A2BFF]"
                />
              </div>
            )}

            <div>
              <Label htmlFor="email" className="text-white/80">Email</Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-[#7A2BFF] focus:ring-[#7A2BFF]"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password" className="text-white/80">Password</Label>
              <div className="relative mt-1">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pr-10 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-[#7A2BFF] focus:ring-[#7A2BFF]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-[#00E7FF] via-[#7A2BFF] via-[#FF00E5] to-[#FFD700] hover:opacity-90 text-white font-semibold py-6 rounded-xl transition-all duration-300 shadow-lg shadow-[#7A2BFF]/30"
              disabled={loading}
            >
              {loading ? "Loading..." : isLogin ? "Sign In" : "Sign Up"}
            </Button>
          </form>

          {isLogin && (
            <div className="mt-4">
              <Button
                variant="outline"
                className="w-full border border-white/20 bg-white/5 text-white hover:bg-white/10 py-6 rounded-xl transition-all duration-300"
                onClick={handleContinueWithoutLogin}
              >
                Continue without login
              </Button>
            </div>
          )}

          <div className="mt-6 text-center">
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

        {/* Info text */}
        <p className="text-center text-white/40 text-xs">
          Web3 features require wallet connection. Basic features work without login.
        </p>
      </div>
    </div>
  );
}
