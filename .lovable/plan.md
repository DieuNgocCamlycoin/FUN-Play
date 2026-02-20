

## Chuyen useAuth thanh AuthProvider Context - Toi uu hieu nang chuyen trang

### Van de hien tai

`useAuth()` la hook doc lap - moi component goi no deu tao subscription, getSession, va checkBanStatus rieng. Khi chuyen trang, 5-10 instance chay dong thoi gay "state thrashing" khien UI bi treo.

### Thay doi

**File 1: `src/contexts/AuthContext.tsx` (TAO MOI)**

AuthProvider chua 1 subscription duy nhat, chia se state cho toan bo app:

```typescript
import { createContext, useEffect, useState, useMemo, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  isBanned: boolean;
  banReason: string | null;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // ... state + 1 subscription + 1 getSession + 1 checkBanStatus
  // SIGNED_OUT event -> xoa sach toan bo state
  // useMemo cho value truyen vao Provider
};
```

Diem quan trong:
- Khi `onAuthStateChange` tra ve `SIGNED_OUT`: reset tat ca state ve gia tri mac dinh (user=null, session=null, isBanned=false, banReason=null)
- `useMemo` cho context value, chi re-render khi user/session/loading/isBanned/banReason thay doi
- `signOut` dung `useNavigate` nen AuthProvider PHAI nam trong BrowserRouter

**File 2: `src/hooks/useAuth.tsx` (CAP NHAT)**

Chuyen tu hook doc lap thanh hook doc tu Context:

```typescript
import { useContext } from "react";
import { AuthContext } from "@/contexts/AuthContext";

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
```

104 file su dung `useAuth()` KHONG can sua vi interface giu nguyen.

**File 3: `src/App.tsx` (CAP NHAT)**

Them AuthProvider vao component tree, BEN TRONG BrowserRouter, BAO BOC WalletProvider:

```text
BrowserRouter
  -> AuthProvider          <-- THEM VAO DAY (bao WalletProvider)
    -> WalletProvider
      -> AppContent
      -> EnhancedMusicPlayer
      -> GlobalVideoPlayer
```

WalletProvider hien tai KHONG su dung useAuth nen thu tu nay an toan. Nhung dat AuthProvider bao ngoai de tuong lai neu WalletProvider can user data thi da co san.

### Kiem tra thu tu Provider

Da xac nhan: Khong co context nao trong `src/contexts/` import `useAuth`. AuthProvider co the dat o bat ky vi tri nao ben trong BrowserRouter. Dat bao ngoai WalletProvider la chon lua toi uu nhat.

### Ket qua

| Metric | Truoc | Sau |
|--------|-------|-----|
| Auth subscriptions | 5-10 / trang | 1 / toan app |
| getSession calls khi chuyen trang | 5-10 | 0 |
| checkBanStatus queries khi chuyen trang | 5-10 | 0 |
| Re-render khong can thiet | Co (setState dong thoi) | Khong (useMemo) |
| Memory leak khi sign out | Co the (state cu con ton) | Khong (clear sach) |

### Danh sach file

| STT | File | Thao tac |
|-----|------|----------|
| 1 | `src/contexts/AuthContext.tsx` | TAO MOI |
| 2 | `src/hooks/useAuth.tsx` | SUA - chuyen sang useContext |
| 3 | `src/App.tsx` | SUA - them AuthProvider |

