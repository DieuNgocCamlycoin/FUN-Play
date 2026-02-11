import { useState, useEffect, useRef, useCallback } from "react";
import { Search, Loader2, X, Smile, ArrowLeft, AlertTriangle, Copy, Wallet, Play, Pause } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useDonation, DonationTransaction, DonationToken } from "@/hooks/useDonation";
import { useInternalWallet } from "@/hooks/useInternalWallet";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { ethers } from "ethers";
import { SUPPORTED_TOKENS } from "@/config/tokens";
import { motion, AnimatePresence } from "framer-motion";
import { GiftCelebrationModal } from "./GiftCelebrationModal";

interface EnhancedDonateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultReceiverId?: string;
  defaultReceiverName?: string;
  defaultReceiverAvatar?: string;
  defaultReceiverWallet?: string;
  contextType?: "global" | "post" | "video" | "comment";
  contextId?: string;
  onSuccess?: (transaction: DonationTransaction) => void;
}

interface UserResult {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  wallet_address: string | null;
}

interface SenderProfile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  wallet_address: string | null;
}

// Emoji categories for quick picker
const EMOJI_LIST = ["💖", "❤️", "🥰", "😍", "🙏", "🔥", "💯", "⭐", "🌟", "✨", "🎉", "🎁", "💪", "👏", "🤝", "💕"];

// Donation themes
const DONATION_THEMES = [
  { id: "celebration", emoji: "🎉", label: "Chúc mừng" },
  { id: "gratitude", emoji: "🙏", label: "Tri ân" },
  { id: "birthday", emoji: "🎂", label: "Sinh nhật" },
  { id: "love", emoji: "❤️", label: "Tình yêu" },
  { id: "newyear", emoji: "🎊", label: "Năm mới" },
  { id: "family", emoji: "👨‍👩‍👧‍👦", label: "Gia đình" },
];

// Music options with real audio files
const MUSIC_OPTIONS = [
  { id: "rich-celebration", label: "Rich! Rich! Rich!", description: "Mặc định", src: "/audio/rich-celebration.mp3" },
  { id: "rich-2", label: "Rich Vibe", description: "Năng lượng tích cực", src: "/audio/rich-2.mp3" },
  { id: "rich-3", label: "Rich Energy", description: "Giàu có & yêu thương", src: "/audio/rich-3.mp3" },
];

const shortenAddress = (addr: string) => addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : "";

const CopyButton = ({ text }: { text: string }) => (
  <button
    type="button"
    onClick={() => { navigator.clipboard.writeText(text); toast({ title: "Đã copy! 📋" }); }}
    className="p-1 hover:bg-muted rounded transition-colors"
  >
    <Copy className="h-3 w-3 text-muted-foreground" />
  </button>
);

