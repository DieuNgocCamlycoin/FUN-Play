

## Gop bang Danh sach Dinh chi: 1 bang duy nhat hien thi User + Vi

### Tong quan

Bo 2 tab rieng biet, gop thanh **1 bang duy nhat** hien thi tat ca thong tin user bi ban kem theo cac vi bi blacklist tuong ung.

---

### Thay doi

#### 1. Hook: `src/hooks/usePublicSuspendedList.ts`

- Sua query `blacklisted_wallets` de lay them cot `user_id`
- Cap nhat interface `BlacklistedWallet` them truong `user_id`
- Tao mot ham hoac logic gop (merge) du lieu: voi moi banned user, tim cac wallet co `user_id` khop de gan kem
- Export kieu du lieu moi `SuspendedEntry` gom thong tin user + danh sach vi lien quan

```text
SuspendedEntry {
  user_id, username, display_name, avatar_url,
  ban_reason, banned_at, violation_level,
  wallets: BlacklistedWallet[]   // cac vi tuong ung
}
```

- Cac vi khong co `user_id` (wallet doc lap) van duoc giu lai va hien thi rieng cuoi bang

#### 2. Trang: `src/pages/SuspendedUsers.tsx`

**Bo tabs**, thay bang **1 bang Table duy nhat** voi cac cot:

| # | Cot | Noi dung |
|---|---|---|
| 1 | # | So thu tu |
| 2 | Nguoi dung | Avatar (mo, grayscale) + Display name (gach ngang) + @username |
| 3 | Vi lien ket | Cac dia chi vi blacklist tuong ung (font mono, rut gon). Neu khong co thi hien "—" |
| 4 | Ly do | Ban reason |
| 5 | Muc do | Badge violation level |
| 6 | Ngay dinh chi | Format dd/MM/yyyy HH:mm |

- Cac vi doc lap (khong gan user) se hien o cuoi bang voi cot "Nguoi dung" la "Khong xac dinh"
- Tim kiem van hoat dong binh thuong tren tat ca cac truong
- Responsive: tren mobile an cot # va Ngay, dung `hidden md:table-cell`
- Su dung `Table, TableHeader, TableBody, TableRow, TableHead, TableCell` tu `@/components/ui/table`

### Tong ket file thay doi

| File | Hanh dong |
|---|---|
| `src/hooks/usePublicSuspendedList.ts` | Sua: them user_id vao wallet query, tao logic merge |
| `src/pages/SuspendedUsers.tsx` | Sua: bo tabs, chuyen sang 1 bang gop |

