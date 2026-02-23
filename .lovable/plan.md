

## Di chuyển "Báo cáo kênh" sang bên phải tab "Giới thiệu"

### Thay đổi

Chuyển nút "Báo cáo kênh" từ vị trí hiện tại (phía trên tabs, đứng riêng) vào trong thanh tab, đặt ngay bên phải của tab "Giới thiệu".

### File thay đổi

| File | Thay đổi |
|---|---|
| `src/pages/Channel.tsx` | Xoa block ReportChannelButton (dong 408-413), truyen `channelId` va `isOwnProfile` da co san cho `ProfileTabs` |
| `src/components/Profile/ProfileTabs.tsx` | Them prop `showReportButton`, them tab "Bao cao kenh" (icon: Flag) sau "Gioi thieu" khi `!isOwnProfile && channelId`, tab nay khong chuyen noi dung ma mo dialog bao cao |

### Chi tiet ky thuat

1. **Channel.tsx**: Xoa dong 408-413 (block `ReportChannelButton` dung rieng)

2. **ProfileTabs.tsx**:
   - Them props: `showReportButton?: boolean`
   - Import `ReportChannelButton` va `Flag` icon
   - Them 1 tab trigger nua sau "Gioi thieu" voi label "Bao cao kenh" va icon Flag, chi hien khi `showReportButton && channelId` co gia tri
   - Khi click tab nay, mo dialog bao cao kenh (su dung `ReportChannelButton` ben trong `TabsContent`)

