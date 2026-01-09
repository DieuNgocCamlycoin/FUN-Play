import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Check, Loader2, Unlink } from 'lucide-react';
import { useFunWalletSync, FUN_WALLET_URL } from '@/hooks/useFunWalletSync';
import { useAuth } from '@/hooks/useAuth';

interface FunWalletConnectorProps {
  onConnected?: (address: string) => void;
  compact?: boolean;
}

export const FunWalletConnector: React.FC<FunWalletConnectorProps> = ({ 
  onConnected,
  compact = false 
}) => {
  const { user } = useAuth();
  const { 
    isLinked, 
    funWalletAddress, 
    isLoading, 
    openFunWallet,
    unlinkFunWallet 
  } = useFunWalletSync();

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/30">
        <CardContent className={compact ? "p-3" : "p-4"}>
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Đang kiểm tra...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLinked && funWalletAddress) {
    return (
      <Card className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30">
        <CardContent className={compact ? "p-3" : "p-4"}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
              <Check className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">FUN Wallet</span>
                <Badge variant="outline" className="text-xs bg-green-500/20 text-green-400 border-green-500/30">
                  Đã liên kết
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground font-mono truncate">
                {formatAddress(funWalletAddress)}
              </p>
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open(FUN_WALLET_URL, '_blank')}
                className="h-8 w-8 p-0"
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={unlinkFunWallet}
                className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
              >
                <Unlink className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/30">
        <CardContent className={compact ? "p-3" : "p-4"}>
          <div className="text-center text-sm text-muted-foreground">
            Đăng nhập để liên kết FUN Wallet
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/30 hover:border-yellow-500/50 transition-colors">
      <CardContent className={compact ? "p-3" : "p-4"}>
        {!compact && (
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 flex items-center justify-center text-2xl shadow-lg">
              🎮
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-bold">FUN Wallet</h3>
                <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 text-xs">
                  Khuyên dùng
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Ví chính thức của FUN Ecosystem
              </p>
            </div>
          </div>
        )}
        
        <Button 
          onClick={openFunWallet}
          className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-medium"
        >
          {compact ? (
            <>
              <span className="mr-2">🎮</span>
              Liên kết FUN Wallet
            </>
          ) : (
            <>
              <ExternalLink className="w-4 h-4 mr-2" />
              Mở FUN Wallet để liên kết
            </>
          )}
        </Button>

        {!compact && (
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Kết nối ví trên FUN Wallet và quay lại để đồng bộ tự động
          </p>
        )}
      </CardContent>
    </Card>
  );
};
