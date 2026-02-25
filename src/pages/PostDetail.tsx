import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { MainLayout } from '@/components/Layout/MainLayout';
import { PostComments } from '@/components/Post/PostComments';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Calendar, Heart, MessageCircle, Share2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { toast } from '@/hooks/use-toast';
import { getPostShareUrl } from '@/lib/postNavigation';
import { copyToClipboard, getShareUrl } from '@/lib/shareUtils';
import { PostJsonLd } from '@/components/SEO/PostJsonLd';

interface PostProfile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface Post {
  id: string;
  content: string;
  image_url: string | null;
  images: string[] | null;
  gif_url: string | null;
  post_type: string | null;
  like_count: number;
  comment_count: number;
  created_at: string;
  updated_at: string;
  user_id: string;
  channel_id: string;
  slug: string | null;
  profile?: PostProfile;
}

interface PostDetailProps {
  postIdProp?: string;
}

const PostDetail: React.FC<PostDetailProps> = ({ postIdProp }) => {
  const { id: paramId } = useParams<{ id: string }>();
  const id = postIdProp || paramId;
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [commentCount, setCommentCount] = useState(0);

  useEffect(() => {
    const fetchPost = async () => {
      if (!id) return;

      try {
        const { data: postData, error: postError } = await supabase
          .from('posts')
          .select('*')
          .eq('id', id)
          .single();

        if (postError) throw postError;

        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, username, display_name, avatar_url')
          .eq('id', postData.user_id)
          .single();

        if (profileError) {
          console.error('Error fetching profile:', profileError);
        }

        setPost({
          ...postData,
          profile: profileData || undefined
        });
        setCommentCount(postData.comment_count || 0);
      } catch (error) {
        console.error('Error fetching post:', error);
        toast({
          title: "Lỗi",
          description: "Không thể tải bài đăng",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id]);

  const handleShare = async () => {
    const username = post?.profile?.username;
    const slug = post?.slug;
    const url = username && slug
      ? getPostShareUrl(username, slug)
      : getShareUrl(`/post/${id}`);
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Bài đăng trên FUN Play',
          text: post?.content.slice(0, 100) + '...',
          url
        });
      } catch {
        // User cancelled
      }
    } else {
      const success = await copyToClipboard(url);
      toast({
        title: success ? "Đã sao chép" : "Lỗi",
        description: success ? "Link bài đăng đã được sao chép" : "Không thể sao chép link",
        variant: success ? "default" : "destructive"
      });
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="max-w-2xl mx-auto p-4 space-y-6">
          <Skeleton className="h-8 w-24" />
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full rounded-lg" />
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!post) {
    return (
      <MainLayout>
        <div className="max-w-2xl mx-auto p-4">
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold mb-2">Không tìm thấy bài đăng</h2>
            <p className="text-muted-foreground mb-4">Bài đăng có thể đã bị xóa hoặc không tồn tại</p>
            <Button onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  const authorName = post.profile?.display_name || post.profile?.username || 'Người dùng';
  const authorAvatar = post.profile?.avatar_url;
  const headline = post.content.replace(/[\n\r]+/g, ' ').slice(0, 80);
  const firstImage = post.images?.[0] || post.image_url || post.gif_url;

  return (
    <MainLayout>
      {/* SEO: JSON-LD structured data */}
      {post.profile?.username && post.slug && (
        <PostJsonLd
          headline={headline}
          authorName={authorName}
          authorUsername={post.profile.username}
          datePublished={post.created_at}
          dateModified={post.updated_at}
          imageUrl={firstImage}
          slug={post.slug}
          description={post.content.slice(0, 160)}
        />
      )}

      <div className="max-w-2xl mx-auto p-4">
        {/* Back button */}
        <Button
          variant="ghost"
          size="sm"
          className="mb-4"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Quay lại
        </Button>

        <motion.article
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl border border-border/50 overflow-hidden"
        >
          {/* Author info */}
          <div className="p-4 border-b border-border/50">
            <div className="flex items-center gap-3">
              <Link to={`/${post.profile?.username || post.channel_id}`}>
                <Avatar className="h-12 w-12">
                  <AvatarImage src={authorAvatar || undefined} alt={authorName} />
                  <AvatarFallback className="bg-primary/20 text-primary">
                    {authorName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Link>
              <div className="flex-1 min-w-0">
                <Link 
                  to={`/${post.profile?.username || post.channel_id}`}
                  className="font-semibold hover:text-primary transition-colors"
                >
                  {authorName}
                </Link>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>
                    {formatDistanceToNow(new Date(post.created_at), {
                      addSuffix: true,
                      locale: vi
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            <p className="text-foreground whitespace-pre-wrap break-words leading-relaxed">
              {post.content}
            </p>
          </div>

          {/* Images Gallery */}
          {post.images && post.images.length > 0 && (
            <div className="px-4 pb-4">
              <div className={`grid gap-2 ${
                post.images.length === 1 ? 'grid-cols-1' :
                post.images.length === 2 ? 'grid-cols-2' :
                'grid-cols-2 sm:grid-cols-3'
              }`}>
                {post.images.map((url, index) => (
                  <img
                    key={index}
                    src={url}
                    alt={`Post image ${index + 1}`}
                    className={`w-full rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity ${
                      post.images!.length === 1 ? 'max-h-[500px]' : 'aspect-square'
                    }`}
                    loading="lazy"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Legacy single image support */}
          {!post.images?.length && post.image_url && (
            <div className="px-4 pb-4">
              <img
                src={post.image_url}
                alt="Post image"
                className="w-full rounded-lg object-cover max-h-[500px]"
                loading="lazy"
              />
            </div>
          )}

          {/* GIF Display */}
          {post.gif_url && (
            <div className="px-4 pb-4">
              <img
                src={post.gif_url}
                alt="GIF"
                className="w-full rounded-lg object-contain max-h-[400px] bg-muted/30"
                loading="lazy"
              />
            </div>
          )}

          {/* Stats & Actions */}
          <div className="px-4 py-3 border-t border-border/50 flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Heart className="h-4 w-4" />
                {post.like_count || 0}
              </span>
              <span className="flex items-center gap-1">
                <MessageCircle className="h-4 w-4" />
                {commentCount}
              </span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-2" />
              Chia sẻ
            </Button>
          </div>
        </motion.article>

        {/* Comments Section */}
        <div className="mt-6 bg-card rounded-xl border border-border/50 p-4">
          <PostComments
            postId={post.id}
            onCommentCountChange={setCommentCount}
          />
        </div>
      </div>
    </MainLayout>
  );
};

export default PostDetail;
