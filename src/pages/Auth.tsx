import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Play, ArrowLeft, Eye, EyeOff, Mail, Heart, ChevronDown } from "lucide-react";
import { User, Session } from "@supabase/supabase-js";
import { motion, AnimatePresence } from "framer-motion";

// Heart particle component for hover effect
const HeartParticle = ({ x, y }: { x: number; y: number }) => (
  <motion.div
    initial={{ opacity: 1, scale: 0.5, x: 0, y: 0 }}
    animate={{ 
      opacity: 0, 
      scale: 1.5, 
      x: (Math.random() - 0.5) * 100, 
      y: -80 - Math.random() * 40 
    }}
    exit={{ opacity: 0 }}
    transition={{ duration: 1, ease: "easeOut" }}
    className="absolute pointer-events-none text-pink-400"
    style={{ left: x, top: y }}
  >
    <Heart className="h-4 w-4 fill-current" />
  </motion.div>
);

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [walletLoading, setWalletLoading] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [hearts, setHearts] = useState<{ id: number; x: number; y: number }[]>([]);
  const heartIdRef = useRef(0);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          toast({
            title: "Welcome back, Philanthropist ♡",
            description: "You're now in the FUN PLAY universe!",
          });
          setTimeout(() => {
            navigate("/");
          }, 800);
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
  }, [navigate, toast]);

  const addHeart = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = heartIdRef.current++;
    setHearts(prev => [...prev, { id, x, y }]);
    setTimeout(() => {
      setHearts(prev => prev.filter(h => h.id !== id));
    }, 1000);
  };

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
        title: "Account Created ♡",
        description: "Welcome to the FUN PLAY family!",
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

  const handleWalletLogin = async (walletType: 'MetaMask' | 'Bitget') => {
    setWalletLoading(walletType);
    
    try {
      const ethereum = (window as any).ethereum;
      
      if (!ethereum) {
        // On mobile, try to open wallet app
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        if (isMobile) {
          const dappUrl = encodeURIComponent(window.location.href);
          if (walletType === 'MetaMask') {
            window.location.href = `https://metamask.app.link/dapp/${dappUrl}`;
          } else {
            window.location.href = `https://bkcode.vip/dapp/${dappUrl}`;
          }
          return;
        }
        
        toast({
          title: "Wallet Not Found",
          description: `Please install ${walletType} extension first.`,
          variant: "destructive",
        });
        setWalletLoading(null);
        return;
      }

      const isBitget = ethereum.isBitKeep || ethereum.isBitget;
      const isMetaMask = ethereum.isMetaMask && !isBitget;
      
      if (walletType === 'Bitget' && !isBitget && isMetaMask) {
        // If user wants Bitget but only MetaMask is available, use MetaMask
        toast({
          title: "Using MetaMask",
          description: "Bitget Wallet not detected, connecting with MetaMask instead.",
        });
      }

      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      
      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts found");
      }

      const walletAddress = accounts[0];

      // Switch to BSC
      try {
        await ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x38' }],
        });
      } catch (switchError: any) {
        if (switchError.code === 4902) {
          await ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0x38',
              chainName: 'BNB Smart Chain',
              nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
              rpcUrls: ['https://bsc-dataseed.binance.org/'],
              blockExplorerUrls: ['https://bscscan.com/'],
            }],
          });
        }
      }

      const detectedWalletType = isBitget ? 'Bitget' : 'MetaMask';
        
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id, username')
        .eq('wallet_address', walletAddress)
        .single();

      if (existingProfile) {
        const walletEmail = `${walletAddress.toLowerCase()}@wallet.funplay.local`;
        
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: walletEmail,
          password: walletAddress,
        });

        if (signInError) {
          localStorage.setItem('pendingWalletAddress', walletAddress);
          toast({
            title: "Welcome back, Philanthropist ♡",
            description: "You're now in the FUN PLAY universe!",
          });
          setTimeout(() => navigate("/"), 800);
        }
      } else {
        const walletEmail = `${walletAddress.toLowerCase()}@wallet.funplay.local`;
        
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
          const { error: retrySignIn } = await supabase.auth.signInWithPassword({
            email: walletEmail,
            password: walletAddress,
          });
          
          if (retrySignIn) {
            throw retrySignIn;
          }
        }

        if (signUpData?.user) {
          await supabase
            .from('profiles')
            .update({ 
              wallet_address: walletAddress,
              wallet_type: detectedWalletType
            })
            .eq('id', signUpData.user.id);
        }
      }
    } catch (error: any) {
      console.error("Wallet login error:", error);
      toast({
        title: "Wallet Login Failed",
        description: error.message || "Failed to connect wallet",
        variant: "destructive",
      });
    } finally {
      setWalletLoading(null);
    }
  };

  const handleContinueWithoutLogin = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Video Background */}
      <div className="fixed inset-0 overflow-hidden -z-20">
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          className="w-full h-full object-cover object-center"
        >
          <source src="/videos/heartbeat-bg.mp4" type="video/mp4" />
        </video>
      </div>
      
      {/* Gradient Overlay */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-[rgba(138,43,226,0.4)] via-[rgba(255,0,150,0.2)] to-[rgba(0,231,255,0.3)]" />

      {/* Back Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => navigate("/")}
        className="absolute top-4 left-4 text-white hover:bg-white/20"
      >
        <ArrowLeft className="h-6 w-6" />
      </Button>

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Logo */}
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="flex justify-center"
        >
          <div className="flex items-center gap-3 bg-gradient-to-r from-[#00E7FF] via-[#7A2BFF] via-[#FF00E5] to-[#FFD700] px-6 py-3 rounded-2xl shadow-2xl shadow-[#7A2BFF]/40">
            <Play className="h-10 w-10 text-white fill-white" />
            <div className="text-3xl font-bold text-white tracking-wider">
              FUN PLAY
            </div>
          </div>
        </motion.div>

        {/* Main Auth Card */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 shadow-[0_20px_60px_rgba(0,0,0,0.3)]"
        >
          <h2 className="text-2xl font-bold text-center mb-2 text-white drop-shadow-lg">
            ✨ Super Fast Login ✨
          </h2>
          <p className="text-center text-white/70 text-sm mb-6">
            One click to enter the FUN PLAY universe
          </p>

          {/* Main Login Buttons - Priority Order */}
          <div className="space-y-4">
            {/* MetaMask Button */}
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                type="button"
                onClick={(e) => { addHeart(e); handleWalletLogin('MetaMask'); }}
                onMouseMove={addHeart}
                disabled={walletLoading !== null}
                className="relative overflow-hidden w-full h-16 text-lg font-bold rounded-2xl flex items-center justify-center gap-3 transition-all duration-300 bg-gradient-to-r from-[#F6851B] via-[#E2761B] to-[#CD6116] hover:shadow-[0_0_40px_rgba(246,133,27,0.6)] border-2 border-[#FFD700]/50"
              >
                <AnimatePresence>
                  {hearts.map(heart => (
                    <HeartParticle key={heart.id} x={heart.x} y={heart.y} />
                  ))}
                </AnimatePresence>
                <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg" 
                  alt="MetaMask" 
                  className="h-8 w-8" 
                />
                <span className="text-white drop-shadow-lg">
                  {walletLoading === 'MetaMask' ? "Connecting..." : "Connect MetaMask"}
                </span>
              </Button>
            </motion.div>

            {/* Bitget Button */}
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                type="button"
                onClick={(e) => { addHeart(e); handleWalletLogin('Bitget'); }}
                onMouseMove={addHeart}
                disabled={walletLoading !== null}
                className="relative overflow-hidden w-full h-16 text-lg font-bold rounded-2xl flex items-center justify-center gap-3 transition-all duration-300 bg-gradient-to-r from-[#00D4AA] via-[#00B894] to-[#00A085] hover:shadow-[0_0_40px_rgba(0,212,170,0.6)] border-2 border-[#00FFD1]/50"
              >
                <AnimatePresence>
                  {hearts.map(heart => (
                    <HeartParticle key={heart.id} x={heart.x} y={heart.y} />
                  ))}
                </AnimatePresence>
                <svg className="h-8 w-8" viewBox="0 0 24 24" fill="white">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
                <span className="text-white drop-shadow-lg">
                  {walletLoading === 'Bitget' ? "Connecting..." : "Connect Bitget Wallet"}
                </span>
              </Button>
            </motion.div>

            {/* Google Button */}
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="relative w-full h-16 text-lg font-bold rounded-2xl flex items-center justify-center gap-3 transition-all duration-300 bg-gradient-to-r from-[#4285F4] via-[#34A853] via-[#FBBC05] to-[#EA4335] hover:shadow-[0_0_40px_rgba(66,133,244,0.6)] border-2 border-white/30"
              >
                <svg className="h-7 w-7" viewBox="0 0 24 24">
                  <path fill="white" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="white" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="white" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="white" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span className="text-white drop-shadow-lg">
                  {loading ? "Loading..." : "Continue with Google"}
                </span>
              </Button>
            </motion.div>
          </div>

          {/* Expandable Email/Password Section */}
          <div className="mt-6">
            <button
              onClick={() => setShowEmailForm(!showEmailForm)}
              className="w-full flex items-center justify-center gap-2 text-white/60 hover:text-white/90 text-sm transition-colors py-2"
            >
              <span>More options</span>
              <motion.div
                animate={{ rotate: showEmailForm ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                <ChevronDown className="h-4 w-4" />
              </motion.div>
            </button>

            <AnimatePresence>
              {showEmailForm && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="pt-4 border-t border-white/20 mt-4">
                    <form onSubmit={isLogin ? handleLogin : handleSignUp} className="space-y-3">
                      {!isLogin && (
                        <div>
                          <Label htmlFor="displayName" className="text-white/80 text-xs">Display Name</Label>
                          <Input
                            id="displayName"
                            type="text"
                            placeholder="Your Name"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            className="mt-1 h-10 text-sm bg-white/10 border-white/20 text-white placeholder:text-white/40"
                          />
                        </div>
                      )}

                      <div>
                        <Label htmlFor="email" className="text-white/80 text-xs">Email</Label>
                        <div className="relative mt-1">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                          <Input
                            id="email"
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="pl-10 h-10 text-sm bg-white/10 border-white/20 text-white placeholder:text-white/40"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="password" className="text-white/80 text-xs">Password</Label>
                        <div className="relative mt-1">
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="pr-10 h-10 text-sm bg-white/10 border-white/20 text-white placeholder:text-white/40"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      <Button
                        type="submit"
                        className="w-full h-10 text-sm bg-white/20 hover:bg-white/30 text-white rounded-xl"
                        disabled={loading}
                      >
                        {loading ? "Loading..." : isLogin ? "Sign In" : "Sign Up"}
                      </Button>
                    </form>

                    <div className="mt-3 flex items-center justify-between text-xs">
                      <button
                        onClick={() => setIsLogin(!isLogin)}
                        className="text-white/60 hover:text-white"
                      >
                        {isLogin ? "Create account" : "Sign in instead"}
                      </button>
                      
                      <button
                        onClick={handleContinueWithoutLogin}
                        className="text-white/60 hover:text-white"
                      >
                        Skip login →
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Info text */}
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-white/50 text-xs drop-shadow"
        >
          ♡ One click. Pure love. Instant access. ♡
        </motion.p>
      </div>
    </div>
  );
}
