import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Gift } from "lucide-react";
import { sendDonation } from "@/lib/donation";
import { supabase } from "@/integrations/supabase/client";
import { SUPPORTED_TOKENS } from "@/config/tokens";

interface DonateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  creatorAddress?: string;
  videoId?: string;
  creatorName: string;
  channelUserId?: string;
}

export const DonateModal = ({ open, onOpenChange, creatorAddress, videoId, creatorName, channelUserId }: DonateModalProps) => {
  const [selectedToken, setSelectedToken] = useState("BNB");
  const [amount, setAmount] = useState("");
  const [manualAddress, setManualAddress] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open && channelUserId) {
      fetchCreatorWallet();
    }
  }, [open, channelUserId]);

  const fetchCreatorWallet = async () => {
    if (!channelUserId) return;
    
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("wallet_address")
        .eq("id", channelUserId)
        .maybeSingle();

      if (error) throw error;
      if (data?.wallet_address) {
        setWalletAddress(data.wallet_address);
      }
    } catch (error: any) {
      console.error("Error fetching wallet:", error);
    }
  };

  const handleDonate = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Số tiền không hợp lệ",
        description: "Vui lòng nhập số tiền hợp lệ",
        variant: "destructive",
      });
      return;
    }

    const targetAddress = manualAddress || walletAddress || creatorAddress;
    
    if (!targetAddress) {
      toast({
        title: "Chưa có địa chỉ ví",
        description: "Vui lòng nhập địa chỉ ví người nhận",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const token = SUPPORTED_TOKENS.find(t => t.symbol === selectedToken);
      if (!token) throw new Error("Token not found");

      const result = await sendDonation({
        toAddress: targetAddress,
        amount: parseFloat(amount),
        tokenSymbol: token.symbol,
        tokenAddress: token.address,
        decimals: token.decimals,
        videoId,
      });

      toast({
        title: "Tặng thành công! 🎉",
        description: `Đã tặng ${amount} ${selectedToken} ${manualAddress ? "đến địa chỉ ví" : `cho ${creatorName}`}`,
      });

      onOpenChange(false);
      setAmount("");
      setManualAddress("");
    } catch (error: any) {
      toast({
        title: "Tặng thất bại",
        description: error.message || "Không thể hoàn tất giao dịch",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-cosmic-gold" />
            {manualAddress ? "Chuyển tiền thủ công" : `Tặng cho ${creatorName}`}
          </DialogTitle>
          <DialogDescription>
            {manualAddress ? "Gửi cryptocurrency đến bất kỳ địa chỉ ví nào" : "Thưởng & Tặng cho creator yêu thích"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="token">Token</Label>
            <Select value={selectedToken} onValueChange={setSelectedToken}>
              <SelectTrigger id="token">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
              {SUPPORTED_TOKENS.map((token) => (
                  <SelectItem key={token.symbol} value={token.symbol}>
                    {token.symbol}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Số tiền</Label>
            <Input
              id="amount"
              type="number"
              step="0.0001"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="manualAddress">Địa chỉ ví nhận (Tùy chọn)</Label>
            <Input
              id="manualAddress"
              type="text"
              placeholder="0x... (Để trống sẽ gửi cho creator)"
              value={manualAddress}
              onChange={(e) => setManualAddress(e.target.value)}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Dán địa chỉ ví BSC của bất kỳ user nào để chuyển tiền trực tiếp
            </p>
          </div>

          {!manualAddress && walletAddress && (
            <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
              Gửi đến: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
            </div>
          )}
          
          {manualAddress && (
            <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
              Gửi đến: {manualAddress.slice(0, 6)}...{manualAddress.slice(-4)}
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              setManualAddress("");
            }}
            className="flex-1"
            disabled={loading}
          >
            Hủy
          </Button>
          <Button
            onClick={handleDonate}
            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang gửi...
              </>
            ) : (
              <>
                <Gift className="mr-2 h-4 w-4" />
                Tặng ngay
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
