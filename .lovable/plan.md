

## Thêm Emoji/Sticker Picker và Crypto Gift vào Chat Input

Dựa theo yêu cầu: Emoji + Sticker gộp chung 1 dropdown, Crypto Gift gọi đúng tính năng tặng thưởng đã có sẵn (EnhancedDonateModal).

### Thay đổi chi tiết

#### 1. File: `src/components/Chat/ChatInput.tsx`

**Thêm props mới:**
- `otherUserId`, `otherUserName`, `otherUserAvatar`, `chatId` -- để truyền cho EnhancedDonateModal

**Thay đổi layout thanh input:**
- Giữ nguyên nút đính kèm ảnh (ImagePlus)
- Thêm nút **Smile** (emoji/sticker) mở Popover chứa component `ChatEmojiStickerPicker`
- Thêm nút **Gift** mở `EnhancedDonateModal` với `contextType="chat"`, `contextId=chatId`, truyền sẵn thông tin người nhận
- Layout: `[ImagePlus] [Smile] [Gift] [Input] [Send]`

**Import thêm:** `Smile`, `Gift` từ lucide, `Popover/PopoverContent/PopoverTrigger`, `EnhancedDonateModal`, `ChatEmojiStickerPicker`

#### 2. File mới: `src/components/Chat/ChatEmojiStickerPicker.tsx`

Một component Popover gộp Emoji và Sticker trong cùng 1 panel, có 2 tab chính:

**Tab Emoji:** Tái sử dụng cấu trúc từ `EmojiPicker.tsx` đã có (5 category: Thuong dung, Cam xuc, Tim, Cu chi, Vat the) -- chọn emoji sẽ chèn vào ô input.

**Tab Sticker:** Grid các sticker lớn (emoji cỡ to 40x40px), chia theo bộ:
- Dễ thương: các emoji động vật cute (🐱🐶🐰🐻🐼🦊🐸🐵)
- Chúc mừng: 🎉🎊🥳🎁🏆🎂🎈🪅
- Yêu thương: 💖💕💗💓💘💝🥰😍

Chọn sticker sẽ gửi ngay (gọi `onSendSticker`) dưới dạng tin nhắn text với nội dung là emoji đó -- không cần message_type mới, chỉ gửi emoji lớn là đủ.

**Props:** `onEmojiSelect: (emoji: string) => void`, `onSendSticker: (sticker: string) => void`

#### 3. File: `src/components/Chat/ChatWindow.tsx`

Truyền thêm props cho ChatInput:
```
<ChatInput
  onSend={sendMessage}
  disabled={!user}
  otherUserId={otherUser.id}
  otherUserName={otherUser.display_name || otherUser.username}
  otherUserAvatar={otherUser.avatar_url}
  chatId={chatId}
/>
```

#### 4. File: `src/components/Chat/ChatMessageItem.tsx`

Thêm logic phát hiện tin nhắn chỉ chứa 1-3 emoji (không có text khác): hiển thị emoji cỡ lớn (`text-4xl`) không có bubble background, để sticker trông nổi bật hơn.

### Tóm tắt luồng hoạt động

- **Emoji**: Nhấn Smile -> Tab Emoji -> chọn emoji -> chèn vào ô nhập -> gửi cùng text
- **Sticker**: Nhấn Smile -> Tab Sticker -> chọn sticker -> gửi ngay dưới dạng emoji lớn
- **Crypto Gift**: Nhấn Gift -> mở EnhancedDonateModal (đã có sẵn) với context chat + thông tin người nhận

### Không cần thay đổi database
Sticker gửi dưới dạng text message thông thường (nội dung là emoji). Không cần thêm message_type mới hay migration.

