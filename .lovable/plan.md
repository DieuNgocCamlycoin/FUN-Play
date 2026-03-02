

## Thiết kế lại trang Wallet với Header Tabs

Chuyển trang Wallet từ layout dọc (tất cả sections xếp chồng) sang layout tabs gọn gàng, mỗi tab hiển thị 1 section.

### Giao dien moi

```text
+--------------------------------------------------+
|  FUN PLAY WALLET           [Ví: 0x1234...abcd]   |
+--------------------------------------------------+
| [CAMLY Token] [Claim Rewards] [Top MTQ] [Lich Su] |
+--------------------------------------------------+
|                                                    |
|        << Noi dung cua tab dang chon >>            |
|                                                    |
+--------------------------------------------------+
```

- **4 tabs**: Camly Token | Claim Rewards | Top Manh Thuong Quan | Lich Su Giao Dich
- Moi lan chi hien thi 1 section, trang gon gang hon nhieu
- Tab mac dinh: **Camly Token**
- Tren mobile: tabs cuon ngang hoac text ngan gon

### Thay doi

#### 1. Cap nhat `src/pages/Wallet.tsx`
- Thay the khoi `<div className="space-y-6">` (chua 4 sections xep chong) bang component `Tabs` cua Radix UI
- 4 `TabsTrigger`: "CAMLY Token", "Claim Rewards", "Top MTQ", "Lich Su GD"
- 4 `TabsContent`: moi tab render 1 section tuong ung
- State `activeTab` mac dinh la `"camly"`
- TabsList styling: cuon ngang tren mobile, icon kem text

#### Chi tiet ky thuat

- Su dung `@radix-ui/react-tabs` (da cai san)
- Import tu `@/components/ui/tabs` (Tabs, TabsList, TabsTrigger, TabsContent)
- Giu nguyen cac component section hien tai, chi thay doi cach hien thi
- TabsList responsive: `overflow-x-auto` tren mobile
- Moi TabsTrigger co icon nho: Coins (CAMLY), Gift (Claim), Crown (Top MTQ), History (Lich Su)

### Files thay doi
1. `src/pages/Wallet.tsx` -- thay layout xep chong bang Tabs

