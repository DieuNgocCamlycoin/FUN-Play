

## Sửa lỗi điều hướng trang Kênh (Channel Page) - Lỗi "/undefined"

### Nguyên nhân gốc rễ

Lỗi có **một nguyên nhân nghiêm trọng** và **một vấn đề hệ thống**:

1. **Lỗi nghiêm trọng trong LegacyUserRedirect**: Component chuyển hướng đọc `useParams().userId`, nhưng route `/channel/:id` định nghĩa tham số là `:id`. Vì không có tham số nào tên `userId`, giá trị trả về là `undefined`, tạo ra URL `/undefined`.

```text
Route:     /channel/:id        --> tên tham số là "id"
Component: useParams().userId  --> tìm "userId" (SAI!)
Kết quả:   Chuyển hướng đến /undefined
```

2. **Vấn đề hệ thống**: Hơn 17 component vẫn dùng `navigate('/channel/${...}')` với nhiều loại ID khác nhau (channel ID, profile ID, user ID). Dù có redirect xử lý, việc đọc sai tham số khiến toàn bộ cơ chế bị hỏng.

---

### Chiến lược sửa lỗi

**Phương pháp**: Sửa hai phần:
- (A) Sửa LegacyUserRedirect để đọc đúng tên tham số
- (B) Chuyển đổi toàn bộ lệnh điều hướng sang URL sạch dùng username (ưu tiên) hoặc userId, loại bỏ sự phụ thuộc vào redirect cũ

---

### Thay đổi 1: Sửa LegacyUserRedirect (Quan trọng - sửa ngay)

**Tệp**: `src/App.tsx`

Sửa việc trích xuất tham số. Route `/channel/:id` truyền `:id`, nên component phải đọc `id`:

```typescript
const LegacyChannelRedirect = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) {
      navigate('/', { replace: true });
      return;
    }
    // id có thể là UUID của kênh hoặc người dùng - Channel.tsx xử lý cả hai
    navigate(`/${id}`, { replace: true });
  }, [id, navigate]);

  return null;
};
```

Cập nhật route để dùng component mới:
```
<Route path="/channel/:id" element={<LegacyChannelRedirect />} />
```

Giữ nguyên `LegacyUserRedirect` cho `/user/:userId` (component này đã đúng).

---

### Thay đổi 2: Chuyển đổi các lệnh điều hướng sang URL sạch

**17 tệp** hiện đang dùng `navigate('/channel/${...}')`. Với mỗi tệp, thay bằng `navigate('/${username || userId}')`, ưu tiên dùng username khi có, userId làm phương án dự phòng.

Các tệp chính và thay đổi tương ứng:

| Tệp | Hiện tại | Sửa thành |
|------|---------|-----------|
| `TopRankingCard.tsx` | `navigate('/channel/${user.id}')` | `navigate('/${user.username \|\| user.id}')` |
| `TopSponsorSection.tsx` | `navigate('/channel/${sponsor.userId}')` | `navigate('/${sponsor.username \|\| sponsor.userId}')` |
| `TopSponsorsCard.tsx` | `navigate('/channel/${sponsor.userId}')` | `navigate('/${sponsor.username \|\| sponsor.userId}')` |
| `VideoCard.tsx` | `navigate('/channel/${channelId}')` | `navigate('/${userId \|\| channelId}')` - cần thêm prop username |
| `VideoCommentItem.tsx` | `navigate('/channel/${comment.channel?.id}')` | `navigate('/${comment.profile?.username \|\| comment.user_id}')` |
| `Header.tsx` | `navigate('/channel/${channelId}')` | `navigate('/${username \|\| channelId}')` |
| `MobileHeader.tsx` | `navigate('/channel/${channelId}')` | `navigate('/${username \|\| channelId}')` |
| `VideoActionsBar.tsx` | `navigate('/channel/${channelId}')` | `navigate('/${userId \|\| channelId}')` |
| `Subscriptions.tsx` | `navigate('/channel/${sub.channel.id}')` | `navigate('/${sub.channel.profile?.username \|\| sub.channel.user_id}')` |
| `WatchHistory.tsx` | `navigate('/channel/${...}')` | Dùng username hoặc user_id |
| `WatchLater.tsx` | Tương tự | Tương tự |
| `Search.tsx` | Tương tự | Tương tự |
| `MusicDetail.tsx` | Tương tự | Tương tự |
| `MusicComments.tsx` | Tương tự | Tương tự |
| `Watch.tsx` | Đã dùng `navigate('/${video.user_id}')` | Giữ nguyên |
| `Profile.tsx` | `navigate('/channel/${channel.id}')` | `navigate('/${profile?.username \|\| channel?.user_id}')` |
| `Shorts.tsx` | Lẫn lộn - một số dùng username, một số channelId | Chuẩn hóa |

---

### Thay đổi 3: Thêm cơ chế bảo vệ

Trong `Channel.tsx`, thêm kiểm tra cho username `undefined`:

```typescript
const targetUsername = username?.replace("@", "") || null;

// Bảo vệ: nếu tham số là chuỗi "undefined", chuyển về trang chủ
if (targetUsername === "undefined" || targetUsername === "null") {
  navigate("/", { replace: true });
  return;
}
```

---

### Thay đổi 4: Đảm bảo dữ liệu sẵn có

Với các component như `TopRankingCard` đã có `user.username` trong dữ liệu, chỉ cần sử dụng trực tiếp. Với các component như `VideoCard` chỉ nhận `channelId` mà không có `username`, cần bổ sung username vào luồng props từ truy vấn cha (hầu hết truy vấn cha đã select `profiles.username`).

---

### Danh sách tệp cần thay đổi

| STT | Tệp | Nội dung thay đổi |
|-----|------|-------------------|
| 1 | `src/App.tsx` | Sửa LegacyChannelRedirect đọc đúng tham số, thêm bảo vệ |
| 2 | `src/components/Layout/TopRankingCard.tsx` | Dùng username |
| 3 | `src/components/Layout/TopSponsorSection.tsx` | Dùng username |
| 4 | `src/components/Layout/TopSponsorsCard.tsx` | Dùng username |
| 5 | `src/components/Video/VideoCard.tsx` | Dùng userId thay vì channelId |
| 6 | `src/components/Video/Comments/VideoCommentItem.tsx` | Dùng username/user_id |
| 7 | `src/components/Layout/Header.tsx` | Dùng username |
| 8 | `src/components/Layout/MobileHeader.tsx` | Dùng username |
| 9 | `src/components/Video/Mobile/VideoActionsBar.tsx` | Dùng userId |
| 10 | `src/pages/Subscriptions.tsx` | Dùng username |
| 11 | `src/pages/WatchHistory.tsx` | Dùng username/userId |
| 12 | `src/pages/WatchLater.tsx` | Dùng username/userId |
| 13 | `src/pages/Search.tsx` | Dùng username |
| 14 | `src/pages/MusicDetail.tsx` | Dùng username |
| 15 | `src/components/Music/MusicComments.tsx` | Dùng username |
| 16 | `src/pages/Profile.tsx` | Dùng username |
| 17 | `src/pages/Shorts.tsx` | Chuẩn hóa |
| 18 | `src/pages/Channel.tsx` | Thêm bảo vệ chống "undefined" |

### Kết quả đạt được

- Không còn URL `/undefined`
- Toàn bộ điều hướng dùng định dạng `/:username` sạch (dự phòng userId)
- Chuyển hướng cũ `/channel/:id` hoạt động đúng như lưới an toàn
- Cơ chế bảo vệ ngăn điều hướng lỗi ngay cả khi thiếu dữ liệu

