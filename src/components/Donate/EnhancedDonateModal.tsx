import { useState, useEffect } from "react";
import { Gift, Search, Loader2, X, Smile } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useDonation, DonationTransaction, DonationToken } from "@/hooks/useDonation";
import { useInternalWallet } from "@/hooks/useInternalWallet";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { DonationSuccessOverlay } from "./DonationSuccessOverlay";

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
}

// Emoji categories for quick picker
const EMOJI_LIST = ["💖", "❤️", "🥰", "😍", "🙏", "🔥", "💯", "⭐", "🌟", "✨", "🎉", "🎁", "💪", "👏", "🤝", "💕"];

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

  // Form state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  const [selectedReceiver, setSelectedReceiver] = useState<UserResult | null>(null);
  const [selectedToken, setSelectedToken] = useState<DonationToken | null>(null);
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");

  // Success state
  const [showSuccess, setShowSuccess] = useState(false);
  const [completedTransaction, setCompletedTransaction] = useState<DonationTransaction | null>(null);

  // Sender profile
  const [senderProfile, setSenderProfile] = useState<SenderProfile | null>(null);

  // Emoji picker
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const quickAmounts = [10, 50, 100, 500];

  // Fetch sender profile
  useEffect(() => {
    const fetchSender = async () => {
      if (!user?.id) return;
      const { data } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url")
        .eq("id", user.id)
        .single();
      if (data) setSenderProfile(data);
    };
    if (open && user) fetchSender();
  }, [open, user]);

  // Initialize on open
  useEffect(() => {
    if (open) {
      fetchTokens().then((fetchedTokens) => {
        if (fetchedTokens && fetchedTokens.length > 0) {
          // Sort by priority (FUN MONEY first)
          const sorted = [...fetchedTokens].sort((a, b) => a.priority - b.priority);
          setSelectedToken(sorted[0]);
        }
      });

      // Set default receiver if provided
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

      // Reset form
      setAmount("");
      setMessage("");
      setShowSuccess(false);
      setCompletedTransaction(null);
    }
  }, [open, defaultReceiverId, defaultReceiverName, defaultReceiverAvatar, defaultReceiverWallet, fetchTokens]);

  // Search users
  useEffect(() => {
    const searchUsers = async () => {
      if (searchQuery.length < 2) {
        setSearchResults([]);
        return;
      }

      setSearching(true);
      const { data } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url, wallet_address")
        .or(`username.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%`)
        .neq("id", user?.id || "")
        .limit(8);

      setSearchResults(data || []);
      setSearching(false);
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
    // Allow empty or valid numbers
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
    }
  };

  const handleSliderChange = (values: number[]) => {
    setAmount(values[0].toString());
  };

  const handleEmojiSelect = (emoji: string) => {
    setMessage((prev) => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleDonate = async () => {
    if (!selectedReceiver || !selectedToken || !amount || parseFloat(amount) <= 0) {
      toast({
        title: "Thông tin không hợp lệ",
        description: "Vui lòng điền đầy đủ thông tin",
        variant: "destructive",
      });
      return;
    }

    const result = await createDonation({
      receiverId: selectedReceiver.id,
      tokenSymbol: selectedToken.symbol,
      amount: parseFloat(amount),
      message: message || undefined,
      contextType,
      contextId,
      receiverWalletAddress: selectedReceiver.wallet_address || undefined,
    });

    if (result.success && result.transaction) {
      setCompletedTransaction(result.transaction);
      setShowSuccess(true);
      onSuccess?.(result.transaction);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset after close animation
    setTimeout(() => {
      setShowSuccess(false);
      setCompletedTransaction(null);
      setSelectedReceiver(defaultReceiverId ? selectedReceiver : null);
    }, 200);
  };

  const currentBalance =
    selectedToken?.chain === "internal" ? getBalanceBySymbol(selectedToken.symbol) : null;

  const maxAmount = currentBalance !== null ? currentBalance : 10000;
  const isValidAmount =
    selectedToken?.chain === "internal"
      ? currentBalance !== null && parseFloat(amount || "0") <= currentBalance
      : true;

  // Sort tokens by priority
  const sortedTokens = [...tokens].sort((a, b) => a.priority - b.priority);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Gift className="h-5 w-5 text-amber-500" />
            {showSuccess ? "🎉 Tặng Thành Công!" : "🎁 Thưởng & Tặng"}
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {showSuccess && completedTransaction && senderProfile && selectedReceiver && selectedToken ? (
            <DonationSuccessOverlay
              key="success"
              transaction={completedTransaction}
              sender={{
                id: senderProfile.id,
                name: senderProfile.display_name || senderProfile.username,
                username: senderProfile.username,
                avatar: senderProfile.avatar_url,
              }}
              receiver={{
                id: selectedReceiver.id,
                name: selectedReceiver.display_name || selectedReceiver.username,
                username: selectedReceiver.username,
                avatar: selectedReceiver.avatar_url,
              }}
              token={{
                symbol: selectedToken.symbol,
                name: selectedToken.name,
                icon_url: selectedToken.icon_url,
              }}
              message={message}
              onClose={handleClose}
            />
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-5"
            >
              {/* Sender info (fixed) */}
              {senderProfile && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20">
                  <Avatar className="h-10 w-10 ring-2 ring-purple-500/30">
                    <AvatarImage src={senderProfile.avatar_url || ""} />
                    <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                      {senderProfile.username[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium text-sm">
                      {senderProfile.display_name || senderProfile.username}
                    </p>
                    <p className="text-xs text-muted-foreground">Người gửi</p>
                  </div>
                </div>
              )}

              {/* Receiver search/display */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Người nhận 💝</label>

                {selectedReceiver && !showSearch ? (
                  <div className="flex items-center gap-3 p-3 rounded-xl border hologram-input">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={selectedReceiver.avatar_url || ""} />
                      <AvatarFallback>
                        {selectedReceiver.username[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium text-sm">
                        {selectedReceiver.display_name || selectedReceiver.username}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        @{selectedReceiver.username}
                      </p>
                    </div>
                    {!defaultReceiverId && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setShowSearch(true)}
                      >
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
                      className="pl-9 hologram-input"
                    />

                    {/* Search results dropdown */}
                    {(searchResults.length > 0 || searching) && (
                      <div className="absolute z-50 w-full mt-1 bg-background border rounded-xl shadow-lg max-h-48 overflow-y-auto">
                        {searching ? (
                          <div className="flex justify-center py-4">
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                          </div>
                        ) : (
                          searchResults.map((result) => (
                            <button
                              key={result.id}
                              onClick={() => handleSelectReceiver(result)}
                              className="w-full flex items-center gap-3 p-3 hover:bg-accent transition-colors"
                            >
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={result.avatar_url || ""} />
                                <AvatarFallback>
                                  {result.username[0].toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="text-left">
                                <p className="font-medium text-sm">
                                  {result.display_name || result.username}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  @{result.username}
                                </p>
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
                      Số dư:{" "}
                      <span className={currentBalance === 0 ? "text-destructive" : "text-foreground font-medium"}>
                        {currentBalance} {selectedToken?.symbol}
                      </span>
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
                          {token.icon_url && (
                            <img src={token.icon_url} alt={token.symbol} className="h-5 w-5" />
                          )}
                          <span>{token.name}</span>
                          <span className="text-muted-foreground">({token.symbol})</span>
                          {token.chain === "internal" && (
                            <span className="text-xs bg-green-500/20 text-green-600 px-1.5 py-0.5 rounded">
                              Nội bộ
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Zero balance warning */}
                {selectedToken?.chain === "internal" && currentBalance === 0 && (
                  <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs text-amber-600">
                    ⚠️ Bạn chưa có {selectedToken.symbol}. Hãy chọn token khác.
                  </div>
                )}
              </div>

              {/* Amount input */}
              <div className="space-y-3">
                <label className="text-sm font-medium">Số tiền 🎁</label>

                {/* Quick amount buttons */}
                <div className="flex gap-2">
                  {quickAmounts.map((qa) => (
                    <Button
                      key={qa}
                      variant={amount === qa.toString() ? "default" : "outline"}
                      size="sm"
                      className={`flex-1 ${amount === qa.toString() ? "bg-gradient-to-r from-purple-500 to-pink-500" : "hologram-input-trigger"}`}
                      onClick={() => setAmount(qa.toString())}
                      disabled={currentBalance !== null && qa > currentBalance}
                    >
                      {qa}
                    </Button>
                  ))}
                </div>

                {/* Custom amount input */}
                <Input
                  type="text"
                  inputMode="decimal"
                  placeholder="Hoặc nhập số tùy chọn..."
                  value={amount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  className="text-lg font-bold text-center hologram-input"
                />

                {/* Slider */}
                {maxAmount > 0 && (
                  <Slider
                    min={1}
                    max={Math.min(maxAmount, 10000)}
                    step={1}
                    value={[parseFloat(amount) || 0]}
                    onValueChange={handleSliderChange}
                    className="mt-2"
                  />
                )}

                {/* Validation error */}
                {!isValidAmount && parseFloat(amount || "0") > 0 && (
                  <p className="text-xs text-destructive">
                    Số dư không đủ. Bạn chỉ có {currentBalance} {selectedToken?.symbol}
                  </p>
                )}
              </div>

              {/* Message textarea */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Lời nhắn yêu thương 💖</label>
                <div className="relative">
                  <Textarea
                    placeholder="Gửi lời nhắn đến người nhận..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    maxLength={200}
                    rows={3}
                    className="hologram-input pr-10 resize-none"
                  />

                  {/* Emoji picker button */}
                  <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute bottom-2 right-2 h-7 w-7"
                      >
                        <Smile className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-2 z-[10003]" align="end">
                      <div className="grid grid-cols-8 gap-1">
                        {EMOJI_LIST.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => handleEmojiSelect(emoji)}
                            className="w-8 h-8 flex items-center justify-center text-lg hover:bg-muted rounded transition-colors"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
                <p className="text-xs text-muted-foreground text-right">{message.length}/200</p>
              </div>

              {/* Submit button */}
              <Button
                className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-purple-500 via-pink-500 to-amber-500 hover:opacity-90 text-white shadow-lg shadow-purple-500/25"
                onClick={handleDonate}
                disabled={
                  loading ||
                  !selectedReceiver ||
                  !selectedToken ||
                  !amount ||
                  parseFloat(amount) <= 0 ||
                  !isValidAmount
                }
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                ) : (
                  <Gift className="h-5 w-5 mr-2" />
                )}
                {loading ? "Đang xử lý..." : `Tặng ${amount || "0"} ${selectedToken?.symbol || ""} →`}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default EnhancedDonateModal;
