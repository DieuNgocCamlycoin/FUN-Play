import { useState, useEffect } from "react";
import { Gift, Search, ArrowRight, Loader2, CheckCircle2, ExternalLink, Copy, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useDonation, DonationTransaction, DonationToken } from "@/hooks/useDonation";
import { useInternalWallet } from "@/hooks/useInternalWallet";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";

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

type Step = "receiver" | "token" | "amount" | "message" | "success";

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
  const { balances, getBalanceBySymbol } = useInternalWallet();

  const [step, setStep] = useState<Step>(defaultReceiverId ? "token" : "receiver");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserResult[]>([]);
  const [searching, setSearching] = useState(false);

  const [selectedReceiver, setSelectedReceiver] = useState<UserResult | null>(
    defaultReceiverId
      ? {
          id: defaultReceiverId,
          username: defaultReceiverName || "",
          display_name: defaultReceiverName || null,
          avatar_url: defaultReceiverAvatar || null,
          wallet_address: defaultReceiverWallet || null,
        }
      : null
  );
  const [selectedToken, setSelectedToken] = useState<DonationToken | null>(null);
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [completedTransaction, setCompletedTransaction] = useState<DonationTransaction | null>(null);

  useEffect(() => {
    if (open) {
      fetchTokens().then((fetchedTokens) => {
        if (fetchedTokens && fetchedTokens.length > 0) {
          setSelectedToken(fetchedTokens[0]);
        }
      });
      // Reset state
      if (!defaultReceiverId) {
        setStep("receiver");
        setSelectedReceiver(null);
      } else {
        setStep("token");
      }
      setAmount("");
      setMessage("");
      setCompletedTransaction(null);
    }
  }, [open]);

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
        .limit(10);

      setSearchResults(data || []);
      setSearching(false);
    };

    const debounce = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, user?.id]);

  const handleSelectReceiver = (receiver: UserResult) => {
    setSelectedReceiver(receiver);
    setStep("token");
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleSelectToken = (symbol: string) => {
    const token = tokens.find((t) => t.symbol === symbol);
    if (token) {
      setSelectedToken(token);
    }
  };

  const quickAmounts = [10, 50, 100, 500];

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
      setStep("success");

      // Trigger confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#FFD700", "#FFA500", "#FF6B6B", "#4ECDC4"],
      });

      onSuccess?.(result.transaction);
    }
  };

  const handleCopyReceipt = () => {
    if (completedTransaction) {
      const url = `${window.location.origin}/receipt/${completedTransaction.receipt_public_id}`;
      navigator.clipboard.writeText(url);
      toast({ title: "Đã copy link biên nhận!" });
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset after close animation
    setTimeout(() => {
      setStep(defaultReceiverId ? "token" : "receiver");
      setCompletedTransaction(null);
    }, 200);
  };

  const currentBalance = selectedToken?.chain === "internal" 
    ? getBalanceBySymbol(selectedToken.symbol)
    : null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-amber-500" />
            {step === "success" ? "Tặng Thành Công! 🎉" : "Thưởng & Tặng"}
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {/* Step 1: Select Receiver */}
          {step === "receiver" && (
            <motion.div
              key="receiver"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm người nhận..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {searching && (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              )}

              {searchResults.length > 0 && (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {searchResults.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleSelectReceiver(user)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.avatar_url || ""} />
                        <AvatarFallback>{user.username[0].toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="text-left">
                        <p className="font-medium">{user.display_name || user.username}</p>
                        <p className="text-sm text-muted-foreground">@{user.username}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 ml-auto text-muted-foreground" />
                    </button>
                  ))}
                </div>
              )}

              {searchQuery.length >= 2 && searchResults.length === 0 && !searching && (
                <p className="text-center text-muted-foreground py-4">
                  Không tìm thấy người dùng
                </p>
              )}
            </motion.div>
          )}

          {/* Step 2: Select Token */}
          {step === "token" && selectedReceiver && (
            <motion.div
              key="token"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-3 p-3 bg-accent/50 rounded-lg">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedReceiver.avatar_url || ""} />
                  <AvatarFallback>{selectedReceiver.username[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{selectedReceiver.display_name || selectedReceiver.username}</p>
                  <p className="text-sm text-muted-foreground">@{selectedReceiver.username}</p>
                </div>
                {!defaultReceiverId && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="ml-auto"
                    onClick={() => setStep("receiver")}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <Select value={selectedToken?.symbol} onValueChange={handleSelectToken}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn token" />
                </SelectTrigger>
                <SelectContent>
                  {tokens.map((token) => (
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

              {selectedToken && (
                <Button className="w-full" onClick={() => setStep("amount")}>
                  Tiếp tục
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </motion.div>
          )}

          {/* Step 3: Enter Amount */}
          {step === "amount" && selectedToken && (
            <motion.div
              key="amount"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <img src={selectedToken.icon_url || ""} alt="" className="h-5 w-5" />
                <span>{selectedToken.name}</span>
                {currentBalance !== null && (
                  <span className={`ml-auto ${currentBalance === 0 ? "text-destructive" : ""}`}>
                    Số dư: {currentBalance} {selectedToken.symbol}
                  </span>
                )}
              </div>

              {/* Warning if internal token has no balance */}
              {selectedToken.chain === "internal" && currentBalance === 0 && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-sm text-amber-600">
                  ⚠️ Bạn chưa có {selectedToken.symbol}. Hãy chọn token khác hoặc kiếm {selectedToken.symbol} trước.
                </div>
              )}

              <Input
                type="number"
                placeholder="Nhập số tiền"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="text-2xl font-bold text-center h-16"
              />

              <div className="flex gap-2">
                {quickAmounts.map((qa) => (
                  <Button
                    key={qa}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setAmount(qa.toString())}
                    disabled={selectedToken.chain === "internal" && currentBalance !== null && qa > currentBalance}
                  >
                    {qa}
                  </Button>
                ))}
              </div>

              {/* Validation error for insufficient balance */}
              {selectedToken.chain === "internal" && 
               currentBalance !== null && 
               parseFloat(amount) > currentBalance && (
                <p className="text-sm text-destructive">
                  Số dư không đủ. Bạn chỉ có {currentBalance} {selectedToken.symbol}
                </p>
              )}

              <Button
                className="w-full"
                onClick={() => setStep("message")}
                disabled={
                  !amount || 
                  parseFloat(amount) <= 0 ||
                  (selectedToken.chain === "internal" && currentBalance !== null && parseFloat(amount) > currentBalance)
                }
              >
                Tiếp tục
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </motion.div>
          )}

          {/* Step 4: Message & Confirm */}
          {step === "message" && (
            <motion.div
              key="message"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              <div className="p-4 bg-accent/50 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Người nhận</span>
                  <span className="font-medium">@{selectedReceiver?.username}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Số tiền</span>
                  <span className="font-medium">{amount} {selectedToken?.symbol}</span>
                </div>
              </div>

              <Textarea
                placeholder="Lời nhắn (tùy chọn)"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={200}
                rows={3}
              />
              <p className="text-xs text-muted-foreground text-right">{message.length}/200</p>

              <Button
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                onClick={handleDonate}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Gift className="h-4 w-4 mr-2" />
                )}
                Tặng ngay
              </Button>
            </motion.div>
          )}

          {/* Step 5: Success */}
          {step === "success" && completedTransaction && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-4 text-center"
            >
              <div className="flex justify-center">
                <div className="h-16 w-16 rounded-full bg-green-500/20 flex items-center justify-center">
                  <CheckCircle2 className="h-10 w-10 text-green-500" />
                </div>
              </div>

              <div>
                <p className="text-lg font-semibold">Tặng thành công!</p>
                <p className="text-muted-foreground">
                  Bạn đã tặng {completedTransaction.amount} {selectedToken?.symbol} cho @{selectedReceiver?.username}
                </p>
              </div>

              <div className="p-4 bg-accent/50 rounded-lg text-left space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Mã biên nhận</span>
                  <span className="font-mono">#{completedTransaction.receipt_public_id}</span>
                </div>
                {completedTransaction.tx_hash && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">TX Hash</span>
                    <a
                      href={completedTransaction.explorer_url || `https://bscscan.com/tx/${completedTransaction.tx_hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary flex items-center gap-1"
                    >
                      {completedTransaction.tx_hash.substring(0, 10)}...
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={handleCopyReceipt}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Link
                </Button>
                <Button className="flex-1" onClick={handleClose}>
                  Đóng
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};
