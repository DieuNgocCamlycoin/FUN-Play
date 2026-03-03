

## Plan tổng hợp: Nâng cấp Chat — Context Menu Telegram + Ghim tin nhắn + Emoji mới

Gộp tất cả thay đổi chưa triển khai thành một plan duy nhất.

---

### 1. Database Migration — Thêm cột Ghim tin nhắn

Thêm 3 cột vào bảng `chat_messages`:
- `is_pinned` (boolean, mặc định false)
- `pinned_at` (timestamptz, nullable)
- `pinned_by` (uuid, nullable)

Thêm RLS policy cho phép người dùng trong cuộc trò chuyện có thể cập nhật trạng thái ghim.

### 2. Đổi emoji 👍 thành 🎉

Cập nhật 2 file:

**`ChatMessageActions.tsx`**: Đổi `{ emoji: "👍", label: "Like" }` thành `{ emoji: "🎉", label: "Pháo hoa" }`

**`ChatMessageReactions.tsx`**: Đổi phần tử cuối trong `EMOJI_ORDER` từ `"👍"` thành `"🎉"`

Thứ tự emoji cuối cùng:
```text
🙏  🥰  ❤️  😂  😮  🎉
```

### 3. Thiết kế lại `ChatMessageActions.tsx` — Menu ngữ cảnh kiểu Telegram

Thay giao diện thanh reaction ngang đơn giản bằng menu ngữ cảnh gồm 2 phần:

**Phần trên — Thanh Reaction (ngang):**
```text
🙏  🥰  ❤️  😂  😮  🎉
```
Bo tròn, nền mờ (backdrop blur), đổ bóng.

**Phần dưới — Menu hành động (danh sách dọc):**
- Trả lời — icon Reply
- Ghim / Bỏ ghim — icon Pin
- Sao chép — icon Copy

**Không bao gồm**: Xóa, Chọn, Chuyển tiếp.

Props mới: `messageContent`, `isPinned`, `onPin`, `onCopy`.

### 4. Cập nhật `ChatMessageItem.tsx`

- Thay thế hiển thị khi hover bằng **nhấn giữ (di động) / chuột phải (máy tính)** để mở menu ngữ cảnh tại vị trí nhấn
- Lớp phủ mờ phía sau khi menu đang mở
- Nhấn bên ngoài hoặc chọn hành động sẽ đóng menu
- Hiển thị biểu tượng ghim nhỏ bên cạnh thời gian nếu tin nhắn đã được ghim
- Truyền thêm props: `messageContent`, `isPinned`, `onPin`
- Xử lý `onCopy`: sao chép nội dung vào clipboard + hiện thông báo "Đã sao chép"
- Xử lý `onPin`: gọi callback lên component cha

### 5. Cập nhật `useChatMessages.ts`

- Thêm vào giao diện `ChatMessage`: `isPinned`, `pinnedAt`, `pinnedBy`
- Truy vấn lấy thêm `is_pinned, pinned_at, pinned_by`
- Thêm hàm `togglePinMessage(messageId)`:
  - Nếu đang ghim → bỏ ghim (`is_pinned = false, pinned_at = null, pinned_by = null`)
  - Nếu chưa ghim → ghim (`is_pinned = true, pinned_at = now(), pinned_by = user.id`)
- Thêm giá trị tính toán `pinnedMessage`: tin nhắn ghim mới nhất trong cuộc trò chuyện
- Xuất `togglePinMessage` và `pinnedMessage`

### 6. Component mới: `ChatPinnedBanner.tsx`

Banner nhỏ gọn phía dưới tiêu đề chat, hiển thị khi có tin nhắn được ghim:
- Biểu tượng Ghim + nội dung rút gọn của tin nhắn ghim
- Nhấn vào banner → cuộn đến tin nhắn ghim
- Nút X nhỏ để ẩn banner (chỉ ẩn giao diện, không bỏ ghim)
- Kiểu dáng: nhỏ gọn, viền dưới, nền amber nhạt

### 7. Cập nhật `ChatWindow.tsx`

- Nhận `pinnedMessage` và `togglePinMessage` từ hook
- Hiển thị `ChatPinnedBanner` giữa tiêu đề và danh sách tin nhắn
- Truyền callback `onPin` xuống `ChatMessageList` → `ChatMessageItem`

### 8. Cập nhật `ChatMessageList.tsx`

- Nhận thêm prop `onPin: (messageId: string) => void`
- Truyền xuống từng `ChatMessageItem`

---

### Tóm tắt thứ tự thực hiện

1. Migration cơ sở dữ liệu (thêm cột ghim)
2. Đổi emoji 👍 → 🎉 trong `ChatMessageActions` và `ChatMessageReactions`
3. Thiết kế lại `ChatMessageActions` thành menu ngữ cảnh Telegram (thanh reaction + Trả lời/Ghim/Sao chép)
4. Cập nhật `ChatMessageItem` (kích hoạt menu ngữ cảnh, biểu tượng ghim, xử lý sao chép)
5. Cập nhật `useChatMessages` (trường ghim, togglePin, pinnedMessage)
6. Tạo `ChatPinnedBanner`
7. Cập nhật `ChatWindow` và `ChatMessageList` (banner ghim, truyền callbacks)

