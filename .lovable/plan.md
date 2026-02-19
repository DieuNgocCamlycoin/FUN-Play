
# Cap nhat Social Media Orbit & Settings

## Tong quan
He thong Diamond Badge va Social Orbit da duoc xay dung day du. Chi can cap nhat nho de khop voi yeu cau moi: doi ten "Fun Play" thanh "Fun Profile", bo Instagram, va sap xep lai thu tu.

## Thay doi chi tiet

### 1. `src/components/Profile/SocialMediaOrbit.tsx`
- Doi ten "Fun Play" thanh "Fun Profile" trong label
- Doi icon FunPlayIcon thanh icon phu hop hon cho "Fun Profile" (icon nguoi dung/profile)
- Bo Instagram khoi danh sach platforms (giam tu 10 xuong 9)
- Sap xep lai thu tu: Fun Profile, Angel AI, Facebook, YouTube, X/Twitter, Telegram, TikTok, LinkedIn, Zalo

### 2. `src/pages/ProfileSettings.tsx`
- Doi label "Fun Play" thanh "Fun Profile" trong form
- Bo truong Instagram khoi form
- Bo state `instagramUrl` va xoa khoi updateData
- Sap xep lai thu tu form: Fun Profile, Angel AI, Facebook, YouTube, X/Twitter, Telegram, TikTok, LinkedIn, Zalo
- Cap nhat text "toi da 10 nen tang" thanh "toi da 9 nen tang"

### 3. `src/components/Profile/ProfileHeader.tsx`
- Bo `instagramUrl` khoi props truyen cho SocialMediaOrbit
- Bo `instagram_url` khoi profile interface

### 4. `src/pages/UserProfile.tsx`
- Bo `instagram_url` khoi UserProfileData interface (giu trong DB, chi bo khoi UI)

## Ghi chu
- Khong can migration DB - cot `instagram_url` van ton tai trong DB nhung khong hien thi tren UI
- Diamond Badge va CSS sparkle effect giu nguyen - da hoan chinh
- Tat ca validation va hieu ung hien tai khong thay doi
