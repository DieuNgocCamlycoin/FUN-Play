import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Wallet, ArrowRight } from "lucide-react";

interface WalletChangeConfirmDialogProps {
  open: boolean;
  oldAddress: string;
  newAddress: string;
  oldWalletType?: string;
  newWalletType?: string;
  isLoading?: boolean;
  onConfirm: () => Promise<void>;
  onCancel: () => Promise<void>;
}

const formatAddress = (addr: string) => {
  if (!addr) return '---';
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
};

const getWalletLabel = (type?: string) => {
  if (!type || type === 'unknown') return 'Ví';
  if (type === 'metamask') return 'MetaMask';
  if (type === 'bitget') return 'Bitget Wallet';
  return type;
};

export const WalletChangeConfirmDialog = ({
  open,
  oldAddress,
  newAddress,
  oldWalletType,
  newWalletType,
  isLoading = false,
  onConfirm,
  onCancel,
}: WalletChangeConfirmDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" hideCloseButton>
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-warning/20">
            <AlertTriangle className="h-7 w-7 text-warning" />
          </div>
          <DialogTitle className="text-xl">Thay Đổi Ví Kết Nối</DialogTitle>
          <DialogDescription className="text-base">
            Bạn đang cố kết nối một ví khác với ví đã đăng ký trước đó.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Old wallet */}
          <div className="flex items-center gap-3 rounded-lg border border-border/50 bg-muted/50 p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              <Wallet className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Ví hiện tại ({getWalletLabel(oldWalletType)})</p>
              <p className="font-mono text-sm font-medium">{formatAddress(oldAddress)}</p>
            </div>
          </div>

          {/* Arrow */}
          <div className="flex justify-center">
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
          </div>

          {/* New wallet */}
          <div className="flex items-center gap-3 rounded-lg border border-primary/50 bg-primary/10 p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
              <Wallet className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-primary/80">Ví mới ({getWalletLabel(newWalletType)})</p>
              <p className="font-mono text-sm font-medium text-primary">{formatAddress(newAddress)}</p>
            </div>
          </div>

          {/* Warning message */}
          <div className="rounded-lg bg-warning/10 p-3 text-center">
            <p className="text-sm text-warning">
              ⚠️ <strong>Lưu ý:</strong> Phần thưởng CAMLY sẽ được gửi đến ví mới nếu bạn cập nhật.
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            Giữ ví cũ
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            {isLoading ? 'Đang xử lý...' : 'Cập nhật ví mới'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
