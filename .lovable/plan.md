

# Xoa trigger trung lap tren bang video_reports

## Van de

Hien tai co 2 trigger tren bang `video_reports` deu goi cung function `handle_video_report()`:
- `on_video_report_insert`
- `on_video_report_inserted`

Dieu nay khien moi lan bao cao video, `report_count` tang 2 thay vi 1, va video chi can 3 bao cao (thay vi 5) la bi auto-hide.

## Giai phap

Xoa trigger cu `on_video_report_insert`, giu lai `on_video_report_inserted` (trigger moi tao).

### Database Migration

```text
DROP TRIGGER IF EXISTS on_video_report_insert ON public.video_reports;
```

### Dong bo lai du lieu

Sau khi xoa trigger trung, can cap nhat lai `report_count` cho chinh xac (vi truoc do co the da bi tang gap doi):

```text
UPDATE videos v
SET report_count = COALESCE(sub.cnt, 0)
FROM (
  SELECT video_id, COUNT(*) as cnt
  FROM video_reports
  GROUP BY video_id
) sub
WHERE v.id = sub.video_id
  AND v.report_count != sub.cnt;
```

### Khong can thay doi code

Khong co thay doi frontend. Chi la sua database.

## Ket qua

| Thay doi | Chi tiet |
|----------|----------|
| Migration SQL | Xoa trigger `on_video_report_insert` |
| Data sync | Cap nhat lai `report_count` chinh xac |

