

## Nang cap Trang Xem Video FUN PLAY theo Chuan YouTube

### Phan tich Hien trang - DA CO SAN

Sau khi kiem tra ky toan bo ma nguon, **phan lon tinh nang da duoc xay dung day du**:

| Tinh nang | Trang thai | Chi tiet |
|-----------|-----------|----------|
| Play/Pause, Skip, Tua 10s/15s | DA CO | EnhancedVideoPlayer + YouTubeMobilePlayer |
| Volume control | DA CO | Slider + mute toggle + keyboard shortcuts |
| Playback speed (0.25x-2x) | DA CO | Settings dropdown voi 8 toc do |
| Fullscreen | DA CO | Desktop + Mobile voi orientation lock |
| Theater mode | DA CO | Nut RectangleHorizontal tren desktop |
| Mini player | DA CO | MiniPlayer + GlobalMiniPlayer + PiP |
| Autoplay + toggle | DA CO | VideoPlaybackContext + EnhancedVideoPlayer |
| Like/Dislike | DA CO | Watch.tsx voi toggle logic |
| Subscribe/Unsubscribe | DA CO | Realtime subscriber count |
| Share, Save playlist, Report | DA CO | ShareModal, AddToPlaylistModal, ReportSpamButton |
| Donate (Tang) | DA CO | DonateModal |
| Keyboard shortcuts | DA CO | Space, K, J, L, M, F, 0-9, Arrows |
| Ambient mode | DA CO | Canvas color sampling |
| Chapters | DA CO | parseChapters tu description |
| Anti-repeat (20 video) | DA CO | VideoPlaybackContext history |
| Shuffle + Repeat | DA CO | off/all/one modes |
| Loading skeleton | DA CO | Watch.tsx loading state |
| No page reload khi chuyen video | DA CO | goToVideo navigation |
| Queue management | DA CO | UpNextSidebar voi reorder, remove |
| View reward tracking | DA CO | 30% watch time threshold |
| Realtime updates | DA CO | Supabase channels for video + channel |
| Comment system | DA CO | VideoCommentList + CommentsDrawer |
| Spam detection | DA CO | suspicious_score, report_count auto-hide |

### Phan CAN NANG CAP (3 thay doi chinh)

---

### Thay doi 1: Nang cap thuat toan de xuat video

**Tep**: `src/contexts/VideoPlaybackContext.tsx`

**Van de hien tai**: Ham `fetchRelatedVideos` chi lay theo category, channel, roi trending. Khong loc `approval_status`, khong dam bao da dang kenh, khong uu tien chat luong.

**Giai phap**:
- Them filter `approval_status = 'approved'` va `is_hidden = false` vao tat ca query
- Them logic **channel diversity**: khong qua 2 video lien tiep tu cung 1 kenh
- Uu tien video tu kenh verified (is_verified = true)
- Giam hien thi video tu tai khoan moi (created_at < 7 ngay)
- Random co kiem soat de tang da dang

### Thay doi 2: Nang cap fetchRecommendedVideos trong Watch.tsx

**Tep**: `src/pages/Watch.tsx`

**Van de**: Ham `fetchRecommendedVideos` hien tai chi lay 20 video moi nhat, khong co thuat toan uu tien.

**Giai phap**:
- Them loc kenh da dang (it nhat 5 kenh khac nhau)
- Uu tien video co view_count cao
- Loai bo video tu kenh bi ban
- Them infinite loading khi cuon xuong trong UpNextSidebar

### Thay doi 3: Infinite scroll cho UpNextSidebar

**Tep**: `src/components/Video/UpNextSidebar.tsx`

**Van de**: Hien tai chi hien thi 10 video (`getUpNext(10)`), khong co tai them.

**Giai phap**:
- Tang so luong hien thi tu 10 len 20
- Them nut "Hien thi them" o cuoi danh sach
- Khi het video trong queue, tu dong fetch them video lien quan
- Them loading state khi dang tai

---

### Danh sach tep thay doi

| STT | Tep | Noi dung |
|-----|-----|---------|
| 1 | `src/contexts/VideoPlaybackContext.tsx` | Them approval_status filter, channel diversity, verified priority |
| 2 | `src/pages/Watch.tsx` | Nang cap fetchRecommendedVideos voi da dang kenh |
| 3 | `src/components/Video/UpNextSidebar.tsx` | Tang hien thi 20 video, them nut "Hien thi them" |

### Ket qua

- De xuat da kenh (it nhat 5 kenh khac nhau)
- Khong hien thi video chua duyet hoac bi an
- Uu tien kenh verified va video chat luong
- Khong trung lap video
- Co the tai them video khi cuon xuong
- Toan bo tinh nang player da co san duoc giu nguyen

