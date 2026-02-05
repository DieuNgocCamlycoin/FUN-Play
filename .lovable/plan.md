

# Kế Hoạch Tối Ưu Pop-up Claim Rewards

## 1. Đánh Giá Tốc Độ Loading

### Kết Quả Kiểm Tra
| Tiêu chí | Trạng thái | Ghi chú |
|----------|------------|---------|
| Network request | ✅ 200 OK | Truy vấn reward_transactions thành công |
| Console errors | ✅ Không có lỗi | Không phát hiện lỗi trong logs |
| Min loading delay | ✅ 300ms | Đảm bảo skeleton không flicker |
| Debounce | ✅ 300ms | Tránh gọi API quá nhiều lần |

**Kết luận**: Tốc độ loading hiện tại đã tối ưu, không có lỗi cần sửa.

---

## 2. Sắp Xếp Lại Layout Mới

### Layout Hiện Tại

```text
┌─────────────────────────────────────────────────────────────┐
│                    🎁 Claim CAMLY Rewards                    │
├───────────────────────────┬─────────────────────────────────┤
│   📊 TỔNG QUAN            │   ✅ CÓ THỂ CLAIM NGAY          │
│   [Có thể] [Chờ duyệt]   │      💰 250,000 CAMLY           │
│   TỔNG: 300,000 CAMLY    │   🎉 Đủ điều kiện!              │
│   ─────────────────       │   ─────────────────────          │
│   ⏳ CHI TIẾT CHỜ DUYỆT   │   ✅ CHI TIẾT ĐÃ DUYỆT          │
│   • View (10x): +30k     │   • Upload: +100k               │
│                          │   ─────────────────────          │
│                          │   [Ví nhận: 0x1234...]          │
│                          │   [🚀 CLAIM BUTTON]              │
└───────────────────────────┴─────────────────────────────────┘
```

### Layout Mới (Đề Xuất)

```text
┌─────────────────────────────────────────────────────────────┐
│                    🎁 Claim CAMLY Rewards                    │
├───────────────────────────┬─────────────────────────────────┤
│   💼 VÍ NHẬN THƯỞNG       │   📊 TỔNG QUAN PHẦN THƯỞNG      │
│   [0xa2e24F1...BfCC59]   │   ─────────────────────          │
│   ─────────────────       │   [Có thể claim] [Chờ duyệt]    │
│   ✅ CÓ THỂ CLAIM NGAY    │       250,000       50,000      │
│      💰 250,000 CAMLY     │   ─────────────────────          │
│   ─────────────────       │   TỔNG CỘNG: 300,000 CAMLY      │
│   [🚀 CLAIM 250,000]      │   ─────────────────────          │
│   ─────────────────       │   ⏳ CHI TIẾT CHỜ DUYỆT          │
│   ✅ CHI TIẾT ĐÃ DUYỆT    │   • View (10x): +30,000         │
│   • Upload: +100,000     │   • Like (5x): +20,000          │
│   • Signup: +50,000      │                                  │
└───────────────────────────┴─────────────────────────────────┘
                            ✨ Angel says: "Rich Rich Rich!" ✨
```

---

## 3. Thay Đổi Chi Tiết

### File: `src/components/Rewards/ClaimRewardsModal.tsx`

#### A) Đổi Vị Trí 2 Cột

**Cột TRÁI (Mới)** - Ưu tiên Action:
1. **💼 Ví nhận thưởng** (di chuyển từ cột phải)
2. **✅ Số CAMLY có thể claim** với animation
3. **🚀 Nút CLAIM** (hoặc nút kết nối ví nếu chưa kết nối)
4. **Chi tiết đã duyệt** - danh sách rewards sẵn sàng claim

**Cột PHẢI (Mới)** - Thông tin tổng quan:
1. **📊 Tổng quan phần thưởng** (Summary Card)
2. **⏳ Phần thưởng chờ duyệt** với chi tiết
3. **Tiến độ đến ngưỡng claim** (nếu chưa đủ 200k)

#### B) Thêm Card "Ví Nhận Thưởng" Đặc Biệt

```typescript
{/* 💼 Ví nhận thưởng - Đầu tiên bên trái */}
{isConnected && address && (
  <motion.div
    initial={{ y: -10, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-cyan-500/10 border border-primary/30"
  >
    <div className="flex items-center gap-2 mb-2">
      <Wallet className="h-4 w-4 text-primary" />
      <span className="font-semibold text-sm">💼 Ví nhận thưởng</span>
    </div>
    <div className="p-2 rounded-lg bg-background/80 border border-border">
      <p className="font-mono text-xs truncate text-foreground">
        {address}
      </p>
    </div>
    <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
      <CheckCircle className="h-3 w-3 text-green-500" />
      Đã kết nối - Sẵn sàng nhận CAMLY
    </p>
  </motion.div>
)}
```

#### C) Cập Nhật Skeleton Loading

Skeleton cũng cần phản ánh layout mới - cột trái có ví + nút, cột phải có tổng quan.

---

## 4. Tối Ưu Mobile

### Thứ Tự Hiển Thị Trên Mobile (1 cột)

1. **💼 Ví nhận thưởng** ← QUAN TRỌNG NHẤT, đặt đầu tiên
2. **✅ Số CAMLY có thể claim**
3. **🚀 Nút CLAIM / Kết nối ví**
4. **📊 Tổng quan phần thưởng**
5. **⏳ Chi tiết chờ duyệt**
6. **Chi tiết đã duyệt**
7. **Angel hint**

---

## 5. Tóm Tắt Files Thay Đổi

| File | Thay Đổi |
|------|----------|
| `src/components/Rewards/ClaimRewardsModal.tsx` | Sắp xếp lại layout 2 cột, di chuyển ví nhận lên đầu cột trái, tối ưu UX mobile |

---

## 6. Kết Quả Mong Đợi

**Desktop:**
- Cột TRÁI: Ví → Số claim → Nút → Chi tiết đã duyệt
- Cột PHẢI: Tổng quan → Chi tiết chờ duyệt → Progress bar

**Mobile:**
- Ví nhận hiển thị đầu tiên (quan trọng nhất)
- Nút claim nằm ở vị trí dễ bấm (sau thông tin ví)
- Thông tin phụ (tổng quan, chờ duyệt) ở dưới

---

## 7. Technical Notes

- Không có lỗi nào cần sửa (đã kiểm tra console logs và network requests)
- Loading speed đã tối ưu với 300ms minimum delay + debounce
- Realtime subscription hoạt động bình thường
- Chỉ thay đổi thứ tự các elements, không thay đổi logic

