
# Xoa vien vang va phong to logo trong menu FUN ECOSYSTEM

## Van de hien tai

Tat ca logo trong phan FUN ECOSYSTEM (FUN.RICH, FUN FARM, FUN PLANET, FUN Wallet, FUN Money) dang co:
- Vien vang `ring-2 ring-yellow-400` hoac vien cyan `ring-2 ring-cyan-400` bao quanh
- Hieu ung phat sang vang `shadow-[0_0_8px_rgba(250,204,21,0.4)]`
- Kich thuoc nho (`h-5 w-5` hoac `h-6 w-6`)

## Giai phap

Xoa toan bo vien vang/cyan va hieu ung glow, tang kich thuoc logo de hien thi ro rang hon.

## Chi tiet thay doi

### 1. `src/components/Layout/Sidebar.tsx`
**Dong 149-154** - Phan render logo trong FUN ECOSYSTEM:
- Xoa: `ring-2`, `ring-yellow-400`, `ring-cyan-400`, `shadow-[0_0_8px_rgba(250,204,21,0.4)]`, `shadow-[0_0_8px_rgba(34,211,238,0.4)]`
- Tang kich thuoc tu `h-6 w-6` len `h-7 w-7`
- Giu lai: `rounded-full`, `object-cover`

### 2. `src/components/Layout/CollapsibleSidebar.tsx`
**Dong 127-132** - Phan NavButton render logo:
- Xoa: `ring-2`, `ring-yellow-400`, `ring-cyan-400`, `shadow-md`, `shadow-[0_0_8px_...]`
- Tang kich thuoc tu `h-5 w-5` len `h-7 w-7` (che do mo rong) va `h-6 w-6` (che do thu gon/compact giu nguyen phu hop)

### 3. `src/components/Layout/MobileDrawer.tsx`
**Dong 134-139** - NavButton (dung cho FUN Money va cac muc reward):
- Xoa: `ring-2 ring-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.4)]`
- Tang kich thuoc tu `h-6 w-6` len `h-7 w-7`

**Dong 162-167** - FunPlatformButton (dung cho FUN.RICH, FUN FARM, FUN PLANET, FUN Wallet):
- Xoa: `ring-2 ring-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.4)]`
- Tang kich thuoc tu `h-6 w-6` len `h-7 w-7`

## Tom tat

| Hang muc | Chi tiet |
|----------|----------|
| File can sua | 3 file |
| Tong thay doi | 4 cho (styling logo) |
| Hieu ung xoa | ring-2, ring-yellow-400, ring-cyan-400, shadow glow |
| Kich thuoc moi | h-7 w-7 (tang tu h-5/h-6) |
| Dong bo Mobile | Co (MobileDrawer) |
| Co so du lieu | Khong |

## Ket qua

- Logo hien thi sach se, khong con vien vang/cyan bao quanh
- Logo lon hon va ro rang hon trong menu
- Ap dung dong nhat tren Desktop (Sidebar, CollapsibleSidebar) va Mobile (MobileDrawer)
