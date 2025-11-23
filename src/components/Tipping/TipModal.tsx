import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Coins } from "lucide-react";
import { sendTip } from "@/lib/tipping";

interface TipModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  creatorAddress?: string;
  videoId?: string;
  creatorName: string;
}

const TOKENS = [
  { symbol: "BNB", address: "native", decimals: 18 },
  { symbol: "USDT", address: "0x55d398326f99059fF775485246999027B3197955", decimals: 18 },
  { symbol: "CAMLY", address: "0x", decimals: 18 }, // Replace with actual address
  { symbol: "BTC", address: "0x", decimals: 18 }, // Replace with actual BTCB address
];

export const TipModal = ({ open, onOpenChange, creatorAddress, videoId, creatorName }: TipModalProps) => {
  const [selectedToken, setSelectedToken] = useState("BNB");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleTip = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    if (!creatorAddress) {
      toast({
        title: "Creator Address Not Set",
        description: "This creator hasn't set up their wallet address yet",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const token = TOKENS.find(t => t.symbol === selectedToken);
      if (!token) throw new Error("Token not found");

      const result = await sendTip({
        toAddress: creatorAddress,
        amount: parseFloat(amount),
        tokenSymbol: token.symbol,
        tokenAddress: token.address,
        decimals: token.decimals,
        videoId,
      });

      toast({
        title: "Tip Sent Successfully! 🎉",
        description: `${amount} ${selectedToken} sent to ${creatorName}`,
      });

      onOpenChange(false);
      setAmount("");
    } catch (error: any) {
      toast({
        title: "Tip Failed",
        description: error.message || "Failed to send tip",
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
            <Coins className="h-5 w-5 text-fun-yellow" />
            Tip {creatorName}
          </DialogTitle>
          <DialogDescription>
            Send cryptocurrency to support this creator
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
                {TOKENS.map((token) => (
                  <SelectItem key={token.symbol} value={token.symbol}>
                    {token.symbol}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              step="0.0001"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          {creatorAddress && (
            <div className="text-xs text-muted-foreground">
              To: {creatorAddress.slice(0, 6)}...{creatorAddress.slice(-4)}
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleTip}
            className="flex-1 bg-fun-yellow text-primary-foreground hover:bg-fun-yellow/90"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Coins className="mr-2 h-4 w-4" />
                Send Tip
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
