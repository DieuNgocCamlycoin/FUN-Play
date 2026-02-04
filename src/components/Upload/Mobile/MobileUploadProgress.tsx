import { motion } from "framer-motion";
import { Upload, Sparkles } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface MobileUploadProgressProps {
  progress: number;
  stage: string;
}

export function MobileUploadProgress({ progress, stage }: MobileUploadProgressProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-full p-6 text-center">
      {/* Animated Upload Icon - Simplified for performance */}
      <motion.div
        animate={{
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="relative mb-8"
      >
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[hsl(var(--cosmic-cyan)/0.3)] via-[hsl(var(--cosmic-magenta)/0.3)] to-[hsl(var(--cosmic-gold)/0.3)] flex items-center justify-center will-change-transform">
          <Upload className="w-12 h-12 text-[hsl(var(--cosmic-cyan))]" />
        </div>

        {/* Orbiting sparkle - simplified animation */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 will-change-transform"
        >
          <Sparkles className="absolute -top-2 right-0 w-6 h-6 text-[hsl(var(--cosmic-gold))]" />
        </motion.div>
      </motion.div>

      {/* Progress Bar */}
      <div className="w-full max-w-xs mb-6">
        <Progress 
          value={progress} 
          className="h-2 bg-muted/50" 
        />
        <p className="text-2xl font-bold mt-4 bg-gradient-to-r from-[hsl(var(--cosmic-cyan))] to-[hsl(var(--cosmic-magenta))] bg-clip-text text-transparent">
          {progress}%
        </p>
      </div>

      {/* Stage Text - Faster transition */}
      <motion.p
        key={stage}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15 }}
        className="text-muted-foreground"
      >
        {stage}
      </motion.p>

      {/* Fun message */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="text-sm text-muted-foreground/70 mt-8"
      >
        Ánh sáng của bạn đang được lan tỏa... ✨
      </motion.p>
    </div>
  );
}
