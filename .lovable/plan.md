

## Thêm tính năng chọn/tạo playlist khi đăng video

### Tổng quan
Tích hợp playlist selector (chọn playlist hiện có + tạo playlist mới) vào cả Desktop Upload Wizard và Mobile Upload Flow, tương tự YouTube. Tận dụng logic từ `AddToPlaylistModal` có sẵn.

### File thay đổi

| File | Thay đổi |
|---|---|
| `src/components/Upload/PlaylistSelector.tsx` | **Mới** -- Component chọn/tạo playlist, tái sử dụng từ pattern `AddToPlaylistModal` |
| `src/components/Upload/UploadMetadataForm.tsx` | Thêm `playlistIds` vào `VideoMetadata`, thêm section PlaylistSelector sau Tags |
| `src/components/Upload/Mobile/VideoDetailsForm.tsx` | Thêm menu item "Danh sách phát" mở PlaylistSelector |
| `src/components/Upload/UploadWizard.tsx` | Thêm `playlistIds: []` vào initial metadata state |
| `src/components/Upload/Mobile/MobileUploadFlow.tsx` | Thêm `playlistIds: []` vào metadata, thêm sub-page playlist |
| `src/contexts/UploadContext.tsx` | Thêm `playlistIds` vào metadata type, insert vào `playlist_videos` sau khi tạo video |

### Chi tiết

#### 1. PlaylistSelector component
- Fetch playlists của user từ bảng `playlists` (dùng `useAuth` + supabase query)
- Hiển thị checkbox list với tên + icon public/private
- Phần "Tạo danh sách phát mới" ở cuối: input + nút Tạo (insert vào bảng `playlists`, tự động check)
- Props: `selectedIds: string[]`, `onChange: (ids: string[]) => void`
- Style theo Design System (aurora gradient, cosmic colors)

#### 2. Desktop (UploadMetadataForm)
- Thêm `playlistIds: string[]` vào interface `VideoMetadata`
- Thêm section "Danh sách phát" sau phần Tags, chứa `PlaylistSelector`

#### 3. Mobile (VideoDetailsForm + MobileUploadFlow)
- Thêm menu item "Danh sách phát" (icon `ListVideo`) vào `menuItems` trong `VideoDetailsForm`
- Click mở sub-page chứa `PlaylistSelector` (tương tự visibility/description sub-pages)
- Thêm `playlistIds` vào metadata state trong `MobileUploadFlow`

#### 4. Upload Context
- Sau khi insert video thành công, nếu `playlistIds.length > 0`, insert vào `playlist_videos`:
```typescript
const inserts = metadata.playlistIds.map(pid => ({
  playlist_id: pid,
  video_id: videoData.id,
  position: 0,
}));
await supabase.from("playlist_videos").insert(inserts);
```

### Không cần migration
Bảng `playlists` và `playlist_videos` đã có sẵn với RLS policies đầy đủ. Hook `usePlaylistOperations` cũng đã tồn tại.
