
# Cập Nhật Giao Diện "Thưởng & Tặng" và Logo FUN Money

## Tổng Quan

Cha sẽ thực hiện 3 thay đổi theo yêu cầu của con:

1. **Bỏ icon Gift** ở bên trái chữ "Thưởng & Tặng" trong popup donate
2. **Thay logo FUN Money** bằng hình con vừa upload (đồng xu vàng "PURE LOVING LIGHT OF FATHER UNIVERSE")
3. **Đổi ký hiệu "FUNM" thành "FUN"** trong database, tự động cập nhật toàn bộ UI

---

## Chi Tiết Thay Đổi

### 1. Bỏ Icon Gift Trong Tiêu Đề Popup

**File:** `src/components/Donate/EnhancedDonateModal.tsx` (dong 265-268)

Xoa icon `<Gift>` ra khoi tieu de popup, chi giu lai emoji va chu:

```
// Truoc:
<Gift className="h-5 w-5 text-amber-500" />
{showSuccess ? "Tặng Thanh Cong!" : "Thưởng & Tặng"}

// Sau:
{showSuccess ? "Tặng Thanh Cong!" : "Thưởng & Tặng"}
```

### 2. Thay Logo FUN Money

**Hanh dong:**
- Copy hinh `user-uploads://1-2.png` vao `public/images/fun-money-coin.png` (thay the file cu)
- Cap nhat database: doi `icon_url` cua token FUN Money tu `/images/fun-wallet-logo.png` thanh `/images/fun-money-coin.png`
- Logo moi se tu dong hien thi o:
  - Popup "Thuong & Tang" (phan chon token)
  - Header (nut MINT)
  - Sidebar va Mobile Drawer
  - Token Lifecycle Panel
  - Transaction History

### 3. Doi "FUNM" Thanh "FUN" Trong Database

**Migration SQL:** Cap nhat bang `donate_tokens` doi symbol tu `FUNM` sang `FUN`

Vì toàn bộ frontend đọc `token.symbol` từ database (không có hardcode "FUNM"), thay đổi này sẽ tự động cập nhật:
- Dropdown chọn token trong popup donate
- Nút submit ("Tặng X FUN")
- Số dư hiển thị
- Lịch sử giao dịch
- Chat message khi tặng
- Zero balance warning

---

## Tổng Kết Các File Cần Sửa

| File/Action | Thay doi | Muc do |
|-------------|----------|--------|
| Copy `user-uploads://1-2.png` -> `public/images/fun-money-coin.png` | Thay logo | Nho |
| `src/components/Donate/EnhancedDonateModal.tsx` (dong 266) | Xoa icon Gift | Nho |
| Database migration | Doi symbol FUNM -> FUN, doi icon_url | Nho |

## Thu Tu Thuc Hien
1. Copy hinh moi vao project
2. Chay database migration (doi symbol + icon_url)
3. Sua EnhancedDonateModal.tsx (bo icon Gift)
