

# Căn giữa Avatar và thông tin tài khoản trên giao diện di động

## Vấn đề hiện tại
- Avatar được đặt ở vị trí `absolute` bên trái (không căn giữa)
- Thông tin tài khoản (tên, username, bio, wallet) có `pl-36` padding bên trái để nằm cạnh avatar
- Trên mobile, layout này bị lệch sang trái, không đẹp mắt

## Thay đổi

### 1. `src/components/Profile/ProfileHeader.tsx`
- Trên mobile: căn giữa avatar bằng cách thêm `left-1/2 -translate-x-1/2` cho `motion.div` chứa avatar (chỉ áp dụng `md:left-auto md:translate-x-0` cho desktop để giữ nguyên layout cũ)

### 2. `src/components/Profile/ProfileInfo.tsx`
- Trên mobile: bỏ `pl-36` và thay bằng `items-center text-center` cho phần thông tin
- Trên desktop (md trở lên): giữ nguyên `md:pl-44 lg:pl-52 md:text-left md:items-start`
- Các phần con (tên, username, bio, wallet, action buttons) cũng sẽ căn giữa trên mobile

## Chi tiết kỹ thuật

**ProfileHeader.tsx (dòng 58-63):**
- Đổi class của `motion.div` từ `absolute -top-20 md:-top-24 lg:-top-28` thành `absolute -top-20 md:-top-24 lg:-top-28 left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0`

**ProfileHeader.tsx (dòng 121):**
- Tăng spacer height trên mobile để bù cho avatar căn giữa: `h-24 md:h-20 lg:h-24`

**ProfileInfo.tsx (dòng 97):**
- Đổi `pl-36 md:pl-44 lg:pl-52` thành `items-center md:items-start md:pl-44 lg:pl-52`

**ProfileInfo.tsx (dòng 99-101):**
- Thêm `justify-center md:justify-start` cho dòng display name

**ProfileInfo.tsx (dòng 111):**
- Thêm `justify-center md:justify-start` cho dòng username/stats

**ProfileInfo.tsx (dòng 123):**
- Thêm `text-center md:text-left` cho bio

**ProfileInfo.tsx (dòng 129):**
- Thêm `justify-center md:justify-start` cho wallet/link row

**ProfileInfo.tsx (dòng 171):**
- Đổi `pl-36 md:pl-44 lg:pl-0` thành `justify-center md:justify-start md:pl-0` cho action buttons

