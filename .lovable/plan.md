

# Kế Hoạch Thêm Top 5 Ranking vào Trang Chủ

## Tổng Quan

Thêm danh sách Top 5 xếp hạng CAMLY Rewards ngay bên dưới Honor Board trên trang chủ, với nút "View All" dẫn đến trang `/leaderboard`. Thiết kế phù hợp với cả desktop và mobile.

---

## 1. Cấu Trúc Layout Mới

### Desktop (Right Sidebar)

```text
┌─────────────────────────────────────────────┐
│           👑 HONOR BOARD 👑                 │
│             ⚡ Realtime                     │
├─────────────────────────────────────────────┤
│  [Aurora Pill] TOTAL USERS          150    │
│  [Aurora Pill] TOTAL COMMENTS      1.2K    │
│  [Aurora Pill] TOTAL VIEWS         25K     │
│  [Aurora Pill] TOTAL VIDEOS         85     │
│  [Aurora Pill] CAMLY POOL          50M     │
├─────────────────────────────────────────────┤
│  🏆 TOP 10 CREATORS (by Views)             │  ← Giữ nguyên
│  ┌─────────────────────────────────────┐    │
│  │ 🥇 Creator A                        │    │
│  │ 🥈 Creator B                        │    │
│  │ ...                                 │    │
│  └─────────────────────────────────────┘    │
├─────────────────────────────────────────────┤
│  🏅 TOP 5 RANKING (by CAMLY Rewards)  NEW! │  ← Component mới
│  ┌─────────────────────────────────────┐    │
│  │ 🥇 User A           1,250,000 CAMLY │    │
│  │ 🥈 User B             980,500 CAMLY │    │
│  │ 🥉 User C             750,000 CAMLY │    │
│  │ #4 User D             500,000 CAMLY │    │
│  │ #5 User E             350,000 CAMLY │    │
│  └─────────────────────────────────────┘    │
│         [ View All Ranking →]              │ ← Button navigate
└─────────────────────────────────────────────┘
```

### Mobile (Homepage Card + Modal)

```text
┌─────────────────────────────────────────────┐
│ 👑 HONOR BOARD                        [→]   │
├─────────────────────────────────────────────┤
│ [👥 77] [🎬 85] [👁 10K] [💰 50M]           │
├─────────────────────────────────────────────┤
│ 🏆 Top: Creator Name            ⚡Live      │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐  ← Card mới bên dưới
│ 🏅 TOP RANKING                        [→]   │
├─────────────────────────────────────────────┤
│ 🥇 User A  1.25M  🥈 User B  980K  🥉 ...  │ ← Compact 3 users
├─────────────────────────────────────────────┤
│         [ View All Ranking →]              │
└─────────────────────────────────────────────┘
```

---

## 2. Files Cần Tạo / Chỉnh Sửa

### File Mới: `src/components/Layout/TopRankingSection.tsx`

Component này hiển thị Top 5 CAMLY Rewards ranking, dùng chung cho desktop sidebar và mobile.

**Props:**
```tsx
interface TopRankingSectionProps {
  users: LeaderboardUser[];
  loading: boolean;
  maxItems?: number; // Default 5
  onViewAll: () => void;
  compact?: boolean; // True cho mobile card view
}
```

