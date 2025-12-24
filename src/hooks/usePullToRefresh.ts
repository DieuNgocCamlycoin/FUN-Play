import { useState, useCallback, useRef, useEffect } from 'react';

interface PullToRefreshOptions {
  onRefresh: () => Promise<void>;
  threshold?: number;
  maxPull?: number;
  enabled?: boolean;
}

interface PullToRefreshReturn {
  isPulling: boolean;
  isRefreshing: boolean;
  pullProgress: number;
  pullDistance: number;
  handlers: {
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchEnd: () => void;
  };
}

export const usePullToRefresh = ({
  onRefresh,
  threshold = 80,
  maxPull = 150,
  enabled = true,
}: PullToRefreshOptions): PullToRefreshReturn => {
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);

  const touchStartY = useRef(0);
  const scrollTopRef = useRef(0);
  const isPullingRef = useRef(false);

  // Check if at top of scroll
  const isAtTop = useCallback(() => {
    return window.scrollY <= 0;
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!enabled || isRefreshing) return;
    
    touchStartY.current = e.touches[0].clientY;
    scrollTopRef.current = window.scrollY;
  }, [enabled, isRefreshing]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!enabled || isRefreshing) return;
    
    const touchY = e.touches[0].clientY;
    const diff = touchY - touchStartY.current;

    // Only activate when at top and pulling down
    if (diff > 0 && isAtTop()) {
      if (!isPullingRef.current) {
        isPullingRef.current = true;
        setIsPulling(true);
      }

      // Calculate pull distance with resistance
      const resistance = 0.4;
      const pull = Math.min(diff * resistance, maxPull);
      setPullDistance(pull);

      // Prevent default scroll behavior when pulling
      if (pull > 10) {
        e.preventDefault();
      }
    }
  }, [enabled, isRefreshing, isAtTop, maxPull]);

  const handleTouchEnd = useCallback(async () => {
    if (!enabled || !isPullingRef.current) return;

    isPullingRef.current = false;

    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(threshold); // Keep at threshold while refreshing

      try {
        await onRefresh();
      } catch (error) {
        console.error('Refresh failed:', error);
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
        setIsPulling(false);
      }
    } else {
      setPullDistance(0);
      setIsPulling(false);
    }
  }, [enabled, pullDistance, threshold, isRefreshing, onRefresh]);

  // Calculate progress (0 to 1)
  const pullProgress = Math.min(pullDistance / threshold, 1);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isPullingRef.current = false;
    };
  }, []);

  return {
    isPulling,
    isRefreshing,
    pullProgress,
    pullDistance,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
  };
};

export default usePullToRefresh;
