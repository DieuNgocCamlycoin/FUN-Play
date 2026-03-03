

## Áp dụng Context Menu & Ghim cho tin nhắn Tặng Thưởng (Donation)

### Vấn đề hiện tại

Trong `ChatMessageItem.tsx`, tin nhắn loại `donation` được trả về sớm ở dòng 111-130, **bỏ qua hoàn toàn** các tính năng:
- Context menu (nhấn giữ / chuột phải)
- Reaction (thả cảm xúc)
- Ghim (Pin)
- Biểu tượng ghim bên cạnh thời gian
- Backdrop mờ khi menu mở

### Giải pháp

Xoá khối return sớm cho donation (dòng 111-130) và **gộp** `ChatDonationCard` vào luồng render chính, ngang hàng với tin nhắn text/image/sticker. Cụ thể:

#### Cập nhật `src/components/Chat/ChatMessageItem.tsx`

1. **Bỏ khối return sớm** cho `messageType === "donation"` (dòng 111-130)

2. **Trong khối render chính** (sau reply preview, trước reactions), thêm điều kiện render:
   - Nếu `messageType === "donation"` → render `ChatDonationCard`
   - Nếu là sticker → render emoji lớn (giữ nguyên)
   - Còn lại → render bubble text/image (giữ nguyên)

3. **Giữ nguyên** tất cả tính năng bao quanh:
   - `onContextMenu` + `longPressHandlers` trên wrapper
   - Backdrop mờ khi `showActions`
   - Context menu `ChatMessageActions` với đầy đủ Reaction/Reply/Pin/Copy
   - `ChatMessageReactions` hiển thị reaction
   - Dòng thời gian + biểu tượng ghim

4. **Xử lý Copy cho donation**: Khi nhấn "Sao chép" trên tin nhắn donation, sao chép nội dung text (content) của tin nhắn thay vì toàn bộ JSON.

### Chi tiết kỹ thuật

Cấu trúc render mới trong phần bubble:

```text
if (messageType === "donation")
  -> ChatDonationCard (giữ nguyên props)
else if (isSticker)
  -> emoji lớn text-5xl
else
  -> bubble text/image (giữ nguyên)
```

Tất cả 3 nhánh đều nằm trong cùng wrapper có context menu, reactions và thời gian.

### File cần sửa

- `src/components/Chat/ChatMessageItem.tsx` — duy nhất 1 file

