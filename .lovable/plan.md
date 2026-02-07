

# Hoàn Thiện Tính Năng Đăng Bài Viết Trên Trang Cá Nhân

## Tổng Quan

Nâng cấp hệ thống đăng bài viết để hỗ trợ:
- Upload tối đa 30 ảnh/GIF mỗi bài
- Hiển thị ảnh/GIF trong bài viết trên timeline
- Tự động tạo post khi "Tặng & Thưởng" với GIF celebration
- Chia sẻ bài viết donation lên profile với hiệu ứng đầy đủ

---

## 1. Database Changes

### 1.1 Cập Nhật Bảng `posts`

Thêm cột mới để lưu nhiều ảnh và GIF:

```sql
-- Add images array column for multiple images (max 30)
ALTER TABLE posts ADD COLUMN IF NOT EXISTS images text[] DEFAULT '{}';

-- Add gif_url column for celebration GIFs  
ALTER TABLE posts ADD COLUMN IF NOT EXISTS gif_url text;

-- Add post_type to distinguish manual posts vs donation receipts
ALTER TABLE posts ADD COLUMN IF NOT EXISTS post_type text DEFAULT 'manual';

-- Add donation_transaction_id for linking donation posts
ALTER TABLE posts ADD COLUMN IF NOT EXISTS donation_transaction_id uuid REFERENCES donation_transactions(id);
```

### 1.2 Tạo Storage Bucket Cho Post Images

```sql
-- Create bucket for post images
INSERT INTO storage.buckets (id, name, public)
VALUES ('post-images', 'post-images', true)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for post-images bucket
CREATE POLICY "Anyone can view post images" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'post-images');

CREATE POLICY "Authenticated users can upload post images"
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'post-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete own post images"
ON storage.objects FOR DELETE
USING (bucket_id = 'post-images' AND auth.uid()::text = (storage.foldername(name))[1]);
```

---

## 2. Frontend Components

### 2.1 Cập Nhật ProfilePostsTab.tsx

**Thay đổi chính:**
- Thêm state cho images và GIF picker
- Tích hợp react-dropzone để upload nhiều ảnh (tối đa 30)
- Preview grid cho ảnh đã chọn
- GIF picker (sử dụng GIPHY API hoặc simple GIF library)
- Gọi R2 upload hoặc Supabase Storage

```tsx
// New state
const [selectedImages, setSelectedImages] = useState<File[]>([]);
const [previewUrls, setPreviewUrls] = useState<string[]>([]);
const [selectedGif, setSelectedGif] = useState<string | null>(null);
const [showGifPicker, setShowGifPicker] = useState(false);
const [uploadProgress, setUploadProgress] = useState(0);
```

**UI Layout:**
```text
┌─────────────────────────────────────────────────┐
│ [Avatar] Bạn đang nghĩ gì? Chia sẻ ánh sáng...  │
│ ──────────────────────────────────────────────  │
│                                                 │
│ [Image Grid Preview - tối đa 30 ảnh]            │
│ [X] [X] [X] [X] [X] [X]                        │
│                                                 │
│ [GIF Preview - nếu có]                          │
│ ──────────────────────────────────────────────  │
│ [📷 Ảnh/GIF] [😀 Emoji]           [🚀 Đăng]    │
└─────────────────────────────────────────────────┘
```

### 2.2 Tạo ImageUploadGrid Component

Component mới để handle multiple image upload:

```typescript
interface ImageUploadGridProps {
  images: File[];
  onImagesChange: (images: File[]) => void;
  maxImages?: number; // Default 30
  previewUrls: string[];
}
```

Features:
- Drag & drop support (react-dropzone)
- Grid layout responsive (3 cột mobile, 5 cột desktop)
- Remove individual image
- Image preview với lazy loading
- Progress indicator khi upload

### 2.3 Tạo GifPicker Component

Simple GIF picker với các GIF celebration có sẵn + tìm kiếm:

```typescript
// Pre-loaded celebration GIFs
const CELEBRATION_GIFS = [
  "https://media.giphy.com/media/.../giphy.gif",
  // ... more celebration GIFs
];

interface GifPickerProps {
  onSelect: (gifUrl: string) => void;
  onClose: () => void;
}
```

### 2.4 Cập Nhật PostCard.tsx

Hiển thị images array và GIF trong bài viết:

```tsx
{/* Multiple Images Grid */}
{post.images && post.images.length > 0 && (
  <div className={`grid gap-2 ${
    post.images.length === 1 ? 'grid-cols-1' :
    post.images.length === 2 ? 'grid-cols-2' :
    post.images.length <= 4 ? 'grid-cols-2' : 'grid-cols-3'
  }`}>
    {post.images.slice(0, 6).map((url, i) => (
      <img key={i} src={url} className="rounded-lg object-cover" />
    ))}
    {post.images.length > 6 && (
      <div className="overlay">+{post.images.length - 6} ảnh</div>
    )}
  </div>
)}

{/* GIF Display */}
{post.gif_url && (
  <img src={post.gif_url} alt="GIF" className="w-full rounded-lg" />
)}

{/* Donation Badge for donation posts */}
{post.post_type === 'donation' && (
  <div className="celebration-badge">🎁 Lì xì</div>
)}
```

