
# Mở Angel AI dạng overlay từ Header (không mở trang mới)

## Tình trạng hiện tại
- Nút Angel AI trên Header đang gọi `window.open("https://angel.fun.rich", "_blank")` -> mở tab mới
- Component `AngelChat` (overlay chat) đã có sẵn và đang được dùng bởi mascot (AngelMascot, MobileAngelMascot)
- `AngelChat` gọi edge function `angel-ai-proxy`, edge function này đã proxy request đến backend `angel.fun.rich` làm nguồn AI chính

## Giải pháp
Thay đổi nút Angel AI trên Header để toggle mở/đóng component `AngelChat` overlay ngay trong trang, thay vì mở tab mới.

## Chi tiết thay đổi

**File**: `src/components/Layout/Header.tsx`

1. Import component `AngelChat` từ `@/components/Mascot/AngelChat`
2. Thêm state `isAngelChatOpen` để quản lý trạng thái mở/đóng
3. Thay `onClick={() => window.open("https://angel.fun.rich", "_blank")}` thành `onClick={() => setIsAngelChatOpen(true)}`
4. Render component `AngelChat` với props `isOpen` và `onClose`

## Kết quả
- Nhấn nút Angel AI trên Header -> mở cửa sổ chat overlay ngay trong trang
- Vẫn sử dụng AI backend từ angel.fun.rich (qua edge function angel-ai-proxy)
- Trải nghiệm liền mạch, không rời khỏi FUN Play
- Lịch sử chat vẫn được lưu cho user đã đăng nhập
