

# Kế Hoạch Thêm Nút FUN Money với Logo vào Sidebar

## Tổng Quan

Thêm nút FUN Money với logo hình ảnh đẹp (giống FUN Wallet) vào sidebar, đặt ngay cạnh FUN Wallet trong phần "FUN ECOSYSTEM".

---

## Phần I: Hiện Trạng

| File | FUN Money | Vấn Đề |
|------|-----------|--------|
| `Sidebar.tsx` | ✅ Đã có | Dùng icon Coins, không có logo hình ảnh |
| `CollapsibleSidebar.tsx` | ❌ Chưa có | Thiếu hoàn toàn |

**Logo có sẵn:** `/images/fun-money-coin.png` ✅

---

## Phần II: Thiết Kế UI Mới

```text
┌─────────────────────────────────────┐
│        FUN ECOSYSTEM                │
├─────────────────────────────────────┤
│  [🟡 FUN.RICH logo]    FUN.RICH   ↗ │
│  [🟡 FUN FARM logo]    FUN FARM   ↗ │
│  [🟡 FUN PLANET logo]  FUN PLANET ↗ │
│  [🟡 FUN Wallet logo]  FUN Wallet   │  ← Gradient vàng-cam
│  [🟡 FUN Money logo]   FUN Money    │  ← MỚI! Gradient xanh-cyan
└─────────────────────────────────────┘
```

---

## Phần III: Files Cần Thay Đổi

| File | Hành động | Chi tiết |
|------|-----------|----------|
| `src/components/Layout/Sidebar.tsx` | **Cập nhật** | Đổi FUN Money từ icon sang customIcon với logo |
| `src/components/Layout/CollapsibleSidebar.tsx` | **Cập nhật** | Thêm FUN Money vào funPlatformItems |

---

## Phần IV: Chi Tiết Thay Đổi

### 4.1. Sidebar.tsx

**Trước:**
```typescript
{ 
  icon: Coins,
  label: "FUN Money", 
  href: "/fun-money",
  special: true
},
```

**Sau:**
```typescript
{ 
  customIcon: '/images/fun-money-coin.png',
  label: "FUN Money", 
  href: "/fun-money",
  isFunMoney: true  // Flag mới cho styling riêng
},
```

### 4.2. CollapsibleSidebar.tsx

**Thêm vào funPlatformItems:**
```typescript
{ 
  customIcon: '/images/fun-money-coin.png',
  label: "FUN Money", 
  href: "/fun-money",
  isFunMoney: true
},
```

---

## Phần V: Styling Cho FUN Money

| Thuộc tính | FUN Wallet | FUN Money |
|------------|------------|-----------|
| Gradient | Yellow-Orange | Cyan-Blue (Primary) |
| Ring color | ring-yellow-400 | ring-cyan-400 |
| Glow | rgba(250,204,21,0.4) | rgba(34,211,238,0.4) |
| Border | border-yellow-500/20 | border-primary/20 |

**CSS cho FUN Money:**
```typescript
item.isFunMoney && "bg-gradient-to-r from-primary/10 via-cyan-500/10 to-blue-500/10 hover:from-primary/20 hover:via-cyan-500/20 hover:to-blue-500/20 border border-primary/20"
```

**Logo styling:**
```typescript
isFunMoney ? "ring-2 ring-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.4)]" : "ring-2 ring-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.4)]"
```

---

## Phần VI: Interface Update

```typescript
interface NavItem {
  icon?: any;
  customIcon?: string;
  label: string;
  href: string;
  special?: boolean;
  isWallet?: boolean;
  isFunMoney?: boolean;  // Thêm mới
  external?: boolean;
}
```

---

## Tóm Tắt

| Bước | Công việc |
|------|-----------|
| 1 | Update interface NavItem thêm `isFunMoney` flag |
| 2 | Update Sidebar.tsx - đổi FUN Money sang dùng customIcon với styling cyan-blue |
| 3 | Update CollapsibleSidebar.tsx - thêm FUN Money vào funPlatformItems |
| 4 | Thêm conditional styling cho logo ring và button background |

**Thời gian ước tính:** 15-20 phút

