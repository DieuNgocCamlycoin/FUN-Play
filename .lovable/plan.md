

# Nang cap giao dien trang ca nhan Web3 - Diamond & Social Orbit

## Tong quan

Nang cap avatar tren trang ca nhan voi: (1) Kim cuong trang tri phia tren avatar thay doi mau theo Light Score / trang thai tai khoan, (2) Mo rong Social Orbit len 10 nen tang voi bo cuc doi xung 360 do (tranh chong len kim cuong), (3) Trang Settings them 5 truong moi (Angel AI, Fun Play, Instagram, LinkedIn, Zalo), (4) Hieu ung kim cuong CSS thuan (khong dung JS animation).

## Chi tiet ky thuat

### Buoc 1: Database Migration - Them 5 cot moi vao bang profiles

```text
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS angelai_url text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS funplay_url text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS instagram_url text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS linkedin_url text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS zalo_url text;
```

### Buoc 2: Tao component `DiamondBadge.tsx`

File moi: `src/components/Profile/DiamondBadge.tsx`

- Nhan props: `lightScore: number`, `banned: boolean`, `violationLevel: number`
- Logic mau kim cuong:
  - Banned = true: Mau xam (#9CA3AF)
  - violation_level >= 3 (PROHIBITED): Mau den (#1F2937)
  - Light Score >= 80: Mau vang kim (#FFD700) - Diamond Gold
  - Light Score >= 60: Mau xanh cyan (#00E7FF) - Diamond Cyan
  - Light Score >= 40: Mau xanh la (#22C55E) - Diamond Green
  - Light Score < 40: Mau trang (#E5E7EB) - Diamond Silver
- Diamond duoc ve bang SVG inline (hinh kim cuong don gian)
- Hieu ung CSS: `@keyframes diamond-sparkle` - tia sang chay qua mat kim cuong
- Vi tri: absolute, top cua avatar container, center ngang, z-30

### Buoc 3: Cap nhat `SocialMediaOrbit.tsx`

Mo rong danh sach platforms len 10:

```text
1. Angel AI   - mau: #FFD700 (gold)    - icon: SVG custom (ngoi sao/thien than)
2. Fun Play   - mau: #00E7FF (cyan)    - icon: SVG custom (play button)
3. Facebook   - mau: #1877F2           - icon: Facebook (lucide)
4. YouTube    - mau: #FF0000           - icon: Youtube (lucide)
5. Twitter/X  - mau: #1DA1F2           - icon: XIcon (custom SVG)
6. Telegram   - mau: #0088cc           - icon: Send (lucide)
7. TikTok     - mau: #69C9D0           - icon: TikTokIcon (custom SVG)
8. Instagram  - mau: #E4405F           - icon: Instagram (lucide)
9. LinkedIn   - mau: #0A66C2           - icon: Linkedin (lucide)
10. Zalo      - mau: #0068FF           - icon: SVG custom
```

- Thay doi goc trai: Tu arc 140 do (bottom) sang 360 do tru vung kim cuong (top 60 do)
- Cong thuc moi: Spread tu 30 do den 330 do (tranh vung 330-30 do la noi kim cuong nam)
- Border cua moi circle: 2px solid voi mau dac trung cua platform (thay vi backgroundColor)
- Background: dark/semi-transparent de icon noi bat
- Props moi: them `angelaiUrl`, `funplayUrl`, `instagramUrl`, `linkedinUrl`, `zaloUrl`

### Buoc 4: Cap nhat `ProfileHeader.tsx`

- Import `DiamondBadge`
- Truyen them props cho ProfileHeader: `lightScore`, `banned`, `violationLevel`
- Dat `DiamondBadge` phia tren avatar (truoc Social Orbit)
- Truyen 5 URL moi cho `SocialMediaOrbit`

### Buoc 5: Cap nhat `UserProfile.tsx`

- Them vao `UserProfileData` interface: `angelai_url`, `funplay_url`, `instagram_url`, `linkedin_url`, `zalo_url`, `violation_level`, `banned`
- Tinh `lightScore` don gian tu `total_camly_rewards` (hoac truyen tu hook hien co)
- Truyen cac props moi cho `ProfileHeader`

### Buoc 6: Cap nhat `ProfileSettings.tsx`

- Them 5 state moi: `angelaiUrl`, `funplayUrl`, `instagramUrl`, `linkedinUrl`, `zaloUrl`
- Fetch va save 5 truong moi
- UI form theo thu tu yeu cau:
  1. Angel AI
  2. Fun Play
  3. Facebook
  4. YouTube
  5. Twitter/X
  6. Telegram
  7. TikTok
  8. Instagram
  9. LinkedIn
  10. Zalo

### Buoc 7: Them CSS animation vao `index.css`

```text
@keyframes diamond-sparkle {
  0%, 100% { opacity: 0; transform: translateX(-100%) rotate(45deg); }
  50% { opacity: 0.8; transform: translateX(100%) rotate(45deg); }
}
```

Pure CSS, khong dung framer-motion cho diamond de toi uu toc do.

## Tom tat file thay doi

| File | Hanh dong |
|------|-----------|
| Database migration | Them 5 cot moi: angelai_url, funplay_url, instagram_url, linkedin_url, zalo_url |
| `DiamondBadge.tsx` | TAO MOI - Component kim cuong voi mau theo Light Score |
| `SocialMediaOrbit.tsx` | SUA - Mo rong 10 platform, doi xung 360 do, tranh kim cuong |
| `ProfileHeader.tsx` | SUA - Them DiamondBadge, truyen props moi |
| `UserProfile.tsx` | SUA - Them fields moi vao interface, truyen props |
| `ProfileSettings.tsx` | SUA - Them 5 truong social media moi, sap xep lai thu tu |
| `index.css` | SUA - Them @keyframes diamond-sparkle |

