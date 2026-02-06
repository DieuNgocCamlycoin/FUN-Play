

# Di chuyen "Phong cach nhac" thanh muc rieng

## Hien tai
- Dong "Kids Pop / Happy Children's Song - vocal" hien thi ngay duoi ten bai hat
- Thong tin nay nam trong phan Title & Info

## Thay doi

### File: `src/pages/AIMusicDetail.tsx`

**Bo dong style khoi phan Title & Info (dong 193-195)**
- Xoa dong `{music.style} - {music.instrumental ? "Instrumental" : music.voice_type}` tu ngay duoi ten bai hat

**Them muc "Phong cach nhac" moi**
- Dat ngay truoc phan "Loi bai hat" (truoc dong 249)
- Thiet ke giong het phan "Loi bai hat": card trang mo (bg-white/50 backdrop-blur-sm rounded-2xl), co icon va tieu de
- Noi dung hien thi: style va loai giong hat (vocal/instrumental)
- Su dung icon Music cho tieu de

**Giao dien muc moi:**
```text
+------------------------------------------+
| [Music icon] Phong cach nhac             |
|                                          |
|  Kids Pop / Happy Children's Song        |
|  Loai: Vocal                             |
+------------------------------------------+
```

## Tom tat
- 1 file thay doi: `src/pages/AIMusicDetail.tsx`
- Bo dong style tu vi tri cu (duoi ten bai hat)
- Them section "Phong cach nhac" moi voi thiet ke dong nhat voi "Loi bai hat"
