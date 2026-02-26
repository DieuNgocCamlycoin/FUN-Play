import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PostCard } from "./PostCard";
import { ImageUploadGrid } from "@/components/Post/ImageUploadGrid";
import { GifPicker } from "@/components/Post/GifPicker";
import { Image, Smile, Send, Loader2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface ProfilePostsTabProps {
  userId: string;
  isOwnProfile: boolean;
}

interface Post {
  id: string;
  content: string;
  image_url: string | null;
  images: string[] | null;
  gif_url: string | null;
  post_type: string | null;
  created_at: string;
  like_count: number;
  comment_count: number;
  user_id: string;
  profiles?: {
    display_name: string | null;
    username: string;
    avatar_url: string | null;
  };
}

export const ProfilePostsTab = ({ userId, isOwnProfile }: ProfilePostsTabProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPostContent, setNewPostContent] = useState("");
  const [posting, setPosting] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);

  // Image upload state
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // GIF state
  const [selectedGif, setSelectedGif] = useState<string | null>(null);
  const [showGifPicker, setShowGifPicker] = useState(false);

  // Generate preview URLs for selected images
  const previewUrls = useMemo(() => {
    return selectedImages.map((file) => URL.createObjectURL(file));
  }, [selectedImages]);

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  useEffect(() => {
    fetchPosts();
    if (user) {
      fetchUserProfile();
    }
  }, [userId, user]);

  const fetchUserProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("display_name, username, avatar_url")
      .eq("id", user.id)
      .single();
    setUserProfile(data);
  };

  const fetchPosts = async () => {
    try {
      const { data: postsData, error: postsError } = await supabase
        .from("posts")
        .select("*")
        .eq("user_id", userId)
        .eq("is_public", true)
        .order("created_at", { ascending: false });

      if (postsError) throw postsError;
      
      const { data: profileData } = await supabase
        .from("profiles")
        .select("display_name, username, avatar_url")
        .eq("id", userId)
        .single();

      const postsWithProfiles = (postsData || []).map((post) => ({
        ...post,
        profiles: profileData || { display_name: null, username: "user", avatar_url: null },
      }));

      setPosts(postsWithProfiles as Post[]);
    } catch (error: any) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const uploadImages = async (files: File[]): Promise<string[]> => {
    const uploadedUrls: string[] = [];
    const total = files.length;
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileName = `${user!.id}/${Date.now()}-${file.name}`;
      
      const { data, error } = await supabase.storage
        .from("post-images")
        .upload(fileName, file);
      
      if (!error && data) {
        const { data: urlData } = supabase.storage
          .from("post-images")
          .getPublicUrl(data.path);
        uploadedUrls.push(urlData.publicUrl);
      } else {
        console.error("Upload error:", error);
      }
      
      setUploadProgress(Math.round(((i + 1) / total) * 100));
    }
    
    return uploadedUrls;
  };

  const handleCreatePost = async () => {
    if (!user || (!newPostContent.trim() && selectedImages.length === 0 && !selectedGif)) {
      toast({
        title: "Vui lòng nhập nội dung hoặc thêm ảnh/GIF",
        variant: "destructive",
      });
      return;
    }

    setPosting(true);
    setUploadProgress(0);
    
    try {
      // Get user's channel
      const { data: channel } = await supabase
        .from("channels")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!channel) throw new Error("Channel not found");

      // Upload images if any
      let uploadedImageUrls: string[] = [];
      if (selectedImages.length > 0) {
        uploadedImageUrls = await uploadImages(selectedImages);
      }

      // Prepare post data
      const postData: any = {
        user_id: user.id,
        channel_id: channel.id,
        content: newPostContent.trim(),
        is_public: true,
        post_type: "manual",
      };

      // Add images array
      if (uploadedImageUrls.length > 0) {
        postData.images = uploadedImageUrls;
        // Also set image_url for backward compatibility
        postData.image_url = uploadedImageUrls[0];
      }

      // Add GIF
      if (selectedGif) {
        postData.gif_url = selectedGif;
      }

      const { error } = await supabase.from("posts").insert(postData);

      if (error) throw error;

      // Dispatch camly-reward event for FUN mint
      window.dispatchEvent(new CustomEvent("camly-reward", {
        detail: { type: "CREATE_POST", amount: 30, autoApproved: false }
      }));

      toast({
        title: "Đã đăng bài! ✨",
        description: "Lan tỏa ánh sáng yêu thương...",
      });

      // Reset form
      setNewPostContent("");
      setSelectedImages([]);
      setSelectedGif(null);
      setUploadProgress(0);
      fetchPosts();
    } catch (error: any) {
      console.error("Post error:", error);
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setPosting(false);
    }
  };

  const handleSelectGif = (gifUrl: string) => {
    setSelectedGif(gifUrl);
    setShowGifPicker(false);
  };

  const canPost = newPostContent.trim() || selectedImages.length > 0 || selectedGif;

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-4 animate-pulse">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-1/4" />
                <div className="h-16 bg-muted rounded" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Create Post Box - Only show on own profile */}
      {isOwnProfile && user && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="p-4 border-2 border-[hsl(var(--cosmic-cyan))]/20 bg-gradient-to-br from-white to-[hsl(var(--cosmic-cyan))]/5 dark:from-card dark:to-[hsl(var(--cosmic-cyan))]/5">
            <div className="flex gap-3">
              <Avatar className="w-10 h-10">
                <AvatarImage src={userProfile?.avatar_url} />
                <AvatarFallback className="bg-gradient-to-br from-[hsl(var(--cosmic-cyan))] to-[hsl(var(--cosmic-magenta))] text-white">
                  {userProfile?.display_name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-3">
                <Textarea
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder="Bạn đang nghĩ gì? Chia sẻ ánh sáng... ✨"
                  className="min-h-[80px] resize-none border-[hsl(var(--cosmic-cyan))]/30 focus:border-[hsl(var(--cosmic-cyan))] bg-white/50 dark:bg-background/50"
                />

                {/* Image Preview Grid */}
                {selectedImages.length > 0 && (
                  <ImageUploadGrid
                    images={selectedImages}
                    onImagesChange={setSelectedImages}
                    previewUrls={previewUrls}
                    maxImages={30}
                    disabled={posting}
                  />
                )}

                {/* GIF Preview */}
                {selectedGif && (
                  <div className="relative inline-block">
                    <img
                      src={selectedGif}
                      alt="Selected GIF"
                      className="max-h-40 rounded-lg border border-border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6"
                      onClick={() => setSelectedGif(null)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}

                {/* Upload Progress */}
                {posting && uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-[hsl(var(--cosmic-cyan))] h-2 rounded-full transition-all"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex gap-1">
                    {/* Image/GIF Button */}
                    <Popover open={showGifPicker} onOpenChange={setShowGifPicker}>
                      <PopoverTrigger asChild>
                        <Button 
                          type="button"
                          variant="ghost" 
                          size="sm" 
                          className="text-muted-foreground hover:text-[hsl(var(--cosmic-cyan))]"
                          disabled={posting}
                        >
                          <Image className="w-4 h-4 mr-1" />
                          Ảnh/GIF
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <div className="p-2 space-y-2">
                          {/* Upload Images Button */}
                          <label className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted cursor-pointer transition-colors">
                            <Image className="w-4 h-4" />
                            <span className="text-sm">Tải ảnh lên</span>
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files) {
                                  const files = Array.from(e.target.files);
                                  const remaining = 30 - selectedImages.length;
                                  setSelectedImages((prev) => [
                                    ...prev,
                                    ...files.slice(0, remaining),
                                  ]);
                                }
                                setShowGifPicker(false);
                              }}
                              disabled={posting || selectedImages.length >= 30}
                            />
                          </label>
                          <div className="border-t border-border" />
                          {/* GIF Picker */}
                          <GifPicker
                            onSelect={handleSelectGif}
                            onClose={() => setShowGifPicker(false)}
                          />
                        </div>
                      </PopoverContent>
                    </Popover>

                    {/* Emoji Button (placeholder) */}
                    <Button 
                      type="button"
                      variant="ghost" 
                      size="sm" 
                      className="text-muted-foreground"
                      disabled={posting}
                    >
                      <Smile className="w-4 h-4 mr-1" />
                      Emoji
                    </Button>
                  </div>

                  {/* Post Button */}
                  <Button
                    onClick={handleCreatePost}
                    disabled={!canPost || posting}
                    className="bg-gradient-to-r from-[hsl(var(--cosmic-cyan))] to-[hsl(var(--cosmic-magenta))] text-white rounded-full px-6"
                  >
                    {posting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Đăng
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Posts List */}
      <AnimatePresence>
        {posts.length > 0 ? (
          <div className="space-y-4">
            {posts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <PostCard post={post} onUpdate={fetchPosts} />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-[hsl(var(--cosmic-cyan))]/20 to-[hsl(var(--cosmic-magenta))]/20 flex items-center justify-center">
              <Send className="w-8 h-8 text-muted-foreground/50" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Chưa có bài viết</h3>
            <p className="text-muted-foreground text-sm">
              {isOwnProfile
                ? "Hãy chia sẻ suy nghĩ đầu tiên của bạn!"
                : "Người dùng này chưa đăng bài viết nào."}
            </p>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
