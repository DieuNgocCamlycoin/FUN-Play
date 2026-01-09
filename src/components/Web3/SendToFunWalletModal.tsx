import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFunWalletSync } from '@/hooks/useFunWalletSync';
import { useWalletConnection } from '@/hooks/useWalletConnection';
import { CAMLY_TOKEN_ADDRESS } from '@/config/tokens';
import { sendTip } from '@/lib/tipping';
import { toast } from 'sonner';
import { Loader2, Send, Wallet, AlertCircle, CheckCircle2, ExternalLink } from 'lucide-react';
import { ethers } from 'ethers';
import camlyLogo from '@/assets/camly-coin-logo.png';

interface SendToFunWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
];

export const SendToFunWalletModal = ({ isOpen, onClose }: SendToFunWalletModalProps) => {
  const { funWalletAddress, isLinked } = useFunWalletSync();
  const { address, isConnected } = useWalletConnection();
  
  const [amount, setAmount] = useState('');
  const [camlyBalance, setCamlyBalance] = useState<string>('0');
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  // Fetch CAMLY balance
  useEffect(() => {
    const fetchBalance = async () => {
      if (!address || !isConnected) {
        setCamlyBalance('0');
        return;
      }

      setIsLoadingBalance(true);
      try {
        const provider = new ethers.BrowserProvider(window.ethereum as any);
        const contract = new ethers.Contract(CAMLY_TOKEN_ADDRESS, ERC20_ABI, provider);
        
        const [balance, decimals] = await Promise.all([
          contract.balanceOf(address),
          contract.decimals()
        ]);
        
        const formatted = ethers.formatUnits(balance, decimals);
        setCamlyBalance(parseFloat(formatted).toFixed(4));
      } catch (error) {
        console.error('Error fetching CAMLY balance:', error);
        setCamlyBalance('0');
      } finally {
        setIsLoadingBalance(false);
      }
    };

    if (isOpen) {
      fetchBalance();
    }
  }, [address, isConnected, isOpen]);

  const handleMax = () => {
    setAmount(camlyBalance);
  };

  const handleSend = async () => {
    if (!funWalletAddress) {
      toast.error('Chưa liên kết FUN Wallet');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Vui lòng nhập số lượng hợp lệ');
      return;
    }

    if (parseFloat(amount) > parseFloat(camlyBalance)) {
      toast.error('Số dư CAMLY không đủ');
      return;
    }

    setIsSending(true);
    setTxHash(null);

    try {
      const result = await sendTip({
        toAddress: funWalletAddress,
        amount: parseFloat(amount),
        tokenSymbol: 'CAMLY',
        tokenAddress: CAMLY_TOKEN_ADDRESS,
        decimals: 18,
        videoId: undefined,
      });

      if (result.success) {
        setTxHash(result.txHash);
        toast.success('Gửi CAMLY thành công!');
        
        // Dispatch event for notifications
        window.dispatchEvent(new CustomEvent('fun-wallet-transaction', {
          detail: {
            amount: amount,
            token: 'CAMLY',
            txHash: result.txHash,
            type: 'sent'
          }
        }));
      }
    } catch (error: any) {
      console.error('Error sending CAMLY:', error);
      toast.error(error.message || 'Gửi CAMLY thất bại');
    } finally {
      setIsSending(false);
    }
  };

  const formatAddress = (addr: string) => `${addr.slice(0, 8)}...${addr.slice(-6)}`;

  if (!isLinked) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              Chưa liên kết FUN Wallet
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-6">
            <p className="text-muted-foreground mb-4">
              Bạn cần liên kết FUN Wallet trước khi có thể gửi CAMLY.
            </p>
            <Button onClick={onClose}>Đóng</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <img src={camlyLogo} alt="CAMLY" className="h-6 w-6" />
            Gửi CAMLY đến FUN Wallet
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Recipient */}
          <div className="space-y-2">
            <Label className="text-muted-foreground">Địa chỉ nhận (FUN Wallet)</Label>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border">
              <Wallet className="h-4 w-4 text-yellow-500" />
              <span className="font-mono text-sm flex-1">
                {formatAddress(funWalletAddress!)}
              </span>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </div>
          </div>

          {/* Balance */}
          <div className="space-y-2">
            <Label className="text-muted-foreground">Số dư CAMLY của bạn</Label>
            <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
              <div className="flex items-center gap-2">
                <img src={camlyLogo} alt="CAMLY" className="h-5 w-5" />
                <span className="font-bold">
                  {isLoadingBalance ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    `${parseFloat(camlyBalance).toLocaleString()} CAMLY`
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Amount input */}
          <div className="space-y-2">
            <Label>Số lượng gửi</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={isSending}
                className="flex-1"
              />
              <Button 
                variant="outline" 
                onClick={handleMax}
                disabled={isSending || isLoadingBalance}
              >
                MAX
              </Button>
            </div>
          </div>

          {/* Gas fee estimate */}
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Phí gas ước tính: ~0.0005 BNB
          </div>

          {/* Success message with tx hash */}
          {txHash && (
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-600">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4" />
                <span>Giao dịch thành công!</span>
              </div>
              <a
                href={`https://bscscan.com/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs flex items-center gap-1 mt-1 hover:underline"
              >
                Xem trên BscScan <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Đóng
          </Button>
          <Button 
            onClick={handleSend} 
            disabled={isSending || !amount || parseFloat(amount) <= 0}
            className="flex-1 gap-2"
          >
            {isSending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang gửi...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Gửi CAMLY
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
