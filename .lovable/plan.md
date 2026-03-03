

## Bước tiếp theo: Tích hợp Livestream vào Navigation & Hoàn thiện tính năng

Hệ thống livestream cốt lõi (database, WebRTC hooks, pages, components) đã được xây dựng xong. Bước tiếp theo tập trung vào **tích hợp vào giao diện hiện tại** và **hoàn thiện các tính năng còn thiếu**.

---

### 1. Thêm "Phát sóng trực tiếp" vào menu Tạo (Header)

Trong dropdown menu "Tao" o Header, them mot muc moi:
- Icon: `Radio` (lucide-react, da import san)
- Label: "Phat song truc tiep"
- Navigate toi `/go-live`
- Dat ngay sau muc "Tai video len"

**File:** `src/components/Layout/Header.tsx` (dong 228-249)

---

### 2. Them muc "Live" vao Sidebar chinh

Them vao `mainNavItems` trong Sidebar:
- Icon: `Radio` (lucide-react)
- Label: "Truc tiep" 
- Href: `/live`
- Dat sau "Shorts"

**File:** `src/components/Layout/Sidebar.tsx` (dong 26-32)

---

### 3. Them nut "Go Live" vao Studio Sidebar

Them mot nut noi bat (mau do) o dau Studio Sidebar:
- Icon: `Radio`
- Label: "Phat song truc tiep"
- Navigate truc tiep toi `/go-live` (khong phai tab)
- Style: background do, text trang, noi bat hon cac menu item khac

**File:** `src/components/Studio/StudioSidebar.tsx` (dong 42-75)

---

### 4. Tich hop CAMLY Donation trong LiveWatch

Tai su dung component `EnhancedDonateModal` hien co:
- Them nut "Tang CAMLY" vao trang LiveWatch
- Context type = `livestream`, context_id = livestream ID
- Khi donation thanh cong, tu dong gui tin nhan vao livestream_chat voi message_type = `donation`

**File:** `src/pages/LiveWatch.tsx`

---

### 5. VOD Recording (Luu lai ban ghi)

Tich hop `MediaRecorder API` vao trang GoLive:
- Bat dau ghi khi streamer nhan "Bat dau phat song"
- Dung ghi khi ket thuc live
- Upload file WebM len storage
- Tao ban ghi trong bang `videos` voi source = `livestream`
- Cap nhat `livestreams.vod_video_id`

**File:** `src/pages/GoLive.tsx`, them hook `src/hooks/useMediaRecorder.ts`

---

### 6. Hien thi badge LIVE tren avatar streamer

Khi mot user dang live, hien thi badge "LIVE" nhap nhay tren avatar cua ho:
- Trang chu (video cards)
- Sidebar kenh dang ky
- Trang kenh ca nhan

**File:** Component moi `src/components/Live/LiveAvatarBadge.tsx`, cap nhat cac component hien thi avatar

---

### Thu tu uu tien thuc hien

| Thu tu | Cong viec | Do kho |
|--------|-----------|--------|
| 1 | Them Live vao Header menu + Sidebar | Thap |
| 2 | Them Go Live vao Studio Sidebar | Thap |
| 3 | Tich hop CAMLY Donation vao LiveWatch | Trung binh |
| 4 | VOD Recording voi MediaRecorder | Trung binh |
| 5 | Badge LIVE tren avatar | Thap |

### Ghi chu ky thuat

- Component `EnhancedDonateModal` can duoc kiem tra xem co ho tro `context_type = 'livestream'` chua, neu chua thi cap nhat
- `MediaRecorder` se ghi dinh dang WebM (codec VP8/Opus), tuong thich tot voi trinh duyet
- Badge LIVE can query bang `livestreams` de biet user nao dang phat song (status = 'live')
- Tat ca thay doi khong can migration database moi — chi la frontend integration

