

## Giảm kích thước pill mã ví và link profile

### Thay đổi

Giảm padding, font size và kích thước icon/button bên trong 2 pill (mã ví + link profile) để chúng gọn hơn, không chiếm quá nhiều diện tích so với các mục khác.

### File thay đổi

| File | Nội dung |
|---|---|
| `src/components/Profile/ProfileInfo.tsx` | Giảm kích thước 2 pill ở dòng 131 và 149 |

### Chi tiết kỹ thuật

Thay đổi class CSS cho cả 2 pill (wallet address và profile link):

| Thuộc tính | Hiện tại | Sau khi sửa |
|---|---|---|
| Padding pill | `px-4 py-2` | `px-3 py-1` |
| Icon size (Wallet, Link) | `w-4 h-4` | `w-3.5 h-3.5` |
| Font size text | `text-sm` | `text-xs` |
| Gap trong pill | `gap-2.5` | `gap-2` |
| Copy button size | `h-7 w-7` | `h-5 w-5` |
| Copy icon size | `w-4 h-4` | `w-3 h-3` |

Tổng cộng giảm chiều cao pill từ khoảng 40px xuống còn khoảng 28-30px, phù hợp hơn với các thành phần khác trên trang.