### 2.5 Cập Nhật PostDetail.tsx

Hiển thị gallery ảnh và GIF trên trang chi tiết:

- Image lightbox khi click vào ảnh
- Full-size GIF playback
- Share button với preview image

---

## 3. Donation Integration

### 3.1 Cập Nhật DonationSuccessOverlay.tsx

Khi chia sẻ lên Profile, thêm celebration GIF:

```tsx
const handleShareToProfile = async () => {
  // Get a random celebration GIF
  const celebrationGifs = [
    "https://media.giphy.com/media/celebration1/giphy.gif",
    "https://media.giphy.com/media/celebration2/giphy.gif",
    // ...
  ];
  const randomGif = celebrationGifs[Math.floor(Math.random() * celebrationGifs.length)];

  const { error } = await supabase.from("posts").insert({
    user_id: sender.id,
    channel_id: channel.id,
    content: postContent,
    gif_url: randomGif,
    post_type: "donation",
    donation_transaction_id: transactionId,
    is_public: true,
  });
};
```

### 3.2 Post Content Template Cho Donation

```text
✨ [Sender Name] vừa tặng [Amount] [Token] cho @[Receiver Username]! 💖

💬 "[Message nếu có]"

🎁 Xem biên nhận: [Receipt Link]

#FUNGift #FUNPlay #LanToaYeuThuong
```

---

## 4. File Upload Logic

### 4.1 Sử Dụng Supabase Storage

Vì đã có hook `useR2Upload`, sẽ tạo thêm function để upload ảnh posts:

```typescript
// In ProfilePostsTab.tsx
const uploadImages = async (files: File[]): Promise<string[]> => {
  const uploadedUrls: string[] = [];
  
  for (const file of files) {
    const fileName = `${user.id}/${Date.now()}-${file.name}`;
    const { data, error } = await supabase.storage
      .from('post-images')
      .upload(fileName, file);
    
    if (!error && data) {
      const { data: { publicUrl } } = supabase.storage
        .from('post-images')
        .getPublicUrl(data.path);
      uploadedUrls.push(publicUrl);
    }
  }
  
  return uploadedUrls;
};
```

### 4.2 Validation

- Tối đa 30 ảnh/bài
- Mỗi ảnh tối đa 10MB
- Chỉ chấp nhận: jpg, jpeg, png, gif, webp
- Hiển thị toast nếu vượt giới hạn

---

## 5. Files Cần Thay Đổi

| File | Thay đổi |
|------|----------|
| **Database Migration** | Thêm cột `images`, `gif_url`, `post_type`, `donation_transaction_id` vào bảng `posts`, tạo bucket `post-images` |
| `src/components/Profile/ProfilePostsTab.tsx` | Thêm image upload, GIF picker, cập nhật logic đăng bài |
| `src/components/Profile/PostCard.tsx` | Hiển thị image gallery, GIF, donation badge |
| `src/pages/PostDetail.tsx` | Hiển thị full gallery với lightbox |
| `src/components/Donate/DonationSuccessOverlay.tsx` | Thêm celebration GIF khi share |
| **NEW:** `src/components/Post/ImageUploadGrid.tsx` | Component upload nhiều ảnh |
| **NEW:** `src/components/Post/GifPicker.tsx` | Component chọn GIF |
| `src/integrations/supabase/types.ts` | Tự động cập nhật sau migration |

---

## 6. Testing Checklist

- [ ] Đăng bài chỉ có text → Hiển thị đúng
- [ ] Đăng bài + 1 ảnh → Hiển thị đúng
- [ ] Đăng bài + nhiều ảnh (2-30) → Grid layout đúng
- [ ] Đăng bài + GIF → GIF autoplay
- [ ] Đăng bài + ảnh + GIF → Hiển thị cả hai
- [ ] "Tặng & Thưởng" → Click "Chia sẻ lên Profile" → Bài viết có GIF celebration
- [ ] Vào PostDetail xem gallery ảnh đầy đủ
- [ ] Mobile responsive hoạt động đúng
- [ ] Upload progress hiển thị đúng

---

## Kết Quả Mong Đợi

| Trước | Sau |
|-------|-----|
| Chỉ đăng text | Đăng text + tối đa 30 ảnh + GIF |
| Nút "Ảnh/GIF" không hoạt động | Click mở picker upload ảnh/GIF |
| Donation share chỉ có text | Donation share có celebration GIF 🎉 |
| PostCard chỉ hiển thị 1 ảnh | PostCard hiển thị image grid + GIF |

