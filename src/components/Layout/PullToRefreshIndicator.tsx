import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, ArrowDown } from 'lucide-react';

interface PullToRefreshIndicatorProps {
  isPulling: boolean;
  isRefreshing: boolean;
  pullProgress: number;
  pullDistance: number;
}

export const PullToRefreshIndicator: React.FC<PullToRefreshIndicatorProps> = ({
  isPulling,
  isRefreshing,
  pullProgress,
  pullDistance,
}) => {
  const showIndicator = isPulling || isRefreshing;
  const isReadyToRefresh = pullProgress >= 1;

  return (
    <AnimatePresence>
      {showIndicator && (
        <motion.div
          className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center pointer-events-none"
          initial={{ y: -60 }}
          animate={{ y: Math.min(pullDistance - 30, 40) }}
          exit={{ y: -60 }}
          transition={{ type: 'spring', damping: 20, stiffness: 200 }}
        >
          <motion.div
            className={`
              flex items-center gap-2 px-4 py-2 rounded-full shadow-lg backdrop-blur-md
              ${isReadyToRefresh || isRefreshing 
                ? 'bg-primary/90 text-primary-foreground' 
                : 'bg-background/90 text-foreground border border-border'
              }
            `}
            animate={{
              scale: isReadyToRefresh ? 1.1 : 1,
            }}
            transition={{ type: 'spring', damping: 15 }}
          >
            {isRefreshing ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <RefreshCw className="w-5 h-5" />
                </motion.div>
                <span className="text-sm font-medium">Đang tải...</span>
              </>
            ) : isReadyToRefresh ? (
              <>
                <RefreshCw className="w-5 h-5" />
                <span className="text-sm font-medium">Thả để làm mới</span>
              </>
            ) : (
              <>
                <motion.div
                  animate={{ 
                    rotate: pullProgress * 180,
                    opacity: 0.5 + pullProgress * 0.5 
                  }}
                >
                  <ArrowDown className="w-5 h-5" />
                </motion.div>
                <span className="text-sm font-medium">Kéo xuống để làm mới</span>
              </>
            )}
          </motion.div>

          {/* Progress circle */}
          {!isRefreshing && pullProgress > 0 && (
            <motion.div
              className="absolute -bottom-8"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" className="transform -rotate-90">
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-muted/30"
                />
                <motion.circle
                  cx="12"
                  cy="12"
                  r="10"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  className="text-primary"
                  strokeDasharray={62.83}
                  strokeDashoffset={62.83 * (1 - pullProgress)}
                />
              </svg>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PullToRefreshIndicator;
