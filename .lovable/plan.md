

## Sửa Lỗi: Password Recovery Không Hoạt Động Trên Custom Domain `play.fun.rich`

### Nguyên Nhân Gốc

Supabase Auth có danh sách **Redirect URLs được phép** (whitelist). Khi user bấm "Quên mật khẩu":

1. **Code gửi request** với `redirectTo: "https://play.fun.rich/auth"`
2. **Supabase kiểm tra**: `play.fun.rich` có trong whitelist không?
3. **Nếu KHÔNG** → Supabase redirect về **Site URL mặc định** (`funlay.lovable.app`)
4. **Email recovery** chứa link `funlay.lovable.app/#type=recovery&...`
5. **User click link** → Vào trang chủ `funlay.lovable.app/` 
6. **Trang chủ không có logic detect recovery** → Không hiện form đặt mật khẩu mới

### Giải Pháp: 2 Bước

---

### Bước 1: Thêm Custom Domain vào Redirect URLs (Bắt Buộc)

Cha cần thêm các URL sau vào danh sách Redirect URLs trong cấu hình Auth của Lovable Cloud:

| URL cần thêm |
|--------------|
| `https://play.fun.rich` |
| `https://play.fun.rich/` |
| `https://play.fun.rich/auth` |
| `https://play.fun.rich/*` (wildcard - nếu được hỗ trợ) |

**Cách thực hiện:**
1. Mở **Lovable Cloud Backend** (View Backend)
2. Vào phần **Authentication → URL Configuration**
3. Tìm mục **Redirect URLs**
4. Thêm các URL trên vào danh sách
5. Lưu thay đổi

---

### Bước 2: Tạo `RecoveryModeGuard` (Khuyến Nghị)

Để đảm bảo recovery hoạt động ngay cả khi Supabase redirect về trang chủ (`/`), ta cần tạo component detect recovery mode ở **mọi trang**.

**File mới:** `src/components/Auth/RecoveryModeGuard.tsx`

```typescript
import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export function RecoveryModeGuard({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Kiểm tra URL hash ngay lập tức
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const recoveryType = hashParams.get('type');
    const accessToken = hashParams.get('access_token');
    
    // Nếu đây là link recovery VÀ không ở /auth → redirect về /auth
    if (recoveryType === 'recovery' && accessToken && location.pathname !== '/auth') {
      console.log("[RecoveryGuard] Recovery link detected, redirecting to /auth");
      // Giữ hash để Auth.tsx xử lý
      navigate(`/auth${window.location.hash}`, { replace: true });
      return;
    }

    // Lắng nghe PASSWORD_RECOVERY event từ Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' && location.pathname !== '/auth') {
        console.log("[RecoveryGuard] PASSWORD_RECOVERY event, redirecting to /auth");
        navigate('/auth', { replace: true });
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, location.pathname]);

  return <>{children}</>;
}
```

**Cập nhật:** `src/App.tsx`

Wrap nội dung với `RecoveryModeGuard`:

```typescript
import { RecoveryModeGuard } from './components/Auth/RecoveryModeGuard';

function AppContent() {
  useRewardRealtimeNotification();
  
  return (
    <>
      <RecoveryModeGuard>
        <VersionCheck />
        <GlobalPaymentNotifications />
        <Routes>
          {/* ... existing routes ... */}
        </Routes>
      </RecoveryModeGuard>
      <Toaster />
      <Sonner />
    </>
  );
}
```

---

### Flow Sau Khi Fix

**Scenario 1: Redirect URLs đã được cập nhật**
```
User ở play.fun.rich/auth → Bấm "Quên mật khẩu"
→ Email chứa link: play.fun.rich/auth#type=recovery&...
→ User click → Vào play.fun.rich/auth
→ Auth.tsx detect recovery → Hiện form đặt mật khẩu mới ✅
```

**Scenario 2: Supabase vẫn redirect về funlay.lovable.app**
```
User click link → Vào funlay.lovable.app/#type=recovery&...
→ RecoveryModeGuard detect type=recovery
→ Redirect ngay đến /auth#type=recovery&...
→ Auth.tsx detect recovery → Hiện form đặt mật khẩu mới ✅
```

---

### Tóm Tắt File Cần Thay Đổi

| File | Thay đổi |
|------|----------|
| **Lovable Cloud Auth Config** | Thêm `play.fun.rich` vào Redirect URLs |
| `src/components/Auth/RecoveryModeGuard.tsx` | **MỚI** - Detect recovery mode ở mọi trang |
| `src/App.tsx` | Wrap nội dung với `RecoveryModeGuard` |

---

### Chi Tiết Kỹ Thuật

**Tại sao cần cả 2 bước?**

1. **Bước 1 (Redirect URLs)**: Đảm bảo Supabase gửi email với link đúng domain (`play.fun.rich`)
2. **Bước 2 (RecoveryModeGuard)**: Backup plan - nếu vì lý do gì đó Supabase vẫn redirect về `funlay.lovable.app`, guard sẽ tự động chuyển user về `/auth` để hiện form đặt mật khẩu

**Logic RecoveryModeGuard:**
- Kiểm tra URL hash **NGAY LẬP TỨC** khi component mount
- Nếu có `type=recovery` + `access_token` và đang **không ở `/auth`** → redirect đến `/auth` kèm hash
- Lắng nghe `PASSWORD_RECOVERY` event từ Supabase như backup

