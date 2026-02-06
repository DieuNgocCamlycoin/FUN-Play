
# Thiet ke lai trang chu FUN PLAY - 5D Light Economy Style

## Tong quan

Thiet ke lai hoan toan right sidebar de tach thanh 3 card RIENG BIET (Honor Board, Top Ranking, Top Sponsors) theo phong cach glassmorphism + hologram UI cao cap, dong nhat voi Design System hien tai.

---

## Phan 1: Cau truc Layout

### 1.1 Layout 3 cot (Desktop)

```text
+------------------+------------------------+-------------------+
|   Left Sidebar   |      Video Feed        |   Right Sidebar   |
|   FUN ECOSYSTEM  |      (70-75%)          |   (320-400px)     |
|   (64px/240px)   |                        |   FIXED/STICKY    |
+------------------+------------------------+-------------------+
                   |                        | 1. HONOR BOARD    |
                   |                        | 2. TOP RANKING    |
                   |                        | 3. TOP SPONSORS   |
                   |                        +-------------------+
```

### 1.2 Layout Mobile

```text
+----------------------------------+
|          Video Feed              |
+----------------------------------+
|   HONOR BOARD (card rieng)       |
+----------------------------------+
|   TOP RANKING (card rieng)       |
+----------------------------------+
|   TOP SPONSORS (card rieng)      |
+----------------------------------+
```

---

## Phan 2: Thiet ke chi tiet cac Card

### 2.1 HONOR BOARD Card

**Style Card:**
- Nen glass: `bg-white/85 backdrop-blur-lg`
- Bo goc lon: `rounded-2xl`
- Vien hologram gradient: `border-2 border-transparent` voi `background-clip: border-box` gradient cyan -> magenta
- Shadow glow: `shadow-[0_0_30px_rgba(0,231,255,0.3)]`

**Tieu de:**
- Text: "HONOR BOARD" (viet hoa, font black, italic)
- Can giua
- Gradient text: `from-[#00E7FF] via-[#7A2BFF] to-[#FF00E5]`

**Noi dung Stats (5 muc):**
| Chi so | Icon | Du lieu |
|--------|------|---------|
| TOTAL USERS | Users | `stats.totalUsers` |
| TOTAL POSTS | FileText | Tu bang `posts` (them query) |
| TOTAL PHOTOS | Image | Tu `videos` category='photo' (neu co) hoac de trong |
| TOTAL VIDEOS | Video | `stats.totalVideos` |
| TOTAL REWARD | Coins | `stats.totalRewards` |

**Style moi stat pill:**
- Gradient TIM-HONG (giong tab "Tat ca"): `from-[#7A2BFF] via-[#FF00E5] to-[#FFD700]`
- Bo tron: `rounded-full`
- Padding: `px-3 py-2.5`
- Icon + Label ben trai (mau trang)
- So lon, dam, mau vang #FFD700 ben phai

**Interaction:**
- Hover: `hover:shadow-[0_0_40px_rgba(122,43,255,0.5)]` + rainbow shimmer
- Realtime update: pulse effect khi so thay doi

---

### 2.2 TOP RANKING Card

**Style Card:**
- Dong bo voi Honor Board (glass + hologram border)
- `bg-white/85 backdrop-blur-lg rounded-2xl`
- Vien gradient: `border-2` hologram

**Tieu de:**
- Text: "TOP RANKING" (viet hoa, font black, italic)
- Gradient hologram: `from-[#00E7FF] via-[#7A2BFF] to-[#FF00E5]`
- Icon Trophy ben trai

**Noi dung:**
- Danh sach 5 nguoi dung xep hang DOC
- Moi nguoi la mini-card voi:
  - Avatar tron ben trai (vien glow cho top 3)
  - Ten o giua (mau `#7A2BFF`)
  - Diem CAMLY ben phai (mau vang `#FFD700`)
- Top 1-3: glow noi bat hon, background gradient nhe

**Ranking icons:**
- #1: Huy chuong vang
- #2: Huy chuong bac
- #3: Huy chuong dong
- #4-5: So thu tu

**Interaction:**
- Hover item: `hover:scale-[1.02] hover:x-4` + glow nhe
- Click: chuyen huong den `/channel/{userId}`
- Nut "View All Ranking" -> `/leaderboard`

---

### 2.3 TOP SPONSORS Card

**Style Card:**
- Dong bo voi 2 card tren
- Glass + hologram border

**Tieu de:**
- Text: "TOP SPONSORS" (viet hoa)
- Icon Gem mau magenta `#FF00E5`

**Noi dung:**
- Danh sach sponsor (avatar + ten + so tien)
- Neu chua co: "No sponsors yet"

**Nut Donate:**
- Gradient: `from-[#FF00E5] via-[#7A2BFF] to-[#00E7FF]`
- Bo tron: `rounded-full`
- Glow nhe: `shadow-[0_0_15px_rgba(255,0,229,0.3)]`
- Hover: tang glow len
- Icon Heart + text "Donate to Project"

---

## Phan 3: Cap nhat Hook useHonobarStats

Them du lieu moi:

```text
- totalPosts: dem tu bang `posts`
- totalPhotos: dem tu videos co category photo (hoac dat 0 neu khong co)
```

---

## Phan 4: Chi tiet file can thay doi

### 4.1 src/components/Layout/HonoboardRightSidebar.tsx - VIET LAI

**Thay doi:**
- Tach thanh 3 component con rieng biet: `HonorBoardCard`, `TopRankingCard`, `TopSponsorsCard`
- Xep doc trong ScrollArea
- Ap dung glassmorphism + hologram border cho moi card
- Doi stat pills tu gradient xanh sang gradient TIM-HONG

