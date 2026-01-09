import { useFunWalletSync } from '@/hooks/useFunWalletSync';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FunWalletMiniWidgetProps {
  compact?: boolean;
  className?: string;
}

export const FunWalletMiniWidget = ({ compact, className }: FunWalletMiniWidgetProps) => {
  const navigate = useNavigate();
  const { isLinked, funWalletAddress, balance, isLoading } = useFunWalletSync();
  
  const formatAddress = (addr: string) => `${addr.slice(0, 4)}...${addr.slice(-4)}`;
  
  return (
    <button
      onClick={() => navigate('/fun-wallet')}
      className={cn(
        "flex items-center gap-1.5 px-2 py-1 rounded-full",
        "bg-gradient-to-r from-yellow-500/10 via-orange-500/10 to-yellow-600/10",
        "hover:from-yellow-500/20 hover:via-orange-500/20 hover:to-yellow-600/20",
        "border border-yellow-500/20 transition-all duration-200",
        "hover:shadow-[0_0_10px_rgba(234,179,8,0.3)]",
        className
      )}
    >
      <img 
        src="/images/fun-wallet-logo.png" 
        alt="FUN" 
        className={cn("rounded-full shadow-sm", compact ? "h-4 w-4" : "h-5 w-5")}
      />
      
      {!compact && (
        <div className="flex items-center">
          {isLoading ? (
            <Loader2 className="h-3 w-3 animate-spin text-yellow-500" />
          ) : isLinked ? (
            <span className="text-xs font-medium text-yellow-500">
              {balance ? `${balance} FUN` : formatAddress(funWalletAddress!)}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">Kết nối</span>
          )}
        </div>
      )}
    </button>
  );
};