export const EnhancedDonateModal = ({
  open,
  onOpenChange,
  defaultReceiverId,
  defaultReceiverName,
  defaultReceiverAvatar,
  defaultReceiverWallet,
  contextType = "global",
  contextId,
  onSuccess,
}: EnhancedDonateModalProps) => {
  const { user } = useAuth();
  const { loading, tokens, fetchTokens, createDonation } = useDonation();
  const { getBalanceBySymbol } = useInternalWallet();

  // Step: 1=input, 2=review, 3=success
  const [step, setStep] = useState(1);

  // Form state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  const [selectedReceiver, setSelectedReceiver] = useState<UserResult | null>(null);
  const [selectedToken, setSelectedToken] = useState<DonationToken | null>(null);
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [selectedTheme, setSelectedTheme] = useState("celebration");
  const [selectedMusic, setSelectedMusic] = useState("rich-celebration");

  // BSC balance state
  const [bscBalance, setBscBalance] = useState<string | null>(null);
  const [loadingBscBalance, setLoadingBscBalance] = useState(false);

  // Success state
  const [completedTransaction, setCompletedTransaction] = useState<DonationTransaction | null>(null);

  // Sender profile
  const [senderProfile, setSenderProfile] = useState<SenderProfile | null>(null);

  // Emoji picker
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Audio preview
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const previewTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [playingMusicId, setPlayingMusicId] = useState<string | null>(null);

  // Track if modal has been initialized this session
  const didInitRef = useRef(false);

  const quickAmounts = [10, 50, 100, 500];

  // Stop audio preview
  const stopPreview = useCallback(() => {
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current.currentTime = 0;
      previewAudioRef.current = null;
    }
    if (previewTimeoutRef.current) {
      clearTimeout(previewTimeoutRef.current);
      previewTimeoutRef.current = null;
    }
    setPlayingMusicId(null);
  }, []);

  // Play audio preview (5 seconds)
  const togglePreview = useCallback((musicId: string) => {
    if (playingMusicId === musicId) {
      stopPreview();
      return;
    }
    stopPreview();
    const option = MUSIC_OPTIONS.find(m => m.id === musicId);
    if (!option) return;

    const audio = new Audio(option.src);
    audio.volume = 0.5;
    audio.play().catch(() => {});
    previewAudioRef.current = audio;
    setPlayingMusicId(musicId);

    previewTimeoutRef.current = setTimeout(() => {
      stopPreview();
    }, 5000);

    audio.onended = () => stopPreview();
  }, [playingMusicId, stopPreview]);

  // Stop preview when leaving step 2 or closing modal
  useEffect(() => {
    if (step !== 2 || !open) {
      stopPreview();
    }
  }, [step, open, stopPreview]);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopPreview();
  }, [stopPreview]);

  // Fetch sender profile
  useEffect(() => {
    const fetchSender = async () => {
      if (!user?.id) return;
      const { data } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url, wallet_address")
        .eq("id", user.id)
        .single();
      if (data) setSenderProfile(data);
    };
    if (open && user) fetchSender();
  }, [open, user]);

  // Initialize on open
  useEffect(() => {
    if (!open) {
      didInitRef.current = false;
      return;
    }
    if (didInitRef.current) return;
    didInitRef.current = true;

    fetchTokens().then((fetchedTokens) => {
      if (fetchedTokens && fetchedTokens.length > 0) {
        const sorted = [...fetchedTokens].sort((a, b) => a.priority - b.priority);
        setSelectedToken(sorted[0]);
      }
    });

    if (defaultReceiverId) {
      setSelectedReceiver({
        id: defaultReceiverId,
        username: defaultReceiverName || "",
        display_name: defaultReceiverName || null,
        avatar_url: defaultReceiverAvatar || null,
        wallet_address: defaultReceiverWallet || null,
      });
      setShowSearch(false);
    } else {
      setSelectedReceiver(null);
      setShowSearch(true);
    }

    setAmount("");
    setMessage("");
    setSelectedTheme("celebration");
    setSelectedMusic("rich-celebration");
    setStep(1);
    setCompletedTransaction(null);
  }, [open, defaultReceiverId, defaultReceiverName, defaultReceiverAvatar, defaultReceiverWallet, fetchTokens]);

  // Fetch BSC on-chain balance when selecting a BSC token
  useEffect(() => {
    const fetchBscBalance = async () => {
      if (!selectedToken || selectedToken.chain === "internal") {
        setBscBalance(null);
        return;
      }

      // Prioritize connected wallet (wagmi) over DB profile wallet
      let walletAddress: string | null = null;
      try {
        const { getAccount } = await import("@wagmi/core");
        const { wagmiConfig } = await import("@/lib/web3Config");
        const account = getAccount(wagmiConfig);
        walletAddress = account?.address || null;
      } catch {
        // ignore
      }
      if (!walletAddress) {
        walletAddress = senderProfile?.wallet_address || null;
      }
      if (!walletAddress) {
        setBscBalance(null);
        return;
      }

      setLoadingBscBalance(true);
      try {
        const tokenConfig = SUPPORTED_TOKENS.find(t => t.symbol === selectedToken!.symbol);
        if (!tokenConfig) {
          setBscBalance("0");
          setLoadingBscBalance(false);
          return;
        }

        // Use correct RPC per token (FUN = Testnet, others = Mainnet)
        const { getRpcForToken } = await import("@/config/tokens");
        const readProvider = new ethers.JsonRpcProvider(getRpcForToken(tokenConfig.symbol));

        if (tokenConfig.address === "native") {
          const bal = await readProvider.getBalance(walletAddress);
          setBscBalance(ethers.formatEther(bal));
        } else {
          const erc20Abi = ["function balanceOf(address) view returns (uint256)"];
          const contract = new ethers.Contract(tokenConfig.address, erc20Abi, readProvider);
          const bal = await contract.balanceOf(walletAddress);
          setBscBalance(ethers.formatUnits(bal, tokenConfig.decimals));
        }
      } catch (err) {
        console.error("Failed to fetch BSC balance via public RPC:", err);
        setBscBalance("0");
      } finally {
        setLoadingBscBalance(false);
      }
    };

    fetchBscBalance();
  }, [selectedToken?.symbol, selectedToken?.chain, open, senderProfile?.wallet_address]);

  // Search users
  useEffect(() => {
    const searchUsers = async () => {
      if (searchQuery.length < 2) {
        setSearchResults([]);
        setSearching(false);
        return;
      }
      setSearching(true);
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, username, display_name, avatar_url, wallet_address")
          .or(`username.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%`)
          .neq("id", user?.id || "")
          .limit(8);
        if (error) { setSearchResults([]); } else { setSearchResults(data || []); }
      } catch { setSearchResults([]); } finally { setSearching(false); }
    };
    const debounce = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, user?.id]);

  const handleSelectReceiver = (receiver: UserResult) => {
    setSelectedReceiver(receiver);
    setShowSearch(false);
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleSelectToken = (symbol: string) => {
    const token = tokens.find((t) => t.symbol === symbol);
    if (token) setSelectedToken(token);
  };

  const handleAmountChange = (value: string) => {
    if (value === "" || /^\d*\.?\d*$/.test(value)) setAmount(value);
  };

  const handleEmojiSelect = (emoji: string) => {
    setMessage((prev) => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleDonate = async () => {
    if (!selectedReceiver || !selectedToken || !amount || parseFloat(amount) <= 0) return;

    const result = await createDonation({
      receiverId: selectedReceiver.id,
      tokenSymbol: selectedToken.symbol,
      amount: parseFloat(amount),
      message: message || undefined,
      contextType,
      contextId,
      receiverWalletAddress: selectedReceiver.wallet_address || undefined,
      theme: selectedTheme,
      music: selectedMusic,
    });

    if (result.success && result.transaction) {
      setCompletedTransaction(result.transaction);
      setStep(3);
      // onSuccess sẽ được gọi SAU khi user bấm "Lưu & Gửi" trong GiftCelebrationModal
      // Không gọi onSuccess ở đây để tránh auto-post trước khi tuỳ chỉnh card
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setStep(1);
      setCompletedTransaction(null);
      setSelectedReceiver(defaultReceiverId ? selectedReceiver : null);
    }, 200);
  };

  const currentBalance = selectedToken?.chain === "internal" ? getBalanceBySymbol(selectedToken.symbol) : null;
  const isValidAmount = selectedToken?.chain === "internal"
    ? currentBalance !== null && parseFloat(amount || "0") <= currentBalance
    : bscBalance !== null && parseFloat(amount || "0") <= parseFloat(bscBalance);
  // Check connected wallet for BSC status
  const [connectedWalletAddress, setConnectedWalletAddress] = useState<string | null>(null);
  useEffect(() => {
    const checkConnectedWallet = async () => {
      try {
        const { getAccount } = await import("@wagmi/core");
        const { wagmiConfig } = await import("@/lib/web3Config");
        const account = getAccount(wagmiConfig);
        setConnectedWalletAddress(account?.address || null);
      } catch {
        setConnectedWalletAddress(null);
      }
    };
    if (open) checkConnectedWallet();
  }, [open, selectedToken]);

  const isBscNoWallet = selectedToken?.chain === "bsc" && !senderProfile?.wallet_address && !connectedWalletAddress;
  const walletMismatch = connectedWalletAddress && senderProfile?.wallet_address && 
    connectedWalletAddress.toLowerCase() !== senderProfile.wallet_address.toLowerCase();
  const sortedTokens = [...tokens].sort((a, b) => a.priority - b.priority);
  const currentTheme = DONATION_THEMES.find(t => t.id === selectedTheme);
  const canProceedToReview = selectedReceiver && selectedToken && amount && parseFloat(amount) > 0 && isValidAmount;

  const stepTitle = step === 1 ? "🎁 Thưởng & Tặng" : step === 2 ? "📋 Xác nhận giao dịch" : "🎉 Chúc Mừng Tặng Thưởng Thành Công!";

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) handleClose(); }}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">{stepTitle}</DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {/* STEP 3: SUCCESS */}
          {step === 3 && completedTransaction && senderProfile && selectedReceiver && selectedToken ? (
            <GiftCelebrationModal
              key="success"
              transaction={completedTransaction}
              sender={{
                id: senderProfile.id,
                name: senderProfile.display_name || senderProfile.username,
                username: senderProfile.username,
                avatar: senderProfile.avatar_url,
                wallet: senderProfile.wallet_address || null,
              }}
              receiver={{
                id: selectedReceiver.id,
                name: selectedReceiver.display_name || selectedReceiver.username,
                username: selectedReceiver.username,
                avatar: selectedReceiver.avatar_url,
                wallet: selectedReceiver.wallet_address || null,
              }}
              token={{
                symbol: selectedToken.symbol,
                name: selectedToken.name,
                icon_url: selectedToken.icon_url,
                chain: selectedToken.chain,
              }}
              message={message}
              onClose={handleClose}
            />

          ) : step === 2 ? (
            /* STEP 2: REVIEW + THEME + MUSIC */
            <motion.div key="review" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              {/* Sender */}
              <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20">
                <p className="text-xs text-muted-foreground mb-2">Người gửi</p>
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 ring-2 ring-purple-500/30">
                    <AvatarImage src={senderProfile?.avatar_url || ""} />
                    <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">{senderProfile?.username?.[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{senderProfile?.display_name || senderProfile?.username}</p>
                    <p className="text-xs text-muted-foreground">@{senderProfile?.username}</p>
                    {senderProfile?.wallet_address && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <Wallet className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs font-mono text-muted-foreground">{shortenAddress(senderProfile.wallet_address)}</span>
                        <CopyButton text={senderProfile.wallet_address} />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Arrow */}
              <div className="flex justify-center text-2xl">→</div>

              {/* Receiver */}
              <div className="p-3 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
                <p className="text-xs text-muted-foreground mb-2">Người nhận</p>
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 ring-2 ring-amber-500/30">
                    <AvatarImage src={selectedReceiver?.avatar_url || ""} />
                    <AvatarFallback className="bg-gradient-to-br from-amber-500 to-orange-500 text-white">{selectedReceiver?.username?.[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{selectedReceiver?.display_name || selectedReceiver?.username}</p>
                    <p className="text-xs text-muted-foreground">@{selectedReceiver?.username}</p>
                    {selectedReceiver?.wallet_address && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <Wallet className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs font-mono text-muted-foreground">{shortenAddress(selectedReceiver.wallet_address)}</span>
                        <CopyButton text={selectedReceiver.wallet_address} />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Amount + Token */}
              <div className="p-3 rounded-xl border border-border bg-muted/30 text-center">
                <p className="text-xs text-muted-foreground mb-1">Số tiền</p>
                <div className="flex items-center justify-center gap-2 text-2xl font-bold">
                  {selectedToken?.icon_url && <img src={selectedToken.icon_url} alt="" className="h-7 w-7" />}
                  <span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">{amount} {selectedToken?.symbol}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Chain: {selectedToken?.chain === "internal" ? "Nội bộ" : "BSC"}</p>
              </div>

              {/* Message display */}
              {message && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Lời nhắn:</span>
                  <p className="italic mt-1 p-2 bg-muted/50 rounded-lg">"{message}"</p>
                </div>
              )}

              {/* Warning */}
              <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-600 dark:text-amber-400">Giao dịch blockchain không thể hoàn tác. Vui lòng kiểm tra kỹ thông tin.</p>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
                  <ArrowLeft className="h-4 w-4 mr-2" />Quay lại
                </Button>
                <Button
                  className="flex-1 bg-gradient-to-r from-purple-500 via-pink-500 to-amber-500 hover:opacity-90 text-white"
                  onClick={handleDonate}
                  disabled={loading}
                >
                  {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Đang xử lý...</> : "Xác nhận & Tặng →"}
                </Button>
              </div>
            </motion.div>

          ) : (
            /* STEP 1: INPUT FORM — simplified, no theme/music/slider */
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              {/* Sender info */}
              {senderProfile && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20">
                  <Avatar className="h-10 w-10 ring-2 ring-purple-500/30">
                    <AvatarImage src={senderProfile.avatar_url || ""} />
                    <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">{senderProfile.username[0].toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{senderProfile.display_name || senderProfile.username}</p>
                    <p className="text-xs text-muted-foreground">@{senderProfile.username}</p>
                    {senderProfile.wallet_address && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-xs font-mono text-muted-foreground">{shortenAddress(senderProfile.wallet_address)}</span>
                        <CopyButton text={senderProfile.wallet_address} />
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">Người gửi</span>
                </div>
              )}

              {/* Receiver search/display */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Người nhận 💝</label>
                {selectedReceiver && !showSearch ? (
                  <div className="flex items-center gap-3 p-3 rounded-xl border hologram-input">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={selectedReceiver.avatar_url || ""} />
                      <AvatarFallback>{selectedReceiver.username[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{selectedReceiver.display_name || selectedReceiver.username}</p>
                      <p className="text-xs text-muted-foreground">@{selectedReceiver.username}</p>
                      {selectedReceiver.wallet_address && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="text-xs font-mono text-muted-foreground">{shortenAddress(selectedReceiver.wallet_address)}</span>
                          <CopyButton text={selectedReceiver.wallet_address} />
                        </div>
                      )}
                    </div>
                    {!defaultReceiverId && (
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowSearch(true)}>
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Tìm kiếm người nhận..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 hologram-input pointer-events-auto"
                    />
                    {(searchResults.length > 0 || searching) && (
                      <div className="absolute z-[10003] w-full mt-1 bg-white dark:bg-gray-900 border border-cosmic-cyan/30 rounded-xl shadow-lg shadow-cyan-500/10 max-h-48 overflow-y-auto">
                        {searching ? (
                          <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
                        ) : (
                          searchResults.map((result) => (
                            <button key={result.id} type="button" onClick={() => handleSelectReceiver(result)} className="w-full flex items-center gap-3 p-3 hover:bg-accent transition-colors cursor-pointer">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={result.avatar_url || ""} />
                                <AvatarFallback>{result.username[0].toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <div className="text-left">
                                <p className="font-medium text-sm">{result.display_name || result.username}</p>
                                <p className="text-xs text-muted-foreground">@{result.username}</p>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Token selection */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium">Chọn Token 💰</label>
                  {currentBalance !== null && (
                    <span className="text-xs text-muted-foreground">
                      Số dư: <span className={currentBalance === 0 ? "text-destructive" : "text-foreground font-medium"}>{currentBalance} {selectedToken?.symbol}</span>
                    </span>
                  )}
                  {selectedToken?.chain === "bsc" && (
                    <span className="text-xs text-muted-foreground">
                      {loadingBscBalance ? (
                        <span className="flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" />Đang kiểm tra...</span>
                      ) : bscBalance !== null ? (
                        <>Số dư ví: <span className={parseFloat(bscBalance) === 0 ? "text-destructive" : "text-foreground font-medium"}>{parseFloat(bscBalance).toFixed(4)} {selectedToken?.symbol}</span></>
                      ) : isBscNoWallet ? (
                        <span className="text-destructive">Chưa kết nối ví</span>
                      ) : null}
                    </span>
                  )}
                </div>
                <Select value={selectedToken?.symbol} onValueChange={handleSelectToken}>
                  <SelectTrigger className="hologram-input-trigger">
                    <SelectValue placeholder="Chọn token" />
                  </SelectTrigger>
                  <SelectContent className="z-[10003]">
                    {sortedTokens.map((token) => (
                      <SelectItem key={token.id} value={token.symbol}>
                        <div className="flex items-center gap-2">
                          {token.icon_url && <img src={token.icon_url} alt={token.symbol} className="h-5 w-5" />}
                          <span>{token.name}</span>
                          <span className="text-muted-foreground">({token.symbol})</span>
                          {token.chain === "internal" && <span className="text-xs bg-green-500/20 text-green-600 px-1.5 py-0.5 rounded">Nội bộ</span>}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedToken?.chain === "internal" && currentBalance === 0 && (
                  <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs text-amber-600">⚠️ Bạn chưa có {selectedToken.symbol}. Hãy chọn token khác.</div>
                )}
                {selectedToken?.chain === "bsc" && bscBalance !== null && parseFloat(amount || "0") > parseFloat(bscBalance) && (
                  <div className="p-2 bg-destructive/10 border border-destructive/30 rounded-lg text-xs text-destructive flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                    Số dư không đủ. Ví của bạn chỉ có {parseFloat(bscBalance).toFixed(4)} {selectedToken.symbol}
                  </div>
                )}
                {isBscNoWallet && selectedToken?.chain === "bsc" && (
                  <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs text-amber-600 flex items-center gap-1.5">
                    <Wallet className="h-3.5 w-3.5 flex-shrink-0" />
                    Vui lòng kết nối ví BSC để kiểm tra số dư và gửi token.
                  </div>
                )}
                {walletMismatch && selectedToken?.chain === "bsc" && (
                  <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs text-amber-600 flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                    ⚠️ Ví đang kết nối ({shortenAddress(connectedWalletAddress!)}) khác với ví trong hồ sơ ({shortenAddress(senderProfile!.wallet_address!)}). Giao dịch sẽ gửi từ ví đang kết nối.
                  </div>
                )}
              </div>

              {/* Amount input — no slider */}
              <div className="space-y-3">
                <label className="text-sm font-medium">Số tiền 🎁</label>
                <div className="flex gap-2">
                  {quickAmounts.map((qa) => (
                    <Button key={qa} type="button" variant={amount === qa.toString() ? "default" : "outline"} size="sm"
                      className={`flex-1 ${amount === qa.toString() ? "bg-gradient-to-r from-purple-500 to-pink-500" : "hologram-input-trigger"}`}
                      onClick={() => setAmount(qa.toString())}
                      disabled={selectedToken?.chain === "internal" && currentBalance !== null && currentBalance > 0 && qa > currentBalance}
                    >{qa}</Button>
                  ))}
                </div>
                <Input type="text" inputMode="decimal" placeholder="Hoặc nhập số tùy chọn..." value={amount}
                  onChange={(e) => handleAmountChange(e.target.value)} className="text-lg font-bold text-center hologram-input pointer-events-auto" />
                {!isValidAmount && parseFloat(amount || "0") > 0 && (
                  <p className="text-xs text-destructive">
                    Số dư không đủ. Bạn chỉ có {selectedToken?.chain === "internal" ? currentBalance : bscBalance !== null ? parseFloat(bscBalance).toFixed(4) : "?"} {selectedToken?.symbol}
                  </p>
                )}
                {amount && parseFloat(amount) > 0 && selectedToken && (
                  <p className="text-center text-sm font-medium text-primary">Bạn sẽ tặng: {amount} {selectedToken.symbol}</p>
                )}
              </div>

              {/* Message textarea */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Lời nhắn yêu thương 💖</label>
                <div className="relative">
                  <Textarea placeholder="Gửi lời nhắn đến người nhận..." value={message} onChange={(e) => setMessage(e.target.value)}
                    maxLength={200} rows={3} className="hologram-input pr-10 resize-none pointer-events-auto" />
                  <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                    <PopoverTrigger asChild>
                      <Button type="button" variant="ghost" size="icon" className="absolute bottom-2 right-2 h-7 w-7">
                        <Smile className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-2 z-[10003]" align="end">
                      <div className="grid grid-cols-8 gap-1">
                        {EMOJI_LIST.map((emoji) => (
                          <button key={emoji} type="button" onClick={() => handleEmojiSelect(emoji)}
                            className="w-8 h-8 flex items-center justify-center text-lg hover:bg-muted rounded transition-colors">{emoji}</button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
                <p className="text-xs text-muted-foreground text-right">{message.length}/200</p>
              </div>

              {/* Proceed to review */}
              <Button
                className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-purple-500 via-pink-500 to-amber-500 hover:opacity-90 text-white shadow-lg shadow-purple-500/25"
                onClick={() => setStep(2)}
                disabled={!canProceedToReview}
              >
                Xem lại & Xác nhận →
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default EnhancedDonateModal;
