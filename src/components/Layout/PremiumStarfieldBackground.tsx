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

interface AuroraWave {
  id: number;
  x: number;
  width: number;
  color: string;
  duration: number;
  delay: number;
}

const starColors = [
  'rgba(0, 212, 255, 1)',    // Electric sapphire
  'rgba(139, 0, 255, 0.9)',   // Cosmic purple
  'rgba(255, 0, 212, 0.9)',   // Hot magenta
  'rgba(0, 255, 255, 1)',     // Pure turquoise
  'rgba(255, 255, 255, 1)',   // Pure white
  'rgba(255, 215, 0, 1)',     // Gold
];

const auroraColors = [
  'rgba(0, 212, 255, 0.3)',
  'rgba(139, 0, 255, 0.25)',
  'rgba(255, 0, 212, 0.2)',
  'rgba(0, 255, 255, 0.25)',
];

export const PremiumStarfieldBackground = () => {
  const [stars, setStars] = useState<Star[]>([]);
  const [auroraWaves, setAuroraWaves] = useState<AuroraWave[]>([]);

  useEffect(() => {
    // Generate cosmic stardust particles
    const generatedStars: Star[] = Array.from({ length: 120 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      opacity: Math.random() * 0.6 + 0.4,
      duration: Math.random() * 4 + 2,
      delay: Math.random() * 3,
      color: starColors[Math.floor(Math.random() * starColors.length)],
    }));
    setStars(generatedStars);

    // Generate aurora waves
    const generatedAurora: AuroraWave[] = Array.from({ length: 5 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      width: Math.random() * 30 + 20,
      color: auroraColors[Math.floor(Math.random() * auroraColors.length)],
      duration: Math.random() * 8 + 10,
      delay: Math.random() * 5,
    }));
    setAuroraWaves(generatedAurora);
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Deep space nebula gradient */}
      <div 
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 150% 80% at 50% 0%, rgba(139, 0, 255, 0.35) 0%, transparent 50%),
            radial-gradient(ellipse 100% 60% at 20% 20%, rgba(255, 0, 212, 0.25) 0%, transparent 40%),
            radial-gradient(ellipse 120% 70% at 80% 30%, rgba(0, 212, 255, 0.3) 0%, transparent 45%),
            radial-gradient(ellipse 90% 50% at 60% 80%, rgba(0, 255, 255, 0.2) 0%, transparent 40%),
            radial-gradient(ellipse 200% 100% at 30% 60%, rgba(59, 30, 141, 0.5) 0%, transparent 50%),
            linear-gradient(
              180deg,
              rgb(11, 13, 37) 0%,
              rgb(30, 20, 80) 30%,
              rgb(20, 15, 50) 60%,
              rgb(11, 13, 37) 100%
            )
          `,
        }}
      />

      {/* Aurora wave animations */}
      {auroraWaves.map((wave) => (
        <motion.div
          key={`aurora-${wave.id}`}
          className="absolute h-40 rounded-full blur-3xl"
          style={{
            left: `${wave.x}%`,
            top: '30%',
            width: `${wave.width}%`,
            background: `linear-gradient(90deg, transparent, ${wave.color}, transparent)`,
          }}
          animate={{
            x: ['-20%', '20%', '-20%'],
            opacity: [0.3, 0.6, 0.3],
            scaleY: [1, 1.3, 1],
          }}
          transition={{
            duration: wave.duration,
            delay: wave.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Holographic prismatic overlay */}
      <motion.div
        className="absolute inset-0"
        animate={{
          background: [
            'radial-gradient(ellipse at 30% 30%, rgba(0, 212, 255, 0.1) 0%, transparent 50%)',
            'radial-gradient(ellipse at 70% 70%, rgba(255, 0, 212, 0.1) 0%, transparent 50%)',
            'radial-gradient(ellipse at 50% 50%, rgba(139, 0, 255, 0.1) 0%, transparent 50%)',
            'radial-gradient(ellipse at 30% 70%, rgba(0, 255, 255, 0.1) 0%, transparent 50%)',
            'radial-gradient(ellipse at 30% 30%, rgba(0, 212, 255, 0.1) 0%, transparent 50%)',
          ],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "linear",
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
            boxShadow: `0 0 ${star.size * 3}px ${star.size}px ${star.color}`,
          }}
          animate={{
            opacity: [star.opacity * 0.3, star.opacity, star.opacity * 0.3],
            scale: [0.8, 1.4, 0.8],
            y: [0, -20, 0],
          }}
          transition={{
            duration: star.duration,
            delay: star.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Diamond-like sparkle bursts */}
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div
          key={`sparkle-${i}`}
          className="absolute"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0, 1.5, 0],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 2 + Math.random() * 2,
            delay: Math.random() * 6,
            repeat: Infinity,
          }}
        >
          <div 
            className="w-2 h-2"
            style={{
              background: `linear-gradient(45deg, 
                rgba(255, 255, 255, 1) 0%, 
                rgba(0, 212, 255, 1) 25%, 
                rgba(255, 0, 212, 1) 50%, 
                rgba(0, 255, 255, 1) 75%, 
                rgba(255, 255, 255, 1) 100%)`,
              clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
              filter: 'drop-shadow(0 0 6px rgba(255,255,255,0.9))',
            }}
          />
        </motion.div>
      ))}

      {/* Radiant light beams */}
      {Array.from({ length: 6 }).map((_, i) => (
        <motion.div
          key={`beam-${i}`}
          className="absolute origin-center"
          style={{
            left: `${20 + i * 15}%`,
            top: '0',
            width: '2px',
            height: '100%',
            background: `linear-gradient(180deg, 
              transparent 0%, 
              rgba(0, 212, 255, 0.3) 30%, 
              rgba(139, 0, 255, 0.2) 50%, 
              rgba(255, 0, 212, 0.3) 70%, 
              transparent 100%)`,
            transform: `rotate(${-15 + i * 5}deg)`,
          }}
          animate={{
            opacity: [0.1, 0.4, 0.1],
            scaleY: [0.8, 1, 0.8],
          }}
          transition={{
            duration: 4 + i,
            delay: i * 0.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Ethereal cosmic dust floating */}
      {Array.from({ length: 30 }).map((_, i) => (
        <motion.div
          key={`dust-${i}`}
          className="absolute rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            width: Math.random() * 4 + 1,
            height: Math.random() * 4 + 1,
            background: `rgba(${Math.random() > 0.5 ? '0, 212, 255' : '255, 215, 0'}, ${Math.random() * 0.4 + 0.2})`,
            filter: 'blur(1px)',
          }}
          animate={{
            x: [0, Math.random() * 40 - 20, 0],
            y: [0, Math.random() * 60 - 30, 0],
            opacity: [0.2, 0.6, 0.2],
          }}
          transition={{
            duration: 8 + Math.random() * 8,
            delay: Math.random() * 5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};