### 4.2 src/components/Layout/HonorBoardCard.tsx - TAO MOI

**Tinh nang:**
- Card glass cao cap voi hologram border
- Tieu de "HONOR BOARD" gradient
- 5 stat pills (Users, Posts, Photos, Videos, Rewards)
- Realtime indicator
- Shimmer animation khi hover

### 4.3 src/components/Layout/TopRankingCard.tsx - TAO MOI

**Tinh nang:**
- Card glass dong bo
- Danh sach 5 nguoi dung xep hang
- Mini-card cho moi nguoi voi avatar, ten, diem
- Glow dac biet cho top 3
- Nut "View All Ranking"

### 4.4 src/components/Layout/TopSponsorsCard.tsx - TAO MOI

**Tinh nang:**
- Card glass dong bo
- Danh sach sponsor hoac "No sponsors yet"
- Nut "Donate to Project" gradient hong-tim

### 4.5 src/components/Layout/MobileHonoboardCard.tsx - CAP NHAT

**Thay doi:**
- Ap dung style glass moi
- Them POSTS va PHOTOS vao mini pills
- Giu layout compact cho mobile

### 4.6 src/components/Layout/MobileTopRankingCard.tsx - TACH LAM 2 FILE

**Thay doi:**
- Tach MobileTopRankingCard va MobileTopSponsorsCard rieng
- Moi file la 1 card doc lap
- Style dong bo voi desktop

### 4.7 src/hooks/useHonobarStats.tsx - CAP NHAT

**Them:**
```text
totalPosts: number;
totalPhotos: number;
```

**Query moi:**
- Fetch count tu bang `posts`
- Dem videos co category = 'photo' (neu co)

### 4.8 src/pages/Index.tsx - CAP NHAT

**Thay doi:**
- Trong mobile section: render 3 card rieng biet (HonorBoard, TopRanking, TopSponsors)
- Giu nguyen logic scroll va pull-to-refresh

---

## Phan 5: CSS/Tailwind moi can them

### 5.1 Hologram Border Gradient

```css
.hologram-border {
  background: linear-gradient(white, white) padding-box,
              linear-gradient(135deg, #00E7FF, #7A2BFF, #FF00E5) border-box;
  border: 2px solid transparent;
}
```

### 5.2 Glass Card

```css
.glass-card-premium {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}
```

### 5.3 Shimmer Animation

```css
@keyframes hologram-shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
```

---

## Phan 6: Responsive Breakpoints

| Breakpoint | Hien thi |
|------------|----------|
| xl (1280px+) | Right sidebar fixed, 3 cards xep doc |
| lg (1024-1279px) | Right sidebar an, cards trong main content |
| md (768-1023px) | 3 cards xep doc trong main content |
| sm (<768px) | 3 cards compact, stack doc |

---

## Phan 7: Animation va Interaction

### 7.1 Card Entrance

- `initial={{ opacity: 0, y: 20 }}`
- `animate={{ opacity: 1, y: 0 }}`
- Delay stagger: Honor Board (0s) -> Ranking (0.1s) -> Sponsors (0.2s)

### 7.2 Stat Update

- Khi so thay doi: `pulse` animation nhe tren so
- CounterAnimation da co san

### 7.3 Hover Effects

- Card: tang shadow, nhe nang card len (`translateY(-2px)`)
- Ranking items: truot sang phai, glow vien

---

## Phan 8: Tom tat file thay doi

| File | Hanh dong |
|------|-----------|
| `src/components/Layout/HonoboardRightSidebar.tsx` | Viet lai, dung 3 card con |
| `src/components/Layout/HonorBoardCard.tsx` | Tao moi |
| `src/components/Layout/TopRankingCard.tsx` | Tao moi |
| `src/components/Layout/TopSponsorsCard.tsx` | Tao moi |
| `src/components/Layout/MobileHonoboardCard.tsx` | Cap nhat style |
| `src/components/Layout/MobileTopRankingCard.tsx` | Cap nhat, chi giu ranking |
| `src/components/Layout/MobileTopSponsorsCard.tsx` | Tao moi |
| `src/hooks/useHonobarStats.tsx` | Them totalPosts, totalPhotos |
| `src/pages/Index.tsx` | Cap nhat mobile section render 3 cards |
| **Tong cong** | **9 files** |

---

## Phan 9: Preview giao dien

### Desktop Right Sidebar

```text
+------------------------------------------+
|            HONOR BOARD                   |
|    👑 (gradient title + crowns)          |
|    🟣 TOTAL USERS      1.2K              |
|    🟣 TOTAL POSTS      350               |
|    🟣 TOTAL PHOTOS     89                |
|    🟣 TOTAL VIDEOS     567               |
|    🟣 TOTAL REWARD     45.6K             |
|    ● Realtime                            |
+------------------------------------------+
|            TOP RANKING                   |
|    🏆 (gradient title)                   |
|    🥇 [avatar] Camly        4.5M         |
|    🥈 [avatar] M            4.3M         |
|    🥉 [avatar] L            3.2M         |
|    #4 [avatar] User4        2.8M         |
|    #5 [avatar] User5        2.1M         |
|    [ View All Ranking → ]                |
+------------------------------------------+
|            TOP SPONSORS                  |
|    💎 (gradient title)                   |
|    🥇 [avatar] Sponsor1     10K          |
|    🥈 [avatar] Sponsor2     8K           |
|    🥉 [avatar] Sponsor3     5K           |
|    [ ❤️ Donate to Project ]              |
+------------------------------------------+
```

