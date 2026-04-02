import { useWalletContext } from '@/contexts/WalletContext';
import { AttesterPanel } from '@/components/Multisig/AttesterPanel';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldAlert, Wallet, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function GovSignPage() {
  const { isConnected } = useWalletContext();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold">GOV Attester — Ký Multisig</h1>
            <p className="text-sm text-muted-foreground">
              Kết nối ví GOV để xem và ký các yêu cầu mint FUN Money
            </p>
          </div>
        </div>

        {/* Guide */}
        <Card className="p-4 bg-muted/50 border-dashed">
          <h3 className="font-semibold text-sm mb-2">📋 Hướng dẫn nhanh</h3>
          <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
            <li>Kết nối ví đã được đăng ký trong danh sách GOV Attester</li>
            <li>Xem danh sách yêu cầu mint đang chờ ký</li>
            <li>Nhấn <strong>"Ký xác nhận"</strong> để ký bằng EIP-712</li>
            <li>Cần đủ 3/3 nhóm (WILL + WISDOM + LOVE) mới submit on-chain</li>
          </ol>
        </Card>

        {!isConnected ? (
          <Card className="p-8 text-center space-y-3">
            <Wallet className="w-12 h-12 mx-auto text-muted-foreground" />
            <h3 className="font-semibold text-lg">Chưa kết nối ví</h3>
            <p className="text-muted-foreground text-sm">
              Vui lòng kết nối ví MetaMask hoặc WalletConnect để tiếp tục.
            </p>
            <w3m-button />
          </Card>
        ) : (
          <AttesterPanel />
        )}
      </div>
    </div>
  );
}
