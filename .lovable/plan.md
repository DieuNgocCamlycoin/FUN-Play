

## Thêm thao tác Xóa & Sửa tên playlist trong tab Playlist (giống YouTube)

### Mục tiêu
Thêm menu 3 chấm (MoreVertical) trên mỗi playlist card trong tab Playlist của trang kênh, cho phép chủ sở hữu sửa tên và xóa playlist ngay tại chỗ.

### Thay đổi

| File | Nội dung |
|---|---|
| `src/components/Profile/ProfilePlaylistsTab.tsx` | Thêm DropdownMenu với 2 hành động "Sửa" và "Xóa" trên mỗi playlist card (chỉ hiện khi `isOwnProfile`). Tích hợp `EditPlaylistModal` và `AlertDialog` xác nhận xóa. |

### Chi tiết kỹ thuật

1. **Menu 3 chấm trên mỗi card**: Thêm icon `MoreVertical` ở góc trên bên phải mỗi playlist card, chỉ hiển thị khi hover (giống YouTube). Menu gồm:
   - **Sửa playlist** (icon Pencil): Mở `EditPlaylistModal` đã có sẵn tại `src/components/Playlist/EditPlaylistModal.tsx`
   - **Xóa playlist** (icon Trash2, màu đỏ): Hiện AlertDialog xác nhận, sau đó gọi `supabase.from("playlists").delete().eq("id", playlistId)`

2. **Import thêm**: `MoreVertical`, `Pencil`, `Trash2` từ lucide-react; `DropdownMenu` components; `AlertDialog` components; `EditPlaylistModal`

3. **State mới**:
   - `editingPlaylist`: playlist đang sửa (hoặc null)
   - `deletePlaylistId`: id playlist đang xác nhận xóa (hoặc null)

4. **Xóa playlist**: Gọi supabase delete, sau đó cập nhật state local bằng `setPlaylists(prev => prev.filter(...))` và hiển thị toast thành công.

5. **Click vào menu không navigate**: Dùng `e.stopPropagation()` trên DropdownMenuTrigger để tránh click xuyên qua card navigate đến trang playlist detail.
