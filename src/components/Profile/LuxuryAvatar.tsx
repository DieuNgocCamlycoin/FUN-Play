import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Sparkles, Check, Star, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface LuxuryAvatarProps {
  avatarUrl: string | null;
  displayName: string | null;
  username: string;
  userId: string;
  isOwnProfile: boolean;
  onUpdate?: () => void;
}

export const LuxuryAvatar = ({ 
  avatarUrl, 
  displayName, 
  username, 
  userId, 
  isOwnProfile,
  onUpdate 
}: LuxuryAvatarProps) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState(displayName || "");
  const [editUsername, setEditUsername] = useState(username);
  const [previewAvatar, setPreviewAvatar] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [rippleEffect, setRippleEffect] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Generate more sparkle particles with varied positions
  const sparkles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    delay: i * 0.2,
    duration: 1.5 + Math.random() * 2,
    size: 6 + Math.random() * 10,
    angle: (i * 18) * (Math.PI / 180),
    distance: 70 + Math.random() * 30,
  }));

  // 7-color rainbow gradient
  const rainbowColors = [
    '#FF0000', // Red
    '#FF7F00', // Orange  
    '#FFFF00', // Yellow
    '#00FF00', // Green
    '#00E7FF', // Cyan
    '#4B0082', // Indigo
    '#9400D3', // Violet
  ];

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => setPreviewAvatar(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setRippleEffect(true);
    setSaving(true);
    
    try {
      let newAvatarUrl = avatarUrl;

      if (previewAvatar && fileInputRef.current?.files?.[0]) {
        setUploading(true);
        const file = fileInputRef.current.files[0];
        const fileExt = file.name.split('.').pop();
        const filePath = `${userId}/avatar.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('uploads')
          .upload(filePath, file, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('uploads')
          .getPublicUrl(filePath);

        newAvatarUrl = urlData.publicUrl;
        setUploading(false);
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: editDisplayName,
          username: editUsername,
          avatar_url: newAvatarUrl,
        })
        .eq('id', userId);

      if (error) throw error;

      toast({ title: "✨ Profile updated!", description: "Your changes have been saved" });
      setShowEditModal(false);
      onUpdate?.();
      window.dispatchEvent(new CustomEvent('profile-updated'));
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
      setUploading(false);
      setTimeout(() => setRippleEffect(false), 600);
    }
  };

  return (
    <>
      <div className="relative">
        {/* Outer glow layer */}
        <motion.div
          className="absolute inset-[-16px] rounded-full blur-2xl opacity-70"
          style={{
            background: `conic-gradient(from 0deg, ${rainbowColors.join(', ')}, ${rainbowColors[0]})`,
          }}
          animate={{
            rotate: [0, 360],
            opacity: [0.5, 0.8, 0.5],
            scale: [1, 1.1, 1],
          }}
          transition={{
            rotate: { duration: 10, repeat: Infinity, ease: "linear" },
            opacity: { duration: 3, repeat: Infinity, ease: "easeInOut" },
            scale: { duration: 4, repeat: Infinity, ease: "easeInOut" },
          }}
        />

        {/* Mid glow layer */}
        <motion.div
          className="absolute inset-[-10px] rounded-full blur-lg opacity-60"
          style={{
            background: `conic-gradient(from 180deg, ${rainbowColors.join(', ')}, ${rainbowColors[0]})`,
          }}
          animate={{
            rotate: [360, 0],
            opacity: [0.4, 0.7, 0.4],
          }}
          transition={{
            rotate: { duration: 8, repeat: Infinity, ease: "linear" },
            opacity: { duration: 2.5, repeat: Infinity, ease: "easeInOut" },
          }}
        />

        {/* Rainbow breathing border */}
        <motion.div
          className="absolute inset-[-4px] rounded-full"
          style={{
            background: `conic-gradient(from 0deg, ${rainbowColors.join(', ')}, ${rainbowColors[0]})`,
            padding: '4px',
          }}
          animate={{
            rotate: [0, 360],
            scale: [1, 1.02, 1],
          }}
          transition={{
            rotate: { duration: 6, repeat: Infinity, ease: "linear" },
            scale: { duration: 2, repeat: Infinity, ease: "easeInOut" },
          }}
        >
          <div className="w-full h-full rounded-full bg-background" />
        </motion.div>

        {/* Avatar container - 120dp */}
        <motion.div
          className="relative w-[120px] h-[120px] rounded-full overflow-hidden cursor-pointer z-10 shadow-2xl"
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => isOwnProfile && setShowEditModal(true)}
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt={displayName || username} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[hsl(var(--cosmic-cyan))] via-[hsl(var(--cosmic-magenta))] to-[hsl(var(--cosmic-gold))] flex items-center justify-center text-4xl font-bold text-white">
              {(displayName || username)?.[0]?.toUpperCase()}
            </div>
          )}

          {/* Edit overlay with gradient */}
          {isOwnProfile && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent flex items-center justify-center opacity-0 hover:opacity-100 transition-all duration-300"
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <Camera className="w-10 h-10 text-white drop-shadow-lg" />
              </motion.div>
            </motion.div>
          )}
        </motion.div>

        {/* Sparkle star particles */}
        {sparkles.map((sparkle) => (
          <motion.div
            key={sparkle.id}
            className="absolute pointer-events-none z-20"
            style={{
              width: sparkle.size,
              height: sparkle.size,
              left: '50%',
              top: '50%',
              marginLeft: -sparkle.size / 2,
              marginTop: -sparkle.size / 2,
            }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0, 1, 1, 0],
              scale: [0, 1.2, 1, 0],
              x: [0, Math.cos(sparkle.angle) * sparkle.distance],
              y: [0, Math.sin(sparkle.angle) * sparkle.distance],
            }}
            transition={{
              duration: sparkle.duration,
              repeat: Infinity,
              delay: sparkle.delay,
              ease: "easeOut",
            }}
          >
            <Star 
              className="text-[hsl(var(--cosmic-gold))] drop-shadow-[0_0_8px_rgba(255,215,0,0.8)]" 
              style={{ width: sparkle.size, height: sparkle.size }}
              fill="currentColor"
            />
          </motion.div>
        ))}
      </div>

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="bg-gradient-to-br from-background via-background to-[hsl(var(--cosmic-purple)/0.2)] border-2 border-[hsl(var(--cosmic-gold)/0.5)] shadow-[0_0_50px_rgba(255,215,0,0.2)]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black bg-gradient-to-r from-[hsl(var(--cosmic-gold))] via-[hsl(var(--cosmic-cyan))] to-[hsl(var(--cosmic-magenta))] bg-clip-text text-transparent flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-[hsl(var(--cosmic-gold))]" />
              Edit Profile
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Avatar Upload with circular preview */}
            <div className="flex flex-col items-center gap-4">
              <motion.div 
                className="relative w-28 h-28 rounded-full overflow-hidden"
                whileHover={{ scale: 1.05 }}
              >
                {/* Rainbow border for preview */}
                <motion.div
                  className="absolute inset-[-3px] rounded-full"
                  style={{
                    background: `conic-gradient(from 0deg, ${rainbowColors.join(', ')}, ${rainbowColors[0]})`,
                  }}
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                />
                <div className="absolute inset-[3px] rounded-full overflow-hidden bg-background">
                  <img 
                    src={previewAvatar || avatarUrl || '/placeholder.svg'} 
                    alt="Avatar" 
                    className="w-full h-full object-cover"
                  />
                </div>
              </motion.div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileSelect}
              />
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="border-[hsl(var(--cosmic-cyan))] text-[hsl(var(--cosmic-cyan))] hover:bg-[hsl(var(--cosmic-cyan)/0.1)]"
                >
                  <Image className="w-4 h-4 mr-2" />
                  Gallery
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (fileInputRef.current) {
                      fileInputRef.current.capture = 'user';
                      fileInputRef.current.click();
                    }
                  }}
                  className="border-[hsl(var(--cosmic-magenta))] text-[hsl(var(--cosmic-magenta))] hover:bg-[hsl(var(--cosmic-magenta)/0.1)]"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Camera
                </Button>
              </div>
            </div>

            {/* Display Name */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-[hsl(var(--cosmic-gold))]">Display Name</label>
              <Input
                value={editDisplayName}
                onChange={(e) => setEditDisplayName(e.target.value)}
                placeholder="Your display name"
                className="border-[hsl(var(--cosmic-magenta)/0.5)] focus:border-[hsl(var(--cosmic-gold))] bg-background/50"
              />
            </div>

            {/* Username */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-[hsl(var(--cosmic-gold))]">Username</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
                <Input
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  className="pl-8 border-[hsl(var(--cosmic-magenta)/0.5)] focus:border-[hsl(var(--cosmic-gold))] bg-background/50"
                />
              </div>
            </div>

            {/* Save Button with ripple effect */}
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={handleSave}
                disabled={saving || uploading}
                className="w-full h-14 bg-gradient-to-r from-[hsl(var(--cosmic-gold))] via-[hsl(var(--cosmic-cyan))] to-[hsl(var(--cosmic-magenta))] text-black font-bold text-lg relative overflow-hidden shadow-[0_0_30px_rgba(255,215,0,0.4)]"
              >
                {/* Ripple light effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent"
                  animate={{ x: ['-200%', '200%'] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                />
                
                {/* Ripple on save */}
                <AnimatePresence>
                  {rippleEffect && (
                    <motion.div
                      className="absolute inset-0 bg-white/30"
                      initial={{ scale: 0, opacity: 1 }}
                      animate={{ scale: 3, opacity: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.6 }}
                      style={{ borderRadius: '50%', transformOrigin: 'center' }}
                    />
                  )}
                </AnimatePresence>
                
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {saving ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Sparkles className="w-5 h-5" />
                    </motion.div>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      Save Changes
                    </>
                  )}
                </span>
              </Button>
            </motion.div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
