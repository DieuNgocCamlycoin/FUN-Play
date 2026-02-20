

## Dong bo so user: 374 thay vi 136

### Van de hien tai

Ham `is_completed_profile(p)` dang yeu cau avatar, custom username, display name >= 2 ky tu. Chi 136/374 user thoa man. Ca Honor Board va User Directory deu dung ham nay nen chi hien 136.

### Thay doi

#### 1. SQL Migration (1 file)

**Cap nhat `is_completed_profile()` - chi check banned:**

```sql
CREATE OR REPLACE FUNCTION public.is_completed_profile(p profiles)
RETURNS boolean LANGUAGE sql IMMUTABLE AS $$
  SELECT COALESCE(p.banned, false) = false;
$$;
```

**Cap nhat `get_public_users_directory()` - dung `is_completed_profile` + sap xep uu tien:**

- Thay WHERE hardcoded thanh `WHERE is_completed_profile(p)`
- Them ORDER BY uu tien: user co avatar va display_name len truoc, sau do theo total_camly
- Dung `SECURITY DEFINER` (da co san)

```sql
ORDER BY 
  (p.avatar_url IS NOT NULL AND p.display_name IS NOT NULL 
   AND LENGTH(TRIM(p.display_name)) >= 2) DESC,
  rt.total_camly DESC NULLS LAST
```

**Cap nhat `mv_top_ranking` materialized view** - cung dung `is_completed_profile`:

```sql
DROP MATERIALIZED VIEW IF EXISTS mv_top_ranking;
CREATE MATERIALIZED VIEW mv_top_ranking AS
SELECT id, username, display_name, avatar_url, total_camly_rewards
FROM profiles p
WHERE is_completed_profile(p)
  AND COALESCE(total_camly_rewards, 0) > 0
ORDER BY total_camly_rewards DESC NULLS LAST
LIMIT 100;
```

#### 2. Frontend - Khong can thay doi

Sau khi kiem tra ky:

- **`UsersDirectory.tsx`**: Client-side filter chi lam search text va time filter (hop le, khong du thua). Database da loc user banned/invalid.
- **`HonorBoardCard.tsx`**: Khong co logic loc nao, chi hien thi so tu RPC.
- **`useHonobarStats.tsx`**: Chi goi RPC, khong loc.
- **`usePublicUsersDirectory.ts`**: Chi goi RPC va map data, khong loc.

Ket luan: **0 file React can thay doi**. Tat ca logic loc da nam o Database.

### Ket qua sau thay doi

| Truoc | Sau |
|-------|-----|
| Honor Board: 136 users | Honor Board: 374 users |
| User Directory: 136 users | User Directory: 374 users |
| User chua co avatar bi an | User chua co avatar hien thi voi fallback |
| Sap xep chi theo CAMLY | User co avatar/ten ro rang len truoc |

### Danh sach thay doi

| STT | Thay doi | Loai |
|-----|---------|------|
| 1 | Cap nhat `is_completed_profile()` chi check banned | SQL Migration |
| 2 | Cap nhat WHERE trong `get_public_users_directory()` dung `is_completed_profile(p)` | SQL Migration |
| 3 | Them ORDER BY uu tien avatar + display_name | SQL Migration |
| 4 | Cap nhat `mv_top_ranking` dung `is_completed_profile(p)` | SQL Migration |

Tat ca trong 1 migration duy nhat, su dung `SECURITY DEFINER`.
