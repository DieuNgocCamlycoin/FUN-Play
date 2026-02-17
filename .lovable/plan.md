

# Xoa Diamond Badge va Kiem tra He thong Social Media + Username

## Thay doi

### 1. Xoa CredibilityDiamond khoi avatar

**File: `src/components/Profile/ProfileHeader.tsx`**
- Xoa dong import `CredibilityDiamond`
- Xoa dong `<CredibilityDiamond totalCamly={profile.total_camly_rewards} />`
- Xoa `total_camly_rewards` khoi interface `ProfileHeaderProps` (neu khong con dung)

**File: `src/components/Profile/CredibilityDiamond.tsx`**
- Xoa toan bo file nay vi khong con duoc su dung

### 2. Don dep ProfileHeader interface
- Bo `total_camly_rewards` khoi props profile trong `ProfileHeaderProps` vi chi duoc dung cho diamond
- Giu nguyen SocialMediaOrbit va cac social fields

### Khong thay doi
- `SocialMediaOrbit.tsx` -- da sua mau dung (#1DA1F2, #69C9D0), hoat dong tot
- `UserProfile.tsx` -- interface da co du 5 social fields
- `ProfileSettings.tsx` -- da bo `as any`, hoat dong tot
- Database -- cac cot social da ton tai

## Tom tat
- Xoa 1 file: `CredibilityDiamond.tsx`
- Sua 1 file: `ProfileHeader.tsx` (bo import + usage)
- Khong anh huong den social media icons hay bat ky tinh nang nao khac

