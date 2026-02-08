import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Layout/Header";
import { Sidebar } from "@/components/Layout/Sidebar";
import { SunoModeForm } from "@/components/AIMusic/SunoModeForm";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Music, Sparkles, ListMusic } from "lucide-react";
import { motion } from "framer-motion";

export default function CreateMusic() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const particles = Array.from({ length: 15 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    delay: Math.random() * 5,
    duration: 3 + Math.random() * 4,
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-cyan-50/30 to-amber-50/30 relative overflow-hidden">
      {/* Floating particles */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute w-2 h-2 rounded-full bg-gradient-to-r from-cyan-400 to-amber-400"
            style={{ left: `${particle.x}%`, top: `${particle.y}%` }}
            animate={{ y: [0, -100, 0], opacity: [0.2, 0.8, 0.2], scale: [0.5, 1, 0.5] }}
            transition={{ duration: particle.duration, delay: particle.delay, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}
      </div>

      {/* Twinkling stars */}
      <div className="fixed inset-0 pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={`star-${i}`}
            className="absolute w-1 h-1 bg-amber-300 rounded-full"
            style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
            animate={{ opacity: [0, 1, 0], scale: [0.5, 1.5, 0.5] }}
            transition={{ duration: 2 + Math.random() * 2, delay: Math.random() * 3, repeat: Infinity }}
          />
        ))}
      </div>

      <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="pt-12 lg:pt-14 lg:pl-64">
        <div className="max-w-2xl mx-auto p-6">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="relative">
                <Music className="w-12 h-12 text-cyan-500" />
                <motion.div className="absolute -top-1 -right-1" animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }}>
                  <Sparkles className="w-5 h-5 text-amber-400" />
                </motion.div>
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-500 via-purple-500 to-amber-500 bg-clip-text text-transparent">
                Tạo Nhạc Ánh Sáng
              </h1>
            </div>
            <p className="text-muted-foreground text-lg">Biến ý tưởng của bạn thành âm nhạc thần kỳ với AI ✨</p>
          </motion.div>

          {/* Quick link to My AI Music */}
          {user && (
            <div className="flex justify-end mb-4">
              <Button variant="outline" size="sm" onClick={() => navigate("/my-ai-music")}>
                <ListMusic className="w-4 h-4 mr-2" /> Nhạc AI của tôi
              </Button>
            </div>
          )}

          {/* Form */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-cyan-100">
            {user ? (
              <SunoModeForm />
            ) : (
              <div className="text-center py-12">
                <Music className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
                <p className="text-muted-foreground">Vui lòng đăng nhập để tạo nhạc AI</p>
              </div>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
}