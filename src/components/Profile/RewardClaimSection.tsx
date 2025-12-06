import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, Sparkles, CheckCircle2, Copy, ExternalLink, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CounterAnimation } from "@/components/Layout/CounterAnimation";
import confetti from "canvas-confetti";

interface RewardClaimSectionProps {
  userId: string;
  isOwnProfile?: boolean;
}

export const RewardClaimSection = ({ userId, isOwnProfile = false }: RewardClaimSectionProps) => {
  // This component is now hidden since stats are compact in GlassmorphismStats
  return null;
};
