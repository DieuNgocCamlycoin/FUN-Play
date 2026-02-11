

# Thêm nút Quay lại trên trang Thông báo và Trang cá nhân (Mobile)

---

## Thay đổi

### 1. Trang Thông báo (`src/pages/Notifications.tsx`)

- Thêm import `ArrowLeft` từ `lucide-react` và hook `useIsMobile`
- Thêm nút quay lại (ArrowLeft) bên trái tiêu đề "Thông báo" trên mobile
- Nút gọi `navigate(-1)` để quay về trang trước đó
- Chỉ hiển thị trên mobile (`isMobile`)

**Vị trí thay đổi:** Phần header (dòng 137-144)

Trước:
```
<h1 className="text-2xl font-bold">Thông báo</h1>
```

Sau:
```
<div className="flex items-center gap-2">
  {isMobile && (
    <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
      <ArrowLeft className="h-5 w-5" />
    </Button>
  )}
  <h1 className="text-2xl font-bold">Thông báo</h1>
</div>
```

### 2. Trang Cá nhân (`src/pages/UserProfile.tsx`)

- Thêm import `ArrowLeft` từ `lucide-react` và hook `useIsMobile`
- Thêm nút quay lại dạng floating (vị trí cố định góc trên trái) phía trên ảnh bìa trên mobile
- Nút có nền bán trong suốt để dễ nhìn trên ảnh bìa

**Vị trí thay đổi:** Ngay trước `ProfileHeader` (dòng 253-257)

```
{isMobile && (
  <Button
    variant="ghost"
    size="icon"
    onClick={() => navigate(-1)}
    className="fixed top-3 left-3 z-50 bg-black/40 hover:bg-black/60 text-white rounded-full"
  >
    <ArrowLeft className="h-5 w-5" />
  </Button>
)}
<ProfileHeader ... />
```

---

## Tóm tắt

| # | Tệp | Thay đổi |
|---|------|----------|
| 1 | `src/pages/Notifications.tsx` | Thêm nút ArrowLeft bên trái tiêu đề trên mobile |
| 2 | `src/pages/UserProfile.tsx` | Thêm nút ArrowLeft floating góc trên trái trên mobile |

Cả hai nút đều gọi `navigate(-1)` để quay về trang trước đó và chỉ hiển thị trên mobile.

