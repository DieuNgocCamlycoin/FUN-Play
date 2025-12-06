import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface Star {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  duration: number;
  delay: number;
  color: string;
}

interface HeartParticle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  color: string;
}

const starColors = [
  'rgba(0, 255, 255, 1)',      // Electric cyan
  'rgba(0, 102, 255, 0.9)',    // Sapphire blue
  'rgba(217, 0, 255, 0.9)',    // Cosmic magenta
  'rgba(255, 183, 246, 1)',    // Divine rose gold
  'rgba(255, 215, 0, 1)',      // Golden stardust
  'rgba(255, 255, 255, 1)',    // Pure white diamond
];

const heartColors = [
  'rgba(255, 183, 246, 0.8)',  // Divine rose
  'rgba(255, 215, 0, 0.7)',    // Golden
  'rgba(0, 255, 255, 0.6)',    // Cyan
  'rgba(217, 0, 255, 0.6)',    // Magenta
];

export const PremiumStarfieldBackground = () => {
  const [stars, setStars] = useState<Star[]>([]);
  const [hearts, setHearts] = useState<HeartParticle[]>([]);

  useEffect(() => {
    // Generate millions of tiny stars effect
    const generatedStars: Star[] = Array.from({ length: 150 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 0.5,
      opacity: Math.random() * 0.7 + 0.3,
      duration: Math.random() * 4 + 2,
      delay: Math.random() * 4,
      color: starColors[Math.floor(Math.random() * starColors.length)],
    }));
    setStars(generatedStars);

    // Generate floating sacred heart particles
    const generatedHearts: HeartParticle[] = Array.from({ length: 12 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 12 + 8,
      duration: Math.random() * 10 + 15,
      delay: Math.random() * 8,
      color: heartColors[Math.floor(Math.random() * heartColors.length)],
    }));
    setHearts(generatedHearts);
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Deep cosmic gradient base */}
      <div 
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 50% 50%, rgba(255, 215, 0, 0.12) 0%, transparent 50%),
            radial-gradient(ellipse 60% 40% at 50% 50%, rgba(255, 183, 246, 0.1) 0%, transparent 45%),
            radial-gradient(ellipse 150% 80% at 50% 0%, rgba(217, 0, 255, 0.3) 0%, transparent 50%),
            radial-gradient(ellipse 100% 60% at 15% 25%, rgba(0, 102, 255, 0.25) 0%, transparent 40%),
            radial-gradient(ellipse 120% 70% at 85% 30%, rgba(0, 255, 255, 0.25) 0%, transparent 45%),
            radial-gradient(ellipse 100% 60% at 20% 75%, rgba(255, 183, 246, 0.2) 0%, transparent 40%),
            radial-gradient(ellipse 90% 50% at 80% 80%, rgba(255, 215, 0, 0.15) 0%, transparent 40%),
            radial-gradient(ellipse 200% 100% at 30% 50%, rgba(28, 10, 94, 0.7) 0%, transparent 50%),
            linear-gradient(180deg, 
              rgb(10, 14, 44) 0%, 
              rgb(28, 10, 94) 25%, 
              rgb(20, 12, 70) 50%, 
              rgb(28, 10, 94) 75%, 
              rgb(10, 14, 44) 100%
            )
          `,
        }}
      />

      {/* Heavenly center light rays */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: `
            conic-gradient(from 0deg at 50% 50%, 
              transparent 0deg, 
              rgba(255, 215, 0, 0.08) 15deg, 
              transparent 30deg,
              rgba(255, 183, 246, 0.06) 45deg,
              transparent 60deg,
              rgba(0, 255, 255, 0.06) 75deg,
              transparent 90deg,
              rgba(217, 0, 255, 0.05) 105deg,
              transparent 120deg,
              rgba(255, 215, 0, 0.08) 135deg,
              transparent 150deg,
              rgba(0, 102, 255, 0.06) 165deg,
              transparent 180deg,
              rgba(255, 183, 246, 0.06) 195deg,
              transparent 210deg,
              rgba(0, 255, 255, 0.06) 225deg,
              transparent 240deg,
              rgba(217, 0, 255, 0.05) 255deg,
              transparent 270deg,
              rgba(255, 215, 0, 0.08) 285deg,
              transparent 300deg,
              rgba(255, 183, 246, 0.06) 315deg,
              transparent 330deg,
              rgba(0, 255, 255, 0.06) 345deg,
              transparent 360deg
            )
          `,
        }}
        animate={{
          rotate: [0, 360],
        }}
        transition={{
          duration: 120,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      {/* Angelic energy waves */}
      <motion.div
        className="absolute inset-0"
        animate={{
          background: [
            'radial-gradient(ellipse at 30% 30%, rgba(0, 255, 255, 0.08) 0%, transparent 50%)',
            'radial-gradient(ellipse at 70% 70%, rgba(255, 183, 246, 0.08) 0%, transparent 50%)',
            'radial-gradient(ellipse at 50% 50%, rgba(255, 215, 0, 0.08) 0%, transparent 50%)',
            'radial-gradient(ellipse at 30% 70%, rgba(217, 0, 255, 0.08) 0%, transparent 50%)',
            'radial-gradient(ellipse at 70% 30%, rgba(0, 102, 255, 0.08) 0%, transparent 50%)',
            'radial-gradient(ellipse at 30% 30%, rgba(0, 255, 255, 0.08) 0%, transparent 50%)',
          ],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Ultra-shimmering stardust particles */}
      {stars.map((star) => (
        <motion.div
          key={star.id}
          className="absolute rounded-full"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: star.size,
            height: star.size,
            backgroundColor: star.color,
            boxShadow: `0 0 ${star.size * 4}px ${star.size}px ${star.color}`,
          }}
          animate={{
            opacity: [star.opacity * 0.2, star.opacity, star.opacity * 0.2],
            scale: [0.6, 1.3, 0.6],
          }}
          transition={{
            duration: star.duration,
            delay: star.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Floating sacred heart-shaped light particles */}
      {hearts.map((heart) => (
        <motion.div
          key={`heart-${heart.id}`}
          className="absolute"
          style={{
            left: `${heart.x}%`,
            top: `${heart.y}%`,
            fontSize: heart.size,
            color: heart.color,
            textShadow: `0 0 ${heart.size}px ${heart.color}, 0 0 ${heart.size * 2}px ${heart.color}`,
            filter: 'blur(0.5px)',
          }}
          animate={{
            y: [0, -60, 0],
            x: [0, Math.random() * 30 - 15, 0],
            opacity: [0.3, 0.7, 0.3],
            scale: [0.8, 1.1, 0.8],
            rotate: [-10, 10, -10],
          }}
          transition={{
            duration: heart.duration,
            delay: heart.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          ♥
        </motion.div>
      ))}

      {/* Diamond sparkle bursts */}
      {Array.from({ length: 25 }).map((_, i) => (
        <motion.div
          key={`diamond-${i}`}
          className="absolute"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0, 1.8, 0],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 2.5 + Math.random() * 2,
            delay: Math.random() * 8,
            repeat: Infinity,
          }}
        >
          <div 
            className="w-2 h-2"
            style={{
              background: `linear-gradient(45deg, 
                rgba(255, 255, 255, 1) 0%, 
                rgba(255, 215, 0, 1) 25%, 
                rgba(255, 183, 246, 1) 50%, 
                rgba(0, 255, 255, 1) 75%, 
                rgba(255, 255, 255, 1) 100%)`,
              clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
              filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.9))',
            }}
          />
        </motion.div>
      ))}

      {/* Rainbow prismatic light refraction */}
      {Array.from({ length: 8 }).map((_, i) => (
        <motion.div
          key={`prism-${i}`}
          className="absolute origin-center"
          style={{
            left: `${15 + i * 10}%`,
            top: '0',
            width: '3px',
            height: '100%',
            background: `linear-gradient(180deg, 
              transparent 0%, 
              rgba(0, 255, 255, 0.2) 20%, 
              rgba(0, 102, 255, 0.15) 35%, 
              rgba(217, 0, 255, 0.15) 50%, 
              rgba(255, 183, 246, 0.2) 65%, 
              rgba(255, 215, 0, 0.15) 80%, 
              transparent 100%)`,
            transform: `rotate(${-20 + i * 5}deg)`,
            filter: 'blur(2px)',
          }}
          animate={{
            opacity: [0.1, 0.35, 0.1],
          }}
          transition={{
            duration: 5 + i * 0.5,
            delay: i * 0.8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Cosmic dust floating gently */}
      {Array.from({ length: 40 }).map((_, i) => (
        <motion.div
          key={`dust-${i}`}
          className="absolute rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            width: Math.random() * 3 + 1,
            height: Math.random() * 3 + 1,
            background: `rgba(${
              Math.random() > 0.6 ? '255, 215, 0' : 
              Math.random() > 0.3 ? '255, 183, 246' : 
              '0, 255, 255'
            }, ${Math.random() * 0.4 + 0.2})`,
            filter: 'blur(0.5px)',
          }}
          animate={{
            x: [0, Math.random() * 50 - 25, 0],
            y: [0, Math.random() * 80 - 40, 0],
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{
            duration: 12 + Math.random() * 10,
            delay: Math.random() * 6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};