**Chức năng:**
- Fetch top 5 users từ profiles table (order by `total_camly_rewards` DESC)
- Hiển thị avatar, tên, và CAMLY Rewards
- Ranking badges (🥇, 🥈, 🥉, #4, #5)
- Nút "View All" dẫn đến /leaderboard
- Aurora theme colors phù hợp design system

### File Mới: `src/components/Layout/MobileTopRankingCard.tsx`

Component compact cho mobile homepage, tương tự `MobileHonoboardCard`.

**Chức năng:**
- Hiển thị Top 3 preview compact
- Tap để navigate đến /leaderboard
- Aurora gradient styling

### File Mới: `src/hooks/useTopRanking.ts`

Custom hook để fetch Top 5 CAMLY Rewards từ database.

```tsx
interface LeaderboardUser {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  total_camly_rewards: number;
}

export const useTopRanking = (limit: number = 5) => {
  // Fetch from profiles table
  // Realtime subscription for updates
  // Return { users, loading }
}
```

### Chỉnh Sửa: `src/components/Layout/HonoboardRightSidebar.tsx`

Thêm `TopRankingSection` bên dưới section "Top 10 Creators".

**Vị trí thêm:**
- Sau `<motion.div>` của Top 10 Creators (line ~227)
- Trước FUN Play Branding section

### Chỉnh Sửa: `src/pages/Index.tsx`

Thêm `MobileTopRankingCard` bên dưới `MobileHonoboardCard`.

**Vị trí thêm:**
- Line ~277, sau `MobileHonoboardCard`
- Chỉ hiển thị trên mobile (`xl:hidden`)

---

## 3. Chi Tiết Component

### TopRankingSection (Desktop)

```tsx
<motion.div className="p-3 rounded-xl bg-gradient-to-br from-[#F0FDFF] via-white to-[#FFF8F0] border border-[#00E7FF]/25">
  {/* Header */}
  <div className="flex items-center justify-between mb-3">
    <h3 className="text-xs font-semibold uppercase tracking-wide flex items-center gap-2">
      <Trophy className="h-4 w-4 text-[#FFD700]" />
      Top 5 Ranking
    </h3>
    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
      <Coins className="h-3 w-3 text-[#FFD700]" />
      CAMLY Rewards
    </div>
  </div>

  {/* User List */}
  <div className="space-y-1.5">
    {users.slice(0, 5).map((user, index) => (
      <RankingItem key={user.id} user={user} rank={index + 1} />
    ))}
  </div>

  {/* View All Button */}
  <Button 
    variant="ghost" 
    onClick={() => navigate('/leaderboard')}
    className="w-full mt-3 text-xs bg-gradient-to-r from-[#00E7FF]/10 to-[#FFD700]/10 
      hover:from-[#00E7FF]/20 hover:to-[#FFD700]/20
      border border-[#00E7FF]/30"
  >
    View All Ranking
    <ChevronRight className="h-4 w-4 ml-1" />
  </Button>
</motion.div>
```

### RankingItem Component

```tsx
const RankingItem = ({ user, rank }) => (
  <motion.div 
    whileHover={{ x: 4, scale: 1.02 }}
    className={cn(
      "flex items-center gap-2 p-2 rounded-lg transition-all",
      "hover:bg-[#F0FDFF] cursor-pointer",
      rank === 1 && "bg-gradient-to-r from-[#FFF8E1] to-transparent border border-[#FFD700]/30",
      rank === 2 && "bg-gradient-to-r from-gray-100/50 to-transparent",
      rank === 3 && "bg-gradient-to-r from-orange-50/50 to-transparent"
    )}
    onClick={() => navigate(`/@${user.username}`)}
  >
    {/* Rank Badge */}
    <span className="w-6 text-center font-medium text-sm">
      {getRankBadge(rank)}
    </span>
    
    {/* Avatar */}
    <Avatar className={cn("h-7 w-7 border-2", getRankBorderClass(rank))}>
      <AvatarImage src={user.avatar_url} />
      <AvatarFallback>{user.display_name?.[0] || user.username[0]}</AvatarFallback>
    </Avatar>
    
    {/* Name + Rewards */}
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium truncate text-[#7A2BFF]">
        {user.display_name || user.username}
      </p>
    </div>
    
    {/* CAMLY Value */}
    <div className="text-right">
      <span className="text-xs font-bold text-[#FFD700] drop-shadow-[0_0_4px_rgba(255,215,0,0.4)]">
        <CounterAnimation value={user.total_camly_rewards} />
      </span>
      <span className="text-[10px] text-muted-foreground ml-0.5">CAMLY</span>
    </div>
  </motion.div>
);
```

### MobileTopRankingCard

```tsx
<motion.button
  onClick={() => navigate('/leaderboard')}
  whileTap={{ scale: 0.98 }}
  className={cn(
    "w-full p-3 rounded-xl",
    "bg-gradient-to-r from-white via-[#F0FDFF] to-[#FFF8F0]",
    "border border-[#00E7FF]/40",
    "shadow-[0_0_20px_rgba(0,231,255,0.15)]",
    "hover:shadow-[0_0_25px_rgba(122,43,255,0.25)]"
  )}
>
  {/* Header */}
  <div className="flex items-center justify-between mb-2">
    <div className="flex items-center gap-2">
      <Trophy className="h-5 w-5 text-[#FFD700]" />
      <span className="font-black text-sm italic bg-gradient-to-r from-[#00E7FF] via-[#7A2BFF] to-[#FFD700] bg-clip-text text-transparent">
        TOP RANKING
      </span>
    </div>
    <ChevronRight className="h-4 w-4 text-muted-foreground" />
  </div>

  {/* Top 3 Preview */}
  <div className="flex items-center gap-2 py-2">
    {/* Top 3 compact pills */}
    <MiniRankPill rank={1} user={users[0]} />
    <MiniRankPill rank={2} user={users[1]} />
    <MiniRankPill rank={3} user={users[2]} />
  </div>

  {/* View All Text */}
  <div className="mt-2 pt-2 border-t border-[#00E7FF]/20 text-center">
    <span className="text-xs text-[#7A2BFF] font-medium">
      View All Ranking →
    </span>
  </div>
</motion.button>
```

---

## 4. Data Flow

### useTopRanking Hook

```tsx
export const useTopRanking = (limit: number = 5) => {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRanking = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url, total_camly_rewards")
        .order("total_camly_rewards", { ascending: false })
        .limit(limit);
      
      if (!error) setUsers(data || []);
      setLoading(false);
    };

    fetchRanking();

    // Realtime subscription
    const channel = supabase
      .channel("top-ranking")
      .on("postgres_changes", 
        { event: "*", schema: "public", table: "profiles" }, 
        fetchRanking
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [limit]);

  return { users, loading };
};
```

---

## 5. Visual Design (Aurora Theme)

### Color Palette

| Element | Color | HEX |
|---------|-------|-----|
| Header Gradient | Cyan → Purple → Gold | `from-[#00E7FF] via-[#7A2BFF] to-[#FFD700]` |
| Card Background | White → Light Cyan | `from-white via-[#F0FDFF] to-[#FFF8F0]` |
| Border | Cosmic Cyan | `border-[#00E7FF]/40` |
| CAMLY Value | Cosmic Gold | `text-[#FFD700]` |
| Username | Cosmic Purple | `text-[#7A2BFF]` |
| Rank 1 Glow | Gold glow | `shadow-[0_0_15px_rgba(255,215,0,0.5)]` |

### Button Styling

```css
/* View All Button */
.view-all-btn {
  background: linear-gradient(to right, rgba(0,231,255,0.1), rgba(255,215,0,0.1));
  border: 1px solid rgba(0,231,255,0.3);
  border-radius: 8px;
}

.view-all-btn:hover {
  background: linear-gradient(to right, rgba(0,231,255,0.2), rgba(255,215,0,0.2));
  box-shadow: 0 0 15px rgba(0,231,255,0.2);
}
```

---

## 6. Files Summary

| File | Action | Description |
|------|--------|-------------|
| `src/hooks/useTopRanking.ts` | **Tạo mới** | Hook fetch Top 5 CAMLY từ database |
| `src/components/Layout/TopRankingSection.tsx` | **Tạo mới** | Component Top 5 cho desktop sidebar |
| `src/components/Layout/MobileTopRankingCard.tsx` | **Tạo mới** | Compact card cho mobile |
| `src/components/Layout/HonoboardRightSidebar.tsx` | **Chỉnh sửa** | Thêm TopRankingSection sau Top 10 Creators |
| `src/pages/Index.tsx` | **Chỉnh sửa** | Thêm MobileTopRankingCard trên mobile |

---

## 7. Thứ Tự Triển Khai

1. **Tạo `useTopRanking.ts`** - Hook fetch dữ liệu
2. **Tạo `TopRankingSection.tsx`** - Component desktop với Aurora styling
3. **Tạo `MobileTopRankingCard.tsx`** - Component mobile compact
4. **Chỉnh sửa `HonoboardRightSidebar.tsx`** - Thêm section mới
5. **Chỉnh sửa `Index.tsx`** - Thêm card mobile

---

## 8. Kết Quả Mong Đợi

| Tính năng | Mô tả |
|-----------|-------|
| Top 5 Desktop | Hiển thị dưới Top 10 Creators trong sidebar |
| Top 3 Mobile | Compact card preview trên homepage |
| View All Button | Navigate đến /leaderboard |
| Aurora Theme | Colors phù hợp design system |
| Realtime Updates | Tự động cập nhật khi data thay đổi |
| Click to Profile | Tap user để xem profile |
| Animations | Framer Motion hover/tap effects |

