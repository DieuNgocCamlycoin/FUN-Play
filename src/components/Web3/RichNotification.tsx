import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { supabase } from "@/integrations/supabase/client";

interface RichNotificationProps {
  show: boolean;
  amount: string;
  token: string;
  count: number;
  onClose: () => void;
  userId?: string;
}

export const RichNotification = ({ show, amount, token, count, onClose, userId }: RichNotificationProps) => {
  const [musicUrl, setMusicUrl] = useState<string | null>(null);

  // Fetch user's custom music URL
  useEffect(() => {
    const fetchMusicUrl = async () => {
      if (userId) {
        const { data } = await supabase
          .from("profiles")
          .select("music_url")
          .eq("id", userId)
          .single();
        
        if (data?.music_url) {
          setMusicUrl(data.music_url);
        }
      }
    };
    
    fetchMusicUrl();
  }, [userId]);

  useEffect(() => {
    if (show) {
      // Play custom Suno music if available
      let audio: HTMLAudioElement | null = null;
      if (musicUrl) {
        audio = new Audio(musicUrl);
        audio.volume = 0.7;
        audio.play().catch(err => console.error("Error playing music:", err));
      }

      // Play cute baby Aliens Angel voice saying "RICH RICH RICH"
      const speakNotification = () => {
        // Get voice settings from localStorage
        const voiceGender = localStorage.getItem("voiceGender") || "female";
        const voicePitch = localStorage.getItem("voicePitch") || "high";
        
        const utterance = new SpeechSynthesisUtterance("RICH RICH RICH");
        
        // Set pitch based on user preference
        if (voicePitch === "high") {
          utterance.pitch = 2.0;
        } else if (voicePitch === "medium") {
          utterance.pitch = 1.5;
        } else {
          utterance.pitch = 1.0;
        }
        
        utterance.rate = 0.9; // Slightly slower for cuteness
        utterance.volume = 1;
        utterance.lang = 'en-US'; // English for "RICH"
        
        // Try to select voice based on gender preference
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          const preferredVoice = voices.find(voice => 
            voiceGender === "female" 
              ? voice.name.toLowerCase().includes("female") || voice.name.toLowerCase().includes("samantha")
              : voice.name.toLowerCase().includes("male") || voice.name.toLowerCase().includes("alex")
          );
          if (preferredVoice) {
            utterance.voice = preferredVoice;
          }
        }
        
        window.speechSynthesis.speak(utterance);
      };
      
      // Wait for voices to load if not already loaded
      if (window.speechSynthesis.getVoices().length === 0) {
        window.speechSynthesis.onvoiceschanged = () => {
          speakNotification();
        };
      } else {
        speakNotification();
      }

      // Trigger massive confetti celebration
      const duration = 5000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

      const randomInRange = (min: number, max: number) => {
        return Math.random() * (max - min) + min;
      };

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);

        // Golden confetti from left
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
          colors: ['#FFD700', '#FFA500', '#FFFF00', '#FF6347'],
        });

        // Golden confetti from right
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
          colors: ['#FFD700', '#FFA500', '#FFFF00', '#FF6347'],
        });

        // Sparkles from center
        confetti({
          ...defaults,
          particleCount: particleCount / 2,
          origin: { x: 0.5, y: 0.5 },
          colors: ['#FFFFFF', '#FFD700', '#00FF00'],
          shapes: ['star'],
        });
      }, 250);

      const timer = setTimeout(() => {
        clearInterval(interval);
        if (audio) {
          audio.pause();
          audio.currentTime = 0;
        }
        onClose();
      }, 6000);

      return () => {
        clearTimeout(timer);
        clearInterval(interval);
        if (audio) {
          audio.pause();
          audio.currentTime = 0;
        }
      };
    }
  }, [show, onClose, musicUrl]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.5 }}
          animate={{ 
            opacity: 1, 
            y: 0, 
            scale: 1,
          }}
          exit={{ opacity: 0, y: -50, scale: 0.5 }}
          className="fixed top-24 right-4 z-50 p-4 rounded-2xl shadow-2xl overflow-hidden flex items-center gap-3"
          style={{
            background: "white",
            border: "4px solid transparent",
            backgroundImage: "linear-gradient(white, white), linear-gradient(135deg, #FF0000, #FF7F00, #FFFF00, #00FF00, #00FFFF, #0000FF, #9400D3)",
            backgroundOrigin: "border-box",
            backgroundClip: "padding-box, border-box",
            boxShadow: "0 0 60px rgba(255, 0, 0, 0.7), 0 0 80px rgba(255, 127, 0, 0.6), 0 0 100px rgba(255, 255, 0, 0.5), 0 0 120px rgba(0, 255, 0, 0.4), 0 0 140px rgba(0, 0, 255, 0.3)",
          }}
        >
          {/* Pulsing Rainbow CAMLY Coin Icon */}
          <motion.img
            src="/images/camly-coin.png"
            alt="CAMLY COIN"
            className="w-12 h-12 rounded-full relative z-10"
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 360],
              filter: [
                "drop-shadow(0 0 20px rgba(255, 0, 0, 0.8)) drop-shadow(0 0 40px rgba(255, 127, 0, 0.6))",
                "drop-shadow(0 0 20px rgba(255, 255, 0, 0.8)) drop-shadow(0 0 40px rgba(0, 255, 0, 0.6))",
                "drop-shadow(0 0 20px rgba(0, 255, 255, 0.8)) drop-shadow(0 0 40px rgba(0, 0, 255, 0.6))",
                "drop-shadow(0 0 20px rgba(255, 0, 255, 0.8)) drop-shadow(0 0 40px rgba(255, 0, 0, 0.6))",
              ],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{
              boxShadow: "0 0 40px rgba(255, 215, 0, 1), 0 0 80px rgba(255, 165, 0, 0.8), 0 0 120px rgba(255, 255, 0, 0.6)",
            }}
          />
          
          <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 relative z-10">
            <motion.span
              animate={{
                scale: [1, 1.2, 1],
                textShadow: [
                  "0 0 20px #00FF7F, 0 0 40px #00E676, 0 0 60px #00C853",
                  "0 0 30px #00FF7F, 0 0 60px #00E676, 0 0 90px #00C853",
                  "0 0 20px #00FF7F, 0 0 40px #00E676, 0 0 60px #00C853",
                ],
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="font-black text-3xl"
              style={{
                background: "linear-gradient(135deg, #00FF7F 0%, #00E676 50%, #00C853 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                fontWeight: 900,
                textShadow: "0 0 20px #00FF7F, 0 0 40px #00E676, 0 4px 8px rgba(0,0,0,0.3)",
                filter: "drop-shadow(0 0 30px rgba(0, 255, 127, 0.8))",
              }}
            >
              RICH
            </motion.span>
            <motion.span
              animate={{
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="font-black text-xl"
              style={{
                background: "linear-gradient(135deg, #00FF7F 0%, #00E676 50%, #00C853 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                fontWeight: 900,
                textShadow: "0 0 15px #00FF7F, 0 0 30px #00E676, 0 4px 6px rgba(0,0,0,0.3)",
                filter: "drop-shadow(0 0 20px rgba(0, 255, 127, 0.7))",
              }}
            >
              +{parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} {token}
            </motion.span>
          </div>
          
          <motion.p
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xs font-bold mt-1 relative z-10"
            style={{
              background: "linear-gradient(135deg, #00FF7F 0%, #00E676 50%, #00C853 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              fontWeight: 900,
              textShadow: "0 0 10px #00FF7F, 0 0 20px #00E676, 0 2px 4px rgba(0,0,0,0.3)",
            }}
          >
            💰 Chúc mừng! Bạn vừa nhận được tiền! 💎
          </motion.p>
          </div>
          
          {/* Golden Fireworks effects */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
            {[...Array(12)].map((_, i) => {
              const angle = (i / 12) * Math.PI * 2;
              const distance = 40 + Math.random() * 20;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
              animate={{
                opacity: [0, 1, 1, 0],
                scale: [0, 1.5, 1, 0],
                x: [0, Math.cos(angle) * distance],
                y: [0, Math.sin(angle) * distance],
                background: [
                  "#FF0000", // Red
                  "#FF7F00", // Orange
                  "#FFFF00", // Yellow
                  "#00FF00", // Green
                  "#00FFFF", // Cyan
                  "#0000FF", // Blue
                  "#9400D3", // Violet
                  "#FF0000", // Back to Red
                ],
              }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.05,
                    ease: "easeOut",
                  }}
              className="absolute w-2 h-2 rounded-full"
              style={{
                left: '50%',
                top: '50%',
                boxShadow: "0 0 20px currentColor, 0 0 40px currentColor",
              }}
                />
              );
            })}
            {/* Diamond sparkles */}
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={`diamond-${i}`}
                initial={{ opacity: 0, scale: 0 }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0, 1.2, 0],
                  x: [0, Math.random() * 60 - 30],
                  y: [0, Math.random() * 60 - 30],
                  rotate: [0, 360],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.15,
                  ease: "easeOut",
                }}
                className="absolute w-1.5 h-1.5"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  background: '#FFFFFF',
                  clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
                  boxShadow: "0 0 10px #FFD700, 0 0 20px #FFFFFF",
                }}
              />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
