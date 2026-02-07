
# Cải Tiến Nút WALLET và Thưởng & Tặng

## Phân Tích Yêu Cầu

Từ hình ảnh và mô tả của con, Cha cần thực hiện 4 thay đổi:

1. **Nút WALLET - Thêm hiệu ứng sáng bóng:** Thêm màu trắng/xanh sáng ở các điểm giao nhau của gradient để tạo độ sáng lấp lánh
2. **Logo ví FUN to hơn:** Tăng kích thước logo từ `h-5 w-5` lên `h-7 w-7` để tràn viền, dễ nhận diện hơn
3. **Xóa badge số đỏ:** Loại bỏ hoàn toàn phần hiển thị số rewards trong khung đỏ vì đang bị che
4. **Chữ "Thưởng & Tặng" to hơn:** Tăng size font từ `text-sm` lên `text-base` và thêm uppercase

---

## Chi Tiết Kỹ Thuật

### 1. Nút WALLET - Thêm Điểm Sáng Giao Nhau

**File:** `src/components/Wallet/WalletButton.tsx`

**Thay đổi gradient:**
```typescript
// Từ:
"bg-gradient-to-r from-green-400 via-yellow-400 via-orange-400 via-pink-400 via-purple-400 to-cyan-400"

// Sang (thêm white/cyan sáng ở điểm giao):
"bg-gradient-to-r from-green-400 via-white via-yellow-400 via-white via-pink-400 via-white via-cyan-400 to-green-400"
```

**Hoặc dùng CSS gradient phức tạp hơn với multiple color stops để tạo hiệu ứng lấp lánh tại các điểm giao nhau**

### 2. Logo Ví FUN To Hơn

**Thay đổi:**
```typescript
// Từ:
className="h-5 w-5 rounded-full"

// Sang:
className="h-7 w-7 rounded-full -ml-1"  // To hơn, dịch trái để tràn viền
```

### 3. Xóa Badge Số Đỏ

**Xóa hoàn toàn đoạn code từ line 206-221:**
```typescript
// XÓA:
{/* Badge for rewards count */}
<AnimatePresence>
  {hasRewards && (
    <motion.span ... >
      {formatNumber(totalRewards)}
    </motion.span>
  )}
</AnimatePresence>
```

### 4. Chữ "Thưởng & Tặng" To Hơn

**File:** `src/components/Donate/GlobalDonateButton.tsx`

**Thay đổi:**
```typescript
// Từ:
<span className="text-sm font-bold hidden md:inline relative z-10">Thưởng & Tặng</span>

// Sang:
<span className="text-base font-extrabold hidden md:inline relative z-10 tracking-wide">THƯỞNG & TẶNG</span>
```

---

## Tóm Tắt Thay Đổi

| File | Thay đổi |
|------|----------|
| `src/components/Wallet/WalletButton.tsx` | 1. Gradient thêm điểm sáng<br>2. Logo to hơn (h-7 w-7)<br>3. Xóa badge số đỏ |
| `src/components/Donate/GlobalDonateButton.tsx` | Chữ to hơn, uppercase, font-extrabold |

---

## Kết Quả Mong Đợi

- Nút WALLET có hiệu ứng rainbow sáng lấp lánh với các điểm sáng trắng/xanh
- Logo ví FUN to rõ ràng, tràn viền ấn tượng
- Không còn badge số đỏ bị che khuất
- Chữ "THƯỞNG & TẶNG" to rõ ràng, dễ đọc
