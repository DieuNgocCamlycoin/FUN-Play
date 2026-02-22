

## Sửa lỗi trang cá nhân chớp/load lại liên tục (lần 2)

### Nguyên nhân

Lỗi cũ chưa được sửa. Vòng lặp vô hạn vẫn xảy ra:

1. `SocialMediaOrbit` mount -> gọi `fetch-social-avatar` -> gọi `onProfileUpdate()`
2. `onProfileUpdate()` = `fetchChannelAndProfile()` -> gọi `setLoading(true)` (dòng 177)
3. `setLoading(true)` hiển thị spinner -> **unmount** `SocialMediaOrbit`
4. Load xong -> `SocialMediaOrbit` mount lại -> quay lại bước 1 -> lặp vô tận

### Giải pháp

**File: `src/pages/Channel.tsx`**

Thêm `useRef` để theo dõi lần load đầu tiên, chỉ gọi `setLoading(true)` khi chưa load xong lần đầu:

1. Thêm khai báo: `const initialLoadDone = useRef(false);`
2. Dòng 177: thay `setLoading(true)` bằng:
   ```
   if (!initialLoadDone.current) {
     setLoading(true);
   }
   ```
3. Trong phần `finally` của `fetchChannelAndProfile`, thêm: `initialLoadDone.current = true;`

Kết quả:
- Lần đầu vào trang: hiển thị spinner bình thường
- Các lần refresh sau (do `onProfileUpdate`): cập nhật dữ liệu mà **không** unmount component, không gây chớp

### Chi tiết kỹ thuật

| File | Thay đổi |
|---|---|
| `src/pages/Channel.tsx` | Thêm `useRef(false)` cho `initialLoadDone`, chỉ `setLoading(true)` lần đầu, set `initialLoadDone.current = true` trong `finally` |

