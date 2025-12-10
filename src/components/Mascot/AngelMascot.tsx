import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { AngelChat } from './AngelChat';

interface AngelMascotProps {
  onTipReceived?: boolean;
}

export const AngelMascot: React.FC<AngelMascotProps> = ({ onTipReceived }) => {
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isExcited, setIsExcited] = useState(false);
  const [currentAnimation, setCurrentAnimation] = useState<'flying' | 'sitting' | 'dancing' | 'waving'>('flying');
  const [targetElement, setTargetElement] = useState<string | null>(null);
  const controls = useAnimation();
  const angelRef = useRef<HTMLDivElement>(null);

  // Random idle animations
  useEffect(() => {
    const idleInterval = setInterval(() => {
      if (!isExcited && !isChatOpen) {
        const animations = ['giggle', 'blowKiss', 'somersault', 'wave'];
        const randomAnim = animations[Math.floor(Math.random() * animations.length)];
        triggerIdleAnimation(randomAnim);
      }
    }, 8000 + Math.random() * 4000);

    return () => clearInterval(idleInterval);
  }, [isExcited, isChatOpen]);

  // Flying movement
  useEffect(() => {
    if (currentAnimation === 'flying' && !isChatOpen) {
      const moveInterval = setInterval(() => {
        const maxX = window.innerWidth - 150;
        const maxY = window.innerHeight - 150;
        const newX = Math.random() * maxX;
        const newY = Math.random() * maxY;
        setPosition({ x: newX, y: newY });
      }, 5000);

      return () => clearInterval(moveInterval);
    }
  }, [currentAnimation, isChatOpen]);

  // Listen for tip received events
  useEffect(() => {
    const handleTipReceived = () => {
      setIsExcited(true);
      setCurrentAnimation('dancing');
      
      // Play cute voice
      const utterance = new SpeechSynthesisUtterance('Rich! Rich! Rich!');
      utterance.pitch = 2;
      utterance.rate = 1.2;
      speechSynthesis.speak(utterance);

      // Reset after celebration
      setTimeout(() => {
        setIsExcited(false);
        setCurrentAnimation('flying');
      }, 5000);
    };

    window.addEventListener('tip-received', handleTipReceived);
    window.addEventListener('payment-received', handleTipReceived);
    
    return () => {
      window.removeEventListener('tip-received', handleTipReceived);
      window.removeEventListener('payment-received', handleTipReceived);
    };
  }, []);

  const triggerIdleAnimation = (type: string) => {
    controls.start({
      rotate: type === 'somersault' ? [0, 360] : [0, -10, 10, 0],
      scale: type === 'giggle' ? [1, 1.1, 1] : 1,
      transition: { duration: 0.8 }
    });
  };

  const handleClick = () => {
    setIsChatOpen(true);
    setCurrentAnimation('waving');
  };

  const handleMouseEnter = () => {
    controls.start({
      scale: 1.1,
      transition: { duration: 0.3 }
    });
  };

  const handleMouseLeave = () => {
    controls.start({
      scale: 1,
      transition: { duration: 0.3 }
    });
  };

  return (
    <>
      <motion.div
        ref={angelRef}
        className="fixed z-[9999] cursor-pointer select-none pointer-events-auto"
        style={{ 
          width: '90px', 
          height: '120px',
        }}
        initial={{ x: 100, y: 100 }}
        animate={{ 
          x: isChatOpen ? window.innerWidth / 2 - 45 : position.x, 
          y: isChatOpen ? window.innerHeight / 2 - 150 : position.y,
          rotate: isExcited ? [0, -15, 15, -15, 15, 0] : 0,
        }}
        transition={{ 
          type: 'spring', 
          stiffness: 50, 
          damping: 15,
          duration: 2
        }}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        whileHover={{ filter: 'brightness(1.2)', scale: 1.1 }}
      >
        {/* Angel Video - Looping - Free flying without frame */}
        <motion.div
          className="w-full h-full"
          animate={controls}
          style={{
            filter: isExcited 
              ? 'drop-shadow(0 0 20px rgba(255, 215, 0, 0.8)) drop-shadow(0 0 40px rgba(0, 231, 255, 0.5))' 
              : 'drop-shadow(0 0 12px rgba(255, 215, 0, 0.5)) drop-shadow(0 0 25px rgba(0, 231, 255, 0.3))'
          }}
        >
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-contain"
            style={{
              mixBlendMode: 'screen',
            }}
          >
            <source src="/videos/angel-mascot-new.mp4" type="video/mp4" />
          </video>
        </motion.div>

        {/* Speech Bubble */}
        <AnimatePresence>
          {isChatOpen && !isExcited && (
            <motion.div
              className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-sm px-3 py-1 rounded-full shadow-lg border-2 border-primary whitespace-nowrap"
              initial={{ opacity: 0, scale: 0, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0 }}
            >
              <span className="text-xs font-medium bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Chào bạn nhá! ♡
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hearts when excited */}
        {isExcited && (
          <>
            <motion.div
              className="absolute -top-2 -left-2 text-lg"
              initial={{ opacity: 0, y: 0 }}
              animate={{ opacity: [0, 1, 0], y: -20 }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              ♡
            </motion.div>
            <motion.div
              className="absolute -top-2 -right-2 text-sm"
              initial={{ opacity: 0, y: 0 }}
              animate={{ opacity: [0, 1, 0], y: -15 }}
              transition={{ duration: 1, repeat: Infinity, delay: 0.3 }}
            >
              ✧
            </motion.div>
            <motion.div
              className="absolute -top-4 left-1/2 -translate-x-1/2 text-lg"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: [0, 1, 0], scale: [0.5, 1.5, 0.5], y: -15 }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}
            >
              $
            </motion.div>
          </>
        )}

        {/* Floating sparkles around angel */}
        <motion.div
          className="absolute -top-1 -left-1 text-sm"
          animate={{ 
            opacity: [0, 1, 0],
            scale: [0.5, 1, 0.5],
            rotate: [0, 180, 360]
          }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          ✨
        </motion.div>
        <motion.div
          className="absolute -top-1 -right-1 text-xs"
          animate={{ 
            opacity: [0, 1, 0],
            scale: [0.5, 1, 0.5],
            rotate: [0, -180, -360]
          }}
          transition={{ duration: 3, repeat: Infinity, delay: 1 }}
        >
          💫
        </motion.div>
      </motion.div>

      {/* Chat Window */}
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

export default AngelMascot;
