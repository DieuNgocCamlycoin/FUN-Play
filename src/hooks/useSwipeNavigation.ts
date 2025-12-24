import { useState, useCallback, useRef } from "react";

interface SwipeNavigationProps {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
  enabled?: boolean;
}

export const useSwipeNavigation = ({
  onSwipeLeft,
  onSwipeRight,
  threshold = 50,
  enabled = true,
}: SwipeNavigationProps) => {
  const [isSwiping, setIsSwiping] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<"left" | "right" | null>(null);
  const [swipeProgress, setSwipeProgress] = useState(0);
  
  const startX = useRef(0);
  const startY = useRef(0);
  const currentX = useRef(0);
  const isHorizontalSwipe = useRef(false);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!enabled) return;
      startX.current = e.touches[0].clientX;
      startY.current = e.touches[0].clientY;
      currentX.current = startX.current;
      isHorizontalSwipe.current = false;
      setIsSwiping(true);
    },
    [enabled]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!enabled || !isSwiping) return;

      const touch = e.touches[0];
      const deltaX = touch.clientX - startX.current;
      const deltaY = touch.clientY - startY.current;

      // Determine if this is a horizontal swipe (first significant movement)
      if (!isHorizontalSwipe.current && (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10)) {
        isHorizontalSwipe.current = Math.abs(deltaX) > Math.abs(deltaY);
      }

      // Only process horizontal swipes
      if (!isHorizontalSwipe.current) return;

      currentX.current = touch.clientX;
      const progress = Math.min(Math.abs(deltaX) / threshold, 1);
      setSwipeProgress(progress);

      if (deltaX > threshold) {
        setSwipeDirection("right");
      } else if (deltaX < -threshold) {
        setSwipeDirection("left");
      } else {
        setSwipeDirection(null);
      }
    },
    [enabled, isSwiping, threshold]
  );

  const handleTouchEnd = useCallback(() => {
    if (!enabled) return;

    if (swipeDirection === "left" && onSwipeLeft) {
      onSwipeLeft();
    } else if (swipeDirection === "right" && onSwipeRight) {
      onSwipeRight();
    }

    setIsSwiping(false);
    setSwipeDirection(null);
    setSwipeProgress(0);
    isHorizontalSwipe.current = false;
  }, [enabled, swipeDirection, onSwipeLeft, onSwipeRight]);

  return {
    isSwiping,
    swipeDirection,
    swipeProgress,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
  };
};
