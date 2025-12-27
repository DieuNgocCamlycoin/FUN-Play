import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Wallet, CheckCircle2, XCircle, RefreshCw, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

export type ConnectionStep = 
  | 'idle'
  | 'initializing'
  | 'opening-modal'
  | 'waiting-approval'
  | 'switching-chain'
  | 'connected'
  | 'error';

interface WalletConnectionProgressProps {
  step: ConnectionStep;
  progress: number;
  error?: string;
  onRetry?: () => void;
  onCancel?: () => void;
  className?: string;
}

const stepLabels: Record<ConnectionStep, string> = {
  'idle': 'Sẵn sàng kết nối',
  'initializing': 'Đang khởi tạo...',
  'opening-modal': 'Đang mở ví...',
  'waiting-approval': 'Chờ xác nhận từ ví...',
  'switching-chain': 'Đang chuyển sang BSC...',
  'connected': 'Đã kết nối thành công!',
  'error': 'Kết nối thất bại',
};

const stepIcons: Record<ConnectionStep, React.ReactNode> = {
  'idle': <Wallet className="h-5 w-5" />,
  'initializing': <Loader2 className="h-5 w-5 animate-spin" />,
  'opening-modal': <Smartphone className="h-5 w-5 animate-pulse" />,
  'waiting-approval': <Loader2 className="h-5 w-5 animate-spin" />,
  'switching-chain': <RefreshCw className="h-5 w-5 animate-spin" />,
  'connected': <CheckCircle2 className="h-5 w-5 text-green-500" />,
  'error': <XCircle className="h-5 w-5 text-red-500" />,
};

export const WalletConnectionProgress = ({
  step,
  progress,
  error,
  onRetry,
  onCancel,
  className = '',
}: WalletConnectionProgressProps) => {
  const isActive = step !== 'idle' && step !== 'connected' && step !== 'error';
  const isError = step === 'error';
  const isSuccess = step === 'connected';

  if (step === 'idle') return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={`rounded-lg border p-4 ${
          isError 
            ? 'border-red-500/50 bg-red-500/10' 
            : isSuccess 
              ? 'border-green-500/50 bg-green-500/10'
              : 'border-primary/50 bg-primary/5'
        } ${className}`}
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-3">
          <motion.div
            animate={isActive ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 1, repeat: isActive ? Infinity : 0 }}
          >
            {stepIcons[step]}
          </motion.div>
          <span className="font-medium">{stepLabels[step]}</span>
        </div>

        {/* Progress Bar */}
        {isActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-3"
          >
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1 text-center">
              {progress}%
            </p>
          </motion.div>
        )}

        {/* Error Message */}
        {isError && error && (
          <p className="text-sm text-red-400 mb-3">{error}</p>
        )}

        {/* Mobile Hint */}
        {step === 'waiting-approval' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2 }}
            className="text-xs text-muted-foreground mb-3 flex items-center gap-2"
          >
            <Smartphone className="h-3 w-3" />
            Kiểm tra ứng dụng ví trên điện thoại của bạn
          </motion.div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          {isError && onRetry && (
            <Button
              size="sm"
              onClick={onRetry}
              className="flex-1 gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Thử lại
            </Button>
          )}
          {(isActive || isError) && onCancel && (
            <Button
              size="sm"
              variant="outline"
              onClick={onCancel}
              className="flex-1"
            >
              Hủy
            </Button>
          )}
          {isSuccess && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-2 text-green-500 text-sm"
            >
              <CheckCircle2 className="h-4 w-4" />
              Sẵn sàng claim CAMLY!
            </motion.div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
