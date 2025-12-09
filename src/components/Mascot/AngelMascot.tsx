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
          width: 'clamp(100px, 15vw, 160px)', 
          height: 'clamp(120px, 18vw, 180px)',
        }}
        initial={{ x: 100, y: 100 }}
        animate={{ 
          x: isChatOpen ? window.innerWidth / 2 - 80 : position.x, 
          y: isChatOpen ? window.innerHeight / 2 - 200 : position.y,
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
        whileHover={{ filter: 'brightness(1.2)' }}
      >
        {/* Angel Character SVG */}
        <motion.svg
          viewBox="0 0 200 240"
          className="w-full h-full drop-shadow-2xl"
          animate={controls}
        >
          {/* Glow Effect */}
          <defs>
            <radialGradient id="angelGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FFD700" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#00E7FF" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="wingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00E7FF" />
              <stop offset="50%" stopColor="#FFD700" />
              <stop offset="100%" stopColor="#00E7FF" />
            </linearGradient>
            <linearGradient id="dressGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#FFD700" />
            </linearGradient>
            <linearGradient id="haloGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FFD700" />
              <stop offset="50%" stopColor="#FFF8DC" />
              <stop offset="100%" stopColor="#FFD700" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* Background Glow */}
          <ellipse cx="100" cy="130" rx="80" ry="100" fill="url(#angelGlow)" />

          {/* Left Wing */}
          <motion.path
            d="M 40 100 Q 10 80 20 50 Q 35 70 50 85 Q 30 90 40 100"
            fill="url(#wingGradient)"
            filter="url(#glow)"
            animate={{ 
              d: [
                "M 40 100 Q 10 80 20 50 Q 35 70 50 85 Q 30 90 40 100",
                "M 35 100 Q 5 75 15 45 Q 30 65 45 80 Q 25 85 35 100",
                "M 40 100 Q 10 80 20 50 Q 35 70 50 85 Q 30 90 40 100"
              ]
            }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          />
          
          {/* Right Wing */}
          <motion.path
            d="M 160 100 Q 190 80 180 50 Q 165 70 150 85 Q 170 90 160 100"
            fill="url(#wingGradient)"
            filter="url(#glow)"
            animate={{ 
              d: [
                "M 160 100 Q 190 80 180 50 Q 165 70 150 85 Q 170 90 160 100",
                "M 165 100 Q 195 75 185 45 Q 170 65 155 80 Q 175 85 165 100",
                "M 160 100 Q 190 80 180 50 Q 165 70 150 85 Q 170 90 160 100"
              ]
            }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Halo */}
          <motion.ellipse
            cx="100" cy="35"
            rx="30" ry="8"
            fill="none"
            stroke="url(#haloGradient)"
            strokeWidth="4"
            filter="url(#glow)"
            animate={{ 
              ry: [8, 10, 8],
              opacity: [0.8, 1, 0.8]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />

          {/* Hair - Golden Curls */}
          <ellipse cx="100" cy="70" rx="40" ry="35" fill="#FFD700" />
          <circle cx="70" cy="55" r="12" fill="#FFD700" />
          <circle cx="130" cy="55" r="12" fill="#FFD700" />
          <circle cx="60" cy="70" r="10" fill="#00E7FF" opacity="0.6" />
          <circle cx="140" cy="70" r="10" fill="#00E7FF" opacity="0.6" />
          <circle cx="85" cy="45" r="8" fill="#FFD700" />
          <circle cx="115" cy="45" r="8" fill="#FFD700" />

          {/* Face */}
          <ellipse cx="100" cy="85" rx="35" ry="30" fill="#FFE4C4" />
          
          {/* Rosy Cheeks */}
          <ellipse cx="75" cy="95" rx="8" ry="5" fill="#FFB6C1" opacity="0.6" />
          <ellipse cx="125" cy="95" rx="8" ry="5" fill="#FFB6C1" opacity="0.6" />

          {/* Eyes */}
          {isExcited ? (
            <>
              {/* Dollar/Star Eyes when excited */}
              <motion.text
                x="82" y="90"
                fontSize="16"
                fill="#FFD700"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.3, repeat: Infinity }}
              >
                ★
              </motion.text>
              <motion.text
                x="108" y="90"
                fontSize="16"
                fill="#FFD700"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.3, repeat: Infinity }}
              >
                ★
              </motion.text>
            </>
          ) : (
            <>
              {/* Normal Sparkly Eyes */}
              <ellipse cx="85" cy="85" rx="8" ry="10" fill="#4A3728" />
              <ellipse cx="115" cy="85" rx="8" ry="10" fill="#4A3728" />
              <circle cx="87" cy="82" r="3" fill="white" />
              <circle cx="117" cy="82" r="3" fill="white" />
              <motion.circle
                cx="83" cy="88"
                r="1.5"
                fill="#00E7FF"
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <motion.circle
                cx="113" cy="88"
                r="1.5"
                fill="#00E7FF"
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
              />
            </>
          )}

          {/* Cute Nose */}
          <ellipse cx="100" cy="95" rx="3" ry="2" fill="#DEB887" />

          {/* Smile */}
          <motion.path
            d="M 88 105 Q 100 118 112 105"
            fill="none"
            stroke="#FF69B4"
            strokeWidth="3"
            strokeLinecap="round"
            animate={isExcited ? { 
              d: ["M 85 105 Q 100 125 115 105", "M 88 105 Q 100 120 112 105"]
            } : {}}
            transition={{ duration: 0.5, repeat: isExcited ? Infinity : 0 }}
          />

          {/* Dress */}
          <path
            d="M 70 115 Q 65 160 55 200 L 145 200 Q 135 160 130 115 Q 100 125 70 115"
            fill="url(#dressGradient)"
            stroke="#FFD700"
            strokeWidth="2"
          />

          {/* Sparkles on dress */}
          <motion.circle
            cx="80" cy="150"
            r="3"
            fill="#00E7FF"
            animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <motion.circle
            cx="120" cy="160"
            r="3"
            fill="#FFD700"
            animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
          />
          <motion.circle
            cx="100" cy="180"
            r="3"
            fill="#00E7FF"
            animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 1 }}
          />

          {/* Little Feet - swinging animation */}
          <motion.ellipse
            cx="80" cy="205"
            rx="12" ry="8"
            fill="#FFE4C4"
            animate={{ 
              rotate: [-5, 5, -5],
              y: [0, 3, 0]
            }}
            transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.ellipse
            cx="120" cy="205"
            rx="12" ry="8"
            fill="#FFE4C4"
            animate={{ 
              rotate: [5, -5, 5],
              y: [3, 0, 3]
            }}
            transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Little Arms */}
          <motion.ellipse
            cx="55" cy="140"
            rx="15" ry="8"
            fill="#FFE4C4"
            animate={isChatOpen ? { 
              rotate: [-30, -20, -30],
            } : {
              rotate: [0, 10, 0]
            }}
            transition={{ duration: 0.8, repeat: Infinity }}
          />
          <motion.ellipse
            cx="145" cy="140"
            rx="15" ry="8"
            fill="#FFE4C4"
            animate={isChatOpen ? { 
              rotate: [30, 20, 30],
            } : {
              rotate: [0, -10, 0]
            }}
            transition={{ duration: 0.8, repeat: Infinity }}
          />

          {/* Hearts when excited */}
          {isExcited && (
            <>
              <motion.text
                x="40" y="60"
                fontSize="20"
                fill="#FF69B4"
                initial={{ opacity: 0, y: 0 }}
                animate={{ opacity: [0, 1, 0], y: -30 }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                ♡
              </motion.text>
              <motion.text
                x="150" y="50"
                fontSize="16"
                fill="#FFD700"
                initial={{ opacity: 0, y: 0 }}
                animate={{ opacity: [0, 1, 0], y: -25 }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.3 }}
              >
                ✧
              </motion.text>
              <motion.text
                x="100" y="30"
                fontSize="24"
                fill="#00E7FF"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: [0, 1, 0], scale: [0.5, 1.5, 0.5], y: -20 }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}
              >
                $
              </motion.text>
            </>
          )}
        </motion.svg>

        {/* Speech Bubble */}
        <AnimatePresence>
          {isChatOpen && !isExcited && (
            <motion.div
              className="absolute -top-16 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg border-2 border-primary whitespace-nowrap"
              initial={{ opacity: 0, scale: 0, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0 }}
            >
              <span className="text-sm font-medium bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Chào bạn nhá! ♡
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating sparkles around angel */}
        <motion.div
          className="absolute -top-4 -left-4 text-2xl"
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
          className="absolute -top-2 -right-4 text-xl"
          animate={{ 
            opacity: [0, 1, 0],
            scale: [0.5, 1, 0.5],
            rotate: [0, -180, -360]
          }}
          transition={{ duration: 3, repeat: Infinity, delay: 1 }}
        >
          💫
        </motion.div>
        <motion.div
          className="absolute bottom-4 -right-6 text-lg"
          animate={{ 
            opacity: [0, 1, 0],
            scale: [0.5, 1, 0.5],
          }}
          transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
        >
          ⭐
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
