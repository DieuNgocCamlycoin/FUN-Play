import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

interface CounterAnimationProps {
  value: number;
  duration?: number;
  decimals?: number;
  compact?: boolean; // Use K/M abbreviations for large numbers
}

export const CounterAnimation = ({ value, duration = 2000, decimals = 0, compact = false }: CounterAnimationProps) => {
  const [displayValue, setDisplayValue] = useState(0);
  const frameRef = useRef<number>();
  const startTimeRef = useRef<number>();

  useEffect(() => {
    const startValue = displayValue;
    const difference = value - startValue;

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }

      const progress = Math.min((timestamp - startTimeRef.current) / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      
      const currentValue = startValue + difference * easeOutQuart;
      setDisplayValue(currentValue);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };

    startTimeRef.current = undefined;
    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [value, duration]);

  const formatNumber = (num: number) => {
    // Compact format: K for thousands, M for millions
    if (compact) {
      if (num >= 1000000) {
        return (num / 1000000).toFixed(2) + 'M';
      }
      if (num >= 10000) {
        return (num / 1000).toFixed(1) + 'K';
      }
    }
    
    // Smart decimals based on number size
    if (num >= 1000) {
      return Math.floor(num).toLocaleString('vi-VN');
    }
    
    // Small numbers: use specified decimals
    if (decimals === 0) {
      return Math.floor(num).toLocaleString('vi-VN');
    }
    
    return num.toLocaleString('vi-VN', { 
      minimumFractionDigits: decimals, 
      maximumFractionDigits: decimals 
    });
  };

  return (
    <motion.span
      initial={{ scale: 1 }}
      animate={{ scale: [1, 1.1, 1] }}
      transition={{ duration: 0.3 }}
      key={value}
      className="font-bold tabular-nums"
    >
      {formatNumber(displayValue)}
    </motion.span>
  );
};
