import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Sparkles, Check, X } from "lucide-react";
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Generate sparkle particles
  const sparkles = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    delay: i * 0.3,
    duration: 2 + Math.random() * 2,
    size: 4 + Math.random() * 8,
    angle: (i * 30) * (Math.PI / 180),
  }));

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview
    const reader = new FileReader();
    reader.onload = (e) => setPreviewAvatar(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let newAvatarUrl = avatarUrl;

      // Upload new avatar if selected
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

      // Update profile
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: editDisplayName,
          username: editUsername,
          avatar_url: newAvatarUrl,
        })
        .eq('id', userId);

      if (error) throw error;

      toast({ title: "Profile updated!", description: "Your changes have been saved" });
      setShowEditModal(false);
      onUpdate?.();
      window.dispatchEvent(new CustomEvent('profile-updated'));
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  return (
    <>
      <div className="relative">
        {/* Rainbow breathing border */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: 'conic-gradient(from 0deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3, #ff0000)',
            padding: '4px',
          }}
          animate={{
            rotate: [0, 360],
            scale: [1, 1.05, 1],
          }}
          transition={{
            rotate: { duration: 8, repeat: Infinity, ease: "linear" },
            scale: { duration: 3, repeat: Infinity, ease: "easeInOut" },
          }}
        >
          <div className="w-full h-full rounded-full bg-background" />
        </motion.div>

        {/* Glow effect */}
        <motion.div
          className="absolute inset-[-8px] rounded-full opacity-60 blur-xl"
          style={{
            background: 'conic-gradient(from 0deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3, #ff0000)',
          }}
          animate={{
            rotate: [0, 360],
            opacity: [0.4, 0.7, 0.4],
          }}
          transition={{
            rotate: { duration: 8, repeat: Infinity, ease: "linear" },
            opacity: { duration: 2, repeat: Infinity, ease: "easeInOut" },
          }}
        />

        {/* Avatar container */}
        <motion.div
          className="relative w-[120px] h-[120px] rounded-full overflow-hidden cursor-pointer z-10"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => isOwnProfile && setShowEditModal(true)}
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt={displayName || username} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[hsl(var(--cosmic-cyan))] to-[hsl(var(--cosmic-magenta))] flex items-center justify-center text-4xl font-bold text-white">
              {(displayName || username)?.[0]?.toUpperCase()}
            </div>
          )}

          {/* Edit overlay */}
          {isOwnProfile && (
            <motion.div
              className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
            >
              <Camera className="w-8 h-8 text-white" />
            </motion.div>
          )}
        </motion.div>

        {/* Sparkle particles */}
        {sparkles.map((sparkle) => (
          <motion.div
            key={sparkle.id}
            className="absolute pointer-events-none"
            style={{
              width: sparkle.size,
              height: sparkle.size,
              left: '50%',
              top: '50%',
            }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
              x: [0, Math.cos(sparkle.angle) * 80],
              y: [0, Math.sin(sparkle.angle) * 80],
            }}
            transition={{
              duration: sparkle.duration,
              repeat: Infinity,
              delay: sparkle.delay,
              ease: "easeOut",
            }}
          >
            <Sparkles className="text-[hsl(var(--cosmic-gold))]" style={{ width: sparkle.size, height: sparkle.size }} />
          </motion.div>
        ))}
      </div>

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="bg-gradient-to-br from-background via-background to-[hsl(var(--cosmic-purple)/0.1)] border-2 border-[hsl(var(--cosmic-cyan)/0.5)]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black bg-gradient-to-r from-[hsl(var(--cosmic-cyan))] to-[hsl(var(--cosmic-magenta))] bg-clip-text text-transparent">
              Edit Profile
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Avatar Upload */}
            <div className="flex flex-col items-center gap-4">
              <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-[hsl(var(--cosmic-gold))]">
                <img 
                  src={previewAvatar || avatarUrl || '/placeholder.svg'} 
                  alt="Avatar" 
                  className="w-full h-full object-cover"
                />
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="border-[hsl(var(--cosmic-cyan))] text-[hsl(var(--cosmic-cyan))]"
              >
                <Camera className="w-4 h-4 mr-2" />
                Change Photo
              </Button>
            </div>

            {/* Display Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Display Name</label>
              <Input
                value={editDisplayName}
                onChange={(e) => setEditDisplayName(e.target.value)}
                className="border-[hsl(var(--cosmic-magenta)/0.5)] focus:border-[hsl(var(--cosmic-magenta))]"
              />
            </div>

            {/* Username */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Username</label>
              <Input
                value={editUsername}
                onChange={(e) => setEditUsername(e.target.value)}
                className="border-[hsl(var(--cosmic-magenta)/0.5)] focus:border-[hsl(var(--cosmic-magenta))]"
              />
            </div>

            {/* Save Button */}
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={handleSave}
                disabled={saving || uploading}
                className="w-full h-12 bg-gradient-to-r from-[hsl(var(--cosmic-gold))] to-[hsl(var(--cosmic-cyan))] text-black font-bold text-lg relative overflow-hidden"
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <span className="relative z-10 flex items-center gap-2">
                  {saving ? 'Saving...' : (
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
