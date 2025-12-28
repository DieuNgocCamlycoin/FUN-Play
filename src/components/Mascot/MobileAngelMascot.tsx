import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { AngelChat } from './AngelChat';
import { FlyingCoins } from './FlyingCoins';
import { useIsMobile } from '@/hooks/use-mobile';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { useSoundEffects } from '@/hooks/useSoundEffects';

interface MobileAngelMascotProps {
  onTipReceived?: boolean;
}

export const MobileAngelMascot: React.FC<MobileAngelMascotProps> = ({ onTipReceived }) => {
  const isMobile = useIsMobile();
  const [position, setPosition] = useState({ x: 20, y: 100 });
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isExcited, setIsExcited] = useState(false);
  const [showFlyingCoins, setShowFlyingCoins] = useState(false);
  const [coinOrigin, setCoinOrigin] = useState({ x: 0, y: 0 });
  const [currentAnimation, setCurrentAnimation] = useState<'flying' | 'sitting' | 'dancing' | 'waving'>('flying');
  const controls = useAnimation();
  const angelRef = useRef<HTMLDivElement>(null);
  const { successFeedback, lightTap } = useHapticFeedback();
  const { playCoinShower, angelFly, celebrate, pop } = useSoundEffects();

  // Size based on device - original small sizes
  const size = isMobile ? 70 : 90;

  // Random idle animations
  useEffect(() => {
    const idleInterval = setInterval(() => {
      if (!isExcited && !isChatOpen) {
        const animations = ['giggle', 'blowKiss', 'somersault', 'wave'];
        const randomAnim = animations[Math.floor(Math.random() * animations.length)];
        triggerIdleAnimation(randomAnim);
      }
    }, 10000 + Math.random() * 5000);

    return () => clearInterval(idleInterval);
  }, [isExcited, isChatOpen]);

  // Flying movement - more constrained on mobile
  useEffect(() => {
    if (currentAnimation === 'flying' && !isChatOpen) {
      const moveInterval = setInterval(() => {
        const padding = 20;
        const maxX = window.innerWidth - size - padding;
        const maxY = window.innerHeight - size - (isMobile ? 100 : 150); // Account for bottom nav
        const minY = isMobile ? 70 : 100; // Account for header
        
        const newX = padding + Math.random() * (maxX - padding);
        const newY = minY + Math.random() * (maxY - minY);
        setPosition({ x: newX, y: newY });
      }, 6000);

      return () => clearInterval(moveInterval);
    }
  }, [currentAnimation, isChatOpen, isMobile, size]);

  // Listen for tip received events and trigger flying coins
  useEffect(() => {
    const handleTipReceived = () => {
      setIsExcited(true);
      setCurrentAnimation('dancing');
      
      // Get angel position for coin origin
      if (angelRef.current) {
        const rect = angelRef.current.getBoundingClientRect();
        setCoinOrigin({ 
          x: rect.left + rect.width / 2, 
          y: rect.top + rect.height / 2 
        });
      }
      
      // Trigger flying coins animation
      setShowFlyingCoins(true);
      successFeedback(); // Haptic feedback on reward
      
      // Play celebration sound effects
      celebrate();
      setTimeout(() => playCoinShower(8), 200);
      
      // Reset after celebration
      setTimeout(() => {
        setIsExcited(false);
        setCurrentAnimation('flying');
        setShowFlyingCoins(false);
      }, 3000);
    };

    window.addEventListener('tip-received', handleTipReceived);
    window.addEventListener('payment-received', handleTipReceived);
    window.addEventListener('camly-reward', handleTipReceived);
    
    return () => {
      window.removeEventListener('tip-received', handleTipReceived);
      window.removeEventListener('payment-received', handleTipReceived);
      window.removeEventListener('camly-reward', handleTipReceived);
    };
  }, [successFeedback, celebrate, playCoinShower]);

  // Play whoosh sound when angel moves
  useEffect(() => {
    if (currentAnimation === 'flying') {
      angelFly();
    }
  }, [position, angelFly]);

  const triggerIdleAnimation = (type: string) => {
    controls.start({
      rotate: type === 'somersault' ? [0, 360] : [0, -10, 10, 0],
      scale: type === 'giggle' ? [1, 1.1, 1] : 1,
      transition: { duration: 0.8 }
    });
  };

  const handleClick = () => {
    lightTap(); // Haptic feedback on tap
    setIsChatOpen(true);
    setCurrentAnimation('waving');
  };

  return (
    <>
      {/* Flying Coins Animation */}
      <FlyingCoins 
        isActive={showFlyingCoins} 
        count={12}
        originX={coinOrigin.x}
        originY={coinOrigin.y}
      />
      
      <motion.div
        ref={angelRef}
        className="fixed z-[9999] cursor-pointer select-none pointer-events-auto"
        style={{ 
          width: `${size}px`, 
          height: `${size + 20}px`,
          overflow: 'hidden',
          background: 'transparent',
        }}
        initial={{ x: 20, y: 100 }}
        animate={{ 
          x: isChatOpen ? (window.innerWidth / 2 - size / 2) : position.x, 
          y: isChatOpen ? (window.innerHeight / 2 - 120) : position.y,
          rotate: isExcited ? [0, -15, 15, -15, 15, 0] : 0,
        }}
        transition={{ 
          type: 'spring', 
          stiffness: 50, 
          damping: 15,
          duration: 2
        }}
        onClick={handleClick}
        whileTap={{ scale: 1.2 }}
      >
        {/* Angel Video - Pure character, no frame */}
        <motion.div
          className="w-full h-full"
          animate={controls}
          style={{
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 12%, black 88%, transparent 100%), linear-gradient(to right, transparent 0%, black 12%, black 88%, transparent 100%)',
            maskImage: 'linear-gradient(to bottom, transparent 0%, black 12%, black 88%, transparent 100%), linear-gradient(to right, transparent 0%, black 12%, black 88%, transparent 100%)',
            WebkitMaskComposite: 'destination-in',
            maskComposite: 'intersect',
          }}
        >
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full"
            style={{
              background: 'transparent',
              transform: 'scale(2.5) translateY(-5%)',
              objectFit: 'cover',
              objectPosition: 'center top',
              filter: isExcited 
                ? 'drop-shadow(0 0 12px rgba(255, 215, 0, 0.5))' 
                : 'drop-shadow(0 0 8px rgba(255, 215, 0, 0.3))',
            }}
          >
            <source src="/videos/angel-bay.mp4" type="video/mp4" />
          </video>
        </motion.div>

        {/* Speech Bubble - Tap hint on mobile */}
        <AnimatePresence>
          {!isChatOpen && !isExcited && (
            <motion.div
              className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-sm px-2 py-0.5 rounded-full shadow-lg border border-primary whitespace-nowrap"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: [0, 1, 1, 0], scale: 1 }}
              transition={{ duration: 3, times: [0, 0.1, 0.9, 1], repeat: Infinity, repeatDelay: 10 }}
            >
              <span className="text-[10px] font-medium text-primary">
                Chạm để chat! ♡
              </span>
            </motion.div>
          )}
        </AnimatePresence>


        {/* Hearts when excited */}
        {isExcited && (
          <>
            <motion.div
              className="absolute -top-2 -left-2 text-base"
              animate={{ opacity: [0, 1, 0], y: -15 }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              ♡
            </motion.div>
            <motion.div
              className="absolute -top-4 left-1/2 -translate-x-1/2 text-base"
              animate={{ opacity: [0, 1, 0], scale: [0.5, 1.5, 0.5], y: -10 }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
            >
              💰
            </motion.div>
          </>
        )}
      </motion.div>

      {/* Chat Window - Mobile optimized */}
      <AngelChat 
        isOpen={isChatOpen} 
        onClose={() => {
          setIsChatOpen(false);
          setCurrentAnimation('flying');
        }} 
      />
    </>
  );
};

export default MobileAngelMascot;
