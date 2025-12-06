import { motion } from "framer-motion";
import { useEffect, useState, useMemo } from "react";

interface DiamondParticle {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  duration: number;
  delay: number;
  color: string;
}

interface CrystalParticle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  rotation: number;
}

interface HeartLightBurst {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
}

// 5D Golden Age Color Palette
const diamondColors = [
  'rgba(255, 255, 255, 1)',      // Pure white diamond core
  'rgba(255, 215, 0, 1)',        // Liquid gold 24K
  'rgba(253, 184, 19, 1)',       // Gold variant
  'rgba(255, 183, 246, 1)',      // Divine rose gold
  'rgba(255, 192, 203, 0.9)',    // Rose gold halo
  'rgba(0, 255, 255, 1)',        // Sacred turquoise-cyan
];

// 7-Chakra colors for rainbow aurora
const chakraColors = [
  '#FF0000', // Root - Red
  '#FF7F00', // Sacral - Orange  
  '#FFFF00', // Solar - Yellow
  '#00FF00', // Heart - Green
  '#00FFFF', // Throat - Cyan
  '#4B0082', // Third Eye - Indigo
  '#9400D3', // Crown - Violet
];

export const PremiumStarfieldBackground = () => {
  const [diamonds, setDiamonds] = useState<DiamondParticle[]>([]);
  const [crystals, setCrystals] = useState<CrystalParticle[]>([]);
  const [heartBursts, setHeartBursts] = useState<HeartLightBurst[]>([]);

  useEffect(() => {
    // Generate millions of diamond particles effect
    const generatedDiamonds: DiamondParticle[] = Array.from({ length: 200 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 1,
      opacity: Math.random() * 0.8 + 0.2,
      duration: Math.random() * 4 + 2,
      delay: Math.random() * 5,
      color: diamondColors[Math.floor(Math.random() * diamondColors.length)],
    }));
    setDiamonds(generatedDiamonds);

    // Generate crystal particles
    const generatedCrystals: CrystalParticle[] = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 20 + 10,
      duration: Math.random() * 15 + 10,
      delay: Math.random() * 8,
      rotation: Math.random() * 360,
    }));
    setCrystals(generatedCrystals);

    // Generate sacred heart light bursts
    const generatedHearts: HeartLightBurst[] = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 16 + 10,
      duration: Math.random() * 12 + 8,
      delay: Math.random() * 10,
    }));
    setHeartBursts(generatedHearts);
  }, []);

  // Memoize golden ratio spiral points
  const goldenSpiralPoints = useMemo(() => 
    Array.from({ length: 8 }, (_, i) => ({
      x: 50 + Math.cos(i * 0.618 * Math.PI * 2) * (15 + i * 5),
      y: 50 + Math.sin(i * 0.618 * Math.PI * 2) * (15 + i * 5),
      size: 3 + i * 0.5,
      delay: i * 0.3,
    })), []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Deep cosmic galaxy base */}
      <div 
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 50% 35% at 50% 50%, rgba(255, 255, 255, 0.15) 0%, transparent 40%),
            radial-gradient(ellipse 45% 30% at 50% 50%, rgba(255, 215, 0, 0.2) 0%, transparent 45%),
            radial-gradient(ellipse 70% 45% at 50% 45%, rgba(255, 183, 246, 0.12) 0%, transparent 50%),
            radial-gradient(ellipse 200% 100% at 30% 50%, rgba(30, 8, 89, 0.8) 0%, transparent 50%),
            radial-gradient(ellipse 180% 90% at 70% 40%, rgba(30, 8, 89, 0.6) 0%, transparent 45%),
            linear-gradient(180deg, 
              rgb(4, 14, 44) 0%, 
              rgb(30, 8, 89) 25%, 
              rgb(25, 10, 70) 50%, 
              rgb(30, 8, 89) 75%, 
              rgb(4, 14, 44) 100%
            )
          `,
        }}
      />

      {/* Liquid gold 24K flowing veins */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 80% 40% at 20% 30%, rgba(255, 215, 0, 0.15) 0%, transparent 50%),
            radial-gradient(ellipse 60% 35% at 80% 60%, rgba(253, 184, 19, 0.12) 0%, transparent 45%),
            radial-gradient(ellipse 100% 50% at 50% 80%, rgba(255, 215, 0, 0.1) 0%, transparent 50%)
          `,
        }}
        animate={{
          opacity: [0.5, 0.8, 0.5],
          scale: [1, 1.02, 1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Divine rose-gold halo */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 60% 40% at 50% 50%, rgba(255, 183, 246, 0.12) 0%, transparent 50%)`,
        }}
        animate={{
          opacity: [0.4, 0.7, 0.4],
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Living 7-Chakra Rainbow Aurora - Horizontal Flow */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(90deg, 
            rgba(255, 0, 0, 0.12) 0%,
            rgba(255, 127, 0, 0.12) 14%,
            rgba(255, 255, 0, 0.15) 28%,
            rgba(0, 255, 0, 0.12) 42%,
            rgba(0, 255, 255, 0.15) 57%,
            rgba(75, 0, 130, 0.12) 71%,
            rgba(148, 0, 211, 0.12) 85%,
            rgba(255, 0, 0, 0.12) 100%
          )`,
          backgroundSize: '200% 100%',
        }}
        animate={{
          backgroundPosition: ['0% 50%', '200% 50%'],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      {/* Living 7-Chakra Rainbow Aurora - Vertical Flow */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(180deg, 
            rgba(148, 0, 211, 0.08) 0%,
            rgba(75, 0, 130, 0.08) 14%,
            rgba(0, 255, 255, 0.1) 28%,
            rgba(0, 255, 0, 0.08) 42%,
            rgba(255, 255, 0, 0.1) 57%,
            rgba(255, 127, 0, 0.08) 71%,
            rgba(255, 0, 0, 0.08) 85%,
            rgba(148, 0, 211, 0.08) 100%
          )`,
          backgroundSize: '100% 200%',
        }}
        animate={{
          backgroundPosition: ['50% 0%', '50% 200%'],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      {/* Rainbow colors breathing and pulsing */}
      <motion.div
        className="absolute inset-0"
        animate={{
          background: [
            'radial-gradient(ellipse at 30% 30%, rgba(255, 0, 0, 0.1) 0%, transparent 40%)',
            'radial-gradient(ellipse at 50% 40%, rgba(255, 127, 0, 0.1) 0%, transparent 40%)',
            'radial-gradient(ellipse at 70% 50%, rgba(255, 255, 0, 0.12) 0%, transparent 40%)',
            'radial-gradient(ellipse at 60% 60%, rgba(0, 255, 0, 0.1) 0%, transparent 40%)',
            'radial-gradient(ellipse at 40% 70%, rgba(0, 255, 255, 0.12) 0%, transparent 40%)',
            'radial-gradient(ellipse at 30% 50%, rgba(75, 0, 130, 0.1) 0%, transparent 40%)',
            'radial-gradient(ellipse at 50% 30%, rgba(148, 0, 211, 0.1) 0%, transparent 40%)',
            'radial-gradient(ellipse at 30% 30%, rgba(255, 0, 0, 0.1) 0%, transparent 40%)',
          ],
        }}
        transition={{
          duration: 14,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Pure white diamond core - center glow */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 35% 25% at 50% 50%, rgba(255, 255, 255, 0.2) 0%, transparent 50%),
            radial-gradient(ellipse 25% 18% at 50% 50%, rgba(255, 255, 255, 0.15) 0%, transparent 40%)
          `,
        }}
        animate={{
          opacity: [0.6, 1, 0.6],
          scale: [1, 1.08, 1],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Angelic wings made of pure light - Left Wing */}
      <motion.div
        className="absolute"
        style={{
          left: '10%',
          top: '30%',
          width: '30%',
          height: '40%',
          background: `
            radial-gradient(ellipse 100% 80% at 100% 50%, rgba(255, 255, 255, 0.08) 0%, transparent 60%),
            radial-gradient(ellipse 80% 60% at 90% 50%, rgba(255, 215, 0, 0.05) 0%, transparent 50%)
          `,
          transform: 'perspective(500px) rotateY(-20deg)',
        }}
        animate={{
          opacity: [0.1, 0.2, 0.1],
          scaleX: [1, 1.05, 1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Angelic wings made of pure light - Right Wing */}
      <motion.div
        className="absolute"
        style={{
          right: '10%',
          top: '30%',
          width: '30%',
          height: '40%',
          background: `
            radial-gradient(ellipse 100% 80% at 0% 50%, rgba(255, 255, 255, 0.08) 0%, transparent 60%),
            radial-gradient(ellipse 80% 60% at 10% 50%, rgba(255, 215, 0, 0.05) 0%, transparent 50%)
          `,
          transform: 'perspective(500px) rotateY(20deg)',
        }}
        animate={{
          opacity: [0.1, 0.2, 0.1],
          scaleX: [1, 1.05, 1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Golden ratio spirals faintly glowing */}
      {goldenSpiralPoints.map((point, i) => (
        <motion.div
          key={`spiral-${i}`}
          className="absolute rounded-full"
          style={{
            left: `${point.x}%`,
            top: `${point.y}%`,
            width: point.size,
            height: point.size,
            background: 'rgba(255, 215, 0, 0.4)',
            boxShadow: '0 0 15px 5px rgba(255, 215, 0, 0.3)',
          }}
          animate={{
            opacity: [0.2, 0.5, 0.2],
            scale: [0.8, 1.2, 0.8],
          }}
          transition={{
            duration: 5,
            delay: point.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Holographic chrome reflections */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: `
            linear-gradient(135deg, 
              transparent 0%,
              rgba(255, 215, 0, 0.04) 20%,
              rgba(0, 255, 255, 0.04) 40%,
              rgba(255, 183, 246, 0.04) 60%,
              rgba(148, 0, 211, 0.04) 80%,
              transparent 100%
            )
          `,
          backgroundSize: '400% 400%',
        }}
        animate={{
          backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      {/* Millions of diamond and crystal particles */}
      {diamonds.map((diamond) => (
        <motion.div
          key={diamond.id}
          className="absolute rounded-full"
          style={{
            left: `${diamond.x}%`,
            top: `${diamond.y}%`,
            width: diamond.size,
            height: diamond.size,
            backgroundColor: diamond.color,
            boxShadow: `0 0 ${diamond.size * 5}px ${diamond.size * 1.5}px ${diamond.color}`,
          }}
          animate={{
            opacity: [diamond.opacity * 0.3, diamond.opacity, diamond.opacity * 0.3],
            scale: [0.5, 1.4, 0.5],
          }}
          transition={{
            duration: diamond.duration,
            delay: diamond.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Crystal particles with refraction */}
      {crystals.map((crystal) => (
        <motion.div
          key={`crystal-${crystal.id}`}
          className="absolute"
          style={{
            left: `${crystal.x}%`,
            top: `${crystal.y}%`,
            width: crystal.size,
            height: crystal.size,
          }}
          animate={{
            y: [0, -40, 0],
            x: [0, Math.random() * 20 - 10, 0],
            opacity: [0.1, 0.4, 0.1],
            rotate: [crystal.rotation, crystal.rotation + 180, crystal.rotation + 360],
          }}
          transition={{
            duration: crystal.duration,
            delay: crystal.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <div 
            style={{
              width: '100%',
              height: '100%',
              background: `linear-gradient(45deg, 
                rgba(255, 255, 255, 0.3) 0%, 
                rgba(255, 215, 0, 0.2) 25%, 
                rgba(0, 255, 255, 0.2) 50%, 
                rgba(255, 183, 246, 0.2) 75%, 
                rgba(255, 255, 255, 0.3) 100%)`,
              clipPath: 'polygon(50% 0%, 100% 38%, 81% 100%, 19% 100%, 0% 38%)',
              filter: 'blur(0.3px)',
            }}
          />
        </motion.div>
      ))}

      {/* Sacred heart light bursts */}
      {heartBursts.map((heart) => (
        <motion.div
          key={`heart-${heart.id}`}
          className="absolute"
          style={{
            left: `${heart.x}%`,
            top: `${heart.y}%`,
            fontSize: heart.size,
            color: 'rgba(255, 183, 246, 0.7)',
            textShadow: `
              0 0 ${heart.size}px rgba(255, 183, 246, 0.8), 
              0 0 ${heart.size * 2}px rgba(255, 215, 0, 0.5),
              0 0 ${heart.size * 3}px rgba(255, 183, 246, 0.3)
            `,
          }}
          animate={{
            y: [0, -50, 0],
            x: [0, Math.random() * 25 - 12, 0],
            opacity: [0.2, 0.7, 0.2],
            scale: [0.7, 1.2, 0.7],
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

      {/* Diamond sparkle bursts with prismatic effect */}
      {Array.from({ length: 35 }).map((_, i) => (
        <motion.div
          key={`diamond-burst-${i}`}
          className="absolute"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0, 2, 0],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 2 + Math.random() * 2,
            delay: Math.random() * 10,
            repeat: Infinity,
          }}
        >
          <div 
            className="w-3 h-3"
            style={{
              background: `linear-gradient(45deg, 
                rgba(255, 255, 255, 1) 0%, 
                rgba(255, 215, 0, 1) 20%, 
                rgba(0, 255, 255, 1) 40%,
                rgba(255, 183, 246, 1) 60%,
                rgba(148, 0, 211, 1) 80%,
                rgba(255, 255, 255, 1) 100%)`,
              clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
              filter: 'drop-shadow(0 0 10px rgba(255,215,0,0.9))',
            }}
          />
        </motion.div>
      ))}

      {/* Prismatic light rays from center */}
      {Array.from({ length: 12 }).map((_, i) => (
        <motion.div
          key={`ray-${i}`}
          className="absolute origin-center"
          style={{
            left: '50%',
            top: '50%',
            width: '2px',
            height: '100vh',
            background: `linear-gradient(180deg, 
              transparent 0%, 
              ${chakraColors[i % 7]}33 30%, 
              ${chakraColors[(i + 1) % 7]}22 50%, 
              ${chakraColors[(i + 2) % 7]}33 70%, 
              transparent 100%)`,
            transform: `rotate(${i * 30}deg) translateX(-50%)`,
            transformOrigin: 'top center',
          }}
          animate={{
            opacity: [0.1, 0.3, 0.1],
          }}
          transition={{
            duration: 6 + i * 0.3,
            delay: i * 0.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* 963Hz Pure Love Frequency - Ethereal light trails */}
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div
          key={`trail-${i}`}
          className="absolute rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            width: Math.random() * 4 + 2,
            height: Math.random() * 4 + 2,
            background: `rgba(${
              Math.random() > 0.5 ? '255, 215, 0' : 
              Math.random() > 0.3 ? '255, 255, 255' : 
              '0, 255, 255'
            }, ${Math.random() * 0.5 + 0.3})`,
            filter: 'blur(1px)',
          }}
          animate={{
            x: [0, Math.random() * 100 - 50, 0],
            y: [0, Math.random() * 100 - 50, 0],
            opacity: [0.2, 0.6, 0.2],
          }}
          transition={{
            duration: 15 + Math.random() * 10,
            delay: Math.random() * 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};