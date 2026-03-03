

## Thêm Reaction và Reply cho tin nhắn Chat (cập nhật emoji)

Cập nhật theo yêu cầu: thay 😢 (buồn) bằng 🥰 (thương thương), thay 😡 (tức giận) bằng 🙏 (biết ơn), và sắp xếp lại thứ tự.

### 1. Database Migration

**Bảng mới: `chat_message_reactions`**
- `id` (uuid, PK), `message_id` (FK -> chat_messages.id ON DELETE CASCADE), `user_id` (uuid), `emoji` (text), `created_at` (timestamptz)
- Unique constraint: (message_id, user_id, emoji)
- RLS policies cho authenticated users trong chat
- Enable realtime

**Thêm cột `reply_to_id`** (uuid, nullable, FK -> chat_messages.id) vào `chat_messages`

### 2. Thanh reaction nhanh -- emoji và thứ tự mới

```
🙏  🥰  ❤️  😂  😮  👍
```

Thứ tự: Biết ơn, Thương thương, Tim, Haha, Wow, Like

### 3. Component mới: `ChatMessageActions.tsx`

- Hiện khi hover (desktop) / nhấn giữ (mobile) vào tin nhắn
- Thanh reaction nhanh 6 emoji theo thứ tự trên
- Nút "Trả lời"

### 4. Component mới: `ChatMessageReactions.tsx`

- Hiển thị reactions gộp theo emoji dưới bubble: `🙏 2  ❤️ 1`
- Nhấn vào reaction để toggle (thêm/xóa)

### 5. Cập nhật `ChatMessageItem.tsx`

- Hover/long-press hiện ChatMessageActions
- Hiển thị ChatMessageReactions dưới bubble
- Nếu có `reply_to_id`: hiện preview tin nhắn gốc phía trên bubble

### 6. Cập nhật `ChatInput.tsx`

- Thêm state `replyingTo` -- banner "Đang trả lời [tên]: [nội dung...]" phía trên ô input, nút X hủy
- Gửi kèm `reply_to_id`

### 7. Cập nhật `useChatMessages.ts`

- Mở rộng ChatMessage interface: `replyToId`, `replyToContent`, `replyToSenderName`
- Query fetch thêm reply info
- `sendMessage` nhận thêm `replyToId`
- Realtime subscribe `chat_message_reactions`

### 8. Cập nhật `ChatWindow.tsx` và `ChatMessageList.tsx`

- Quản lý state `replyingTo`, truyền callbacks `onReact`, `onReply` xuống items
