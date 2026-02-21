
## Kế hoạch cập nhật: Liên kết tên channel + Thêm admin mới

### 1. Thêm liên kết điều hướng khi nhấp vào tên channel trong các bảng danh dự

**Vấn đề hiện tại:**

| Component | Tình trạng |
|---|---|
| `TopRankingCard.tsx` | DA CO navigate khi click ca item (dong 39) |
| `TopSponsorsCard.tsx` | DA CO navigate khi click ca item (dong 38) |
| `TopRankingSection.tsx` | CO navigate nhung dung `/channel/${user.id}` (SAI - nen dung `/${user.username \|\| user.id}`) |
| `TopRankingSection.tsx` (Sponsors) | CO navigate nhung dung `/channel/${sponsor.userId}` (SAI) |
| `MobileTopRankingCard.tsx` | KHONG CO navigate khi nhan vao tung user |
| `MobileTopSponsorsCard.tsx` | KHONG CO navigate khi nhan vao tung sponsor |
| `HonorBoardCard.tsx` | Khong co ten channel - chi co so lieu thong ke (khong can sua) |

**Cac thay doi:**

- **`TopRankingSection.tsx`** (dong 46): Sua `navigate('/channel/${user.id}')` thanh `navigate('/${user.username || user.id}')` de dung chuan URL sach cua du an
- **`TopRankingSection.tsx`** (dong 202): Sua `navigate('/channel/${sponsor.userId}')` thanh `navigate('/${sponsor.username || sponsor.userId}')`
- **`MobileTopRankingCard.tsx`**: Them `onClick` navigate vao moi `MiniRankPill` de khi nhan vao se den trang channel tuong ung
- **`MobileTopSponsorsCard.tsx`**: Them `onClick` navigate vao moi `MiniSponsorPill` de khi nhan vao se den trang channel tuong ung

---

### 2. Cap nhat user lekhanhi772@gmail.com thanh admin

**Cach thuc hien:** Su dung cong cu SQL insert de goi ham `add_admin_role` hoac truc tiep INSERT vao bang `user_roles`.

**Buoc 1:** Tim user ID cua email `lekhanhi772@gmail.com` tu bang `profiles` (vi email nam trong `auth.users`, can truy van qua edge function hoac tim trong profiles neu co)

**Buoc 2:** Them role admin bang cach INSERT vao `user_roles`:

```sql
INSERT INTO user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email = 'lekhanhi772@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;
```

---

### Tong ket cac file can sua

| STT | File | Thay doi |
|---|---|---|
| 1 | `src/components/Layout/TopRankingSection.tsx` | Sua duong dan navigate tu `/channel/id` thanh `/:username` |
| 2 | `src/components/Layout/MobileTopRankingCard.tsx` | Them onClick navigate vao MiniRankPill |
| 3 | `src/components/Layout/MobileTopSponsorsCard.tsx` | Them onClick navigate vao MiniSponsorPill |
| 4 | Database (SQL) | Them admin role cho user lekhanhi772@gmail.com |
