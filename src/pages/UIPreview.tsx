import { useState } from "react";
import { Search, Bell, Menu, MoreVertical, Play, Eye, Clock } from "lucide-react";
import { GlassPanel } from "@/components/Layout/GlassPanel";
import { FunEcosystemPanel } from "@/components/Layout/FunEcosystemPanel";
import { HonorRightPanel } from "@/components/Layout/HonorRightPanel";
import funplayLogo from "@/assets/funplay-logo.png";

// Mock data video preview
const MOCK_VIDEOS = [
  {
    id: "1",
    title: "Luật Ánh Sáng – Con đường tiến hóa tâm linh của nhân loại",
    channel: "Angel Quế Anh",
    views: "12.4K",
    time: "2 giờ trước",
    duration: "18:42",
    thumb: "https://picsum.photos/seed/v1/480/270",
    avatar: "https://picsum.photos/seed/a1/40/40",
  },
  {
    id: "2",
    title: "Hướng dẫn tham gia FUN FARM và nhận thưởng CAMLY",
    channel: "FUN Play Official",
    views: "8.1K",
    time: "5 giờ trước",
    duration: "12:15",
    thumb: "https://picsum.photos/seed/v2/480/270",
    avatar: "https://picsum.photos/seed/a2/40/40",
  },
  {
    id: "3",
    title: "Thiền định buổi sáng – Kết nối năng lượng vũ trụ",
    channel: "Thu Hương Meditation",
    views: "5.7K",
    time: "1 ngày trước",
    duration: "24:00",
    thumb: "https://picsum.photos/seed/v3/480/270",
    avatar: "https://picsum.photos/seed/a3/40/40",
  },
  {
    id: "4",
    title: "Build & Bounty Season 2 – Những dự án xuất sắc nhất",
    channel: "FUN Treasury",
    views: "3.2K",
    time: "2 ngày trước",
    duration: "31:08",
    thumb: "https://picsum.photos/seed/v4/480/270",
    avatar: "https://picsum.photos/seed/a4/40/40",
  },
  {
    id: "5",
    title: "CAMLY Coin – Tại sao đây là đồng coin của tương lai?",
    channel: "Vinh Nguyễn Finance",
    views: "15.8K",
    time: "3 ngày trước",
    duration: "22:30",
    thumb: "https://picsum.photos/seed/v5/480/270",
    avatar: "https://picsum.photos/seed/a5/40/40",
  },
  {
    id: "6",
    title: "FUN GREEN EARTH – Sứ mệnh bảo vệ hành tinh xanh",
    channel: "FUN Green Earth",
    views: "2.9K",
    time: "4 ngày trước",
    duration: "15:47",
    thumb: "https://picsum.photos/seed/v6/480/270",
    avatar: "https://picsum.photos/seed/a6/40/40",
  },
];

const FILTER_CHIPS = ["Tất cả", "Xu hướng", "Âm nhạc", "Thiền định", "Tài chính", "Giáo dục"];

/**
 * UIPreview – Trang xem trước giao diện 3 cột FUN PLAY.
 * Hoàn toàn độc lập, không ảnh hưởng layout thật.
 * Truy cập tại: /ui-preview
 */
const UIPreview = () => {
  const [activeFilter, setActiveFilter] = useState("Tất cả");

  return (
    <div
      className="min-h-screen relative"
      style={{
        background:
          "linear-gradient(135deg, #f8f4ff 0%, #eef6ff 30%, #f0fff8 60%, #fff8f0 100%)",
      }}
    >
      {/* Lớp trang trí nền – ánh sáng nhẹ */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 10% 50%, rgba(122,43,255,0.06) 0%, transparent 70%), radial-gradient(ellipse 50% 50% at 90% 50%, rgba(0,231,255,0.07) 0%, transparent 70%)",
        }}
      />

      {/* Badge Preview Mode */}
      <div className="fixed top-3 right-3 z-50">
        <span
          className="px-3 py-1 rounded-full text-xs font-bold shadow-lg"
          style={{
            background: "linear-gradient(135deg, #7A2BFF, #00E7FF)",
            color: "#fff",
          }}
        >
          👁 Preview Mode
        </span>
      </div>

      {/* ── HEADER GIẢ LẬP ─────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-40 w-full"
        style={{
          background: "rgba(255,255,255,0.70)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(255,255,255,0.40)",
        }}
      >
        <div className="max-w-[1560px] mx-auto px-4 h-14 flex items-center gap-4">
          {/* Logo + Menu */}
          <div className="flex items-center gap-3 shrink-0">
            <button className="p-1.5 rounded-lg hover:bg-black/5 transition-colors">
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
            <img
              src={funplayLogo}
              alt="FUN Play Logo"
              className="h-8 w-auto object-contain"
            />
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-[480px] mx-auto">
            <div
              className="flex items-center rounded-full px-4 py-2 gap-2"
              style={{
                background: "rgba(255,255,255,0.8)",
                border: "1px solid rgba(0,0,0,0.12)",
              }}
            >
              <Search className="w-4 h-4 text-gray-400 shrink-0" />
              <input
                type="text"
                placeholder="Tìm kiếm video, kênh, nhạc..."
                className="flex-1 text-sm bg-transparent outline-none text-gray-700 placeholder-gray-400"
                readOnly
              />
            </div>
          </div>

          {/* Actions bên phải */}
          <div className="flex items-center gap-2 ml-auto shrink-0">
            <button
              className="px-4 py-1.5 rounded-full text-xs font-semibold text-white shadow-sm"
              style={{
                background: "linear-gradient(135deg, #7A2BFF, #00E7FF)",
              }}
            >
              Đăng nhập
            </button>
            <button className="p-2 rounded-full hover:bg-black/5 transition-colors">
              <Bell className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </header>

      {/* ── BODY 3 CỘT ─────────────────────────────────────────────── */}
      <div className="relative z-10 max-w-[1560px] mx-auto px-4 py-5">
        <div className="flex gap-5 items-start">

          {/* ── LEFT PANEL (ẩn trên tablet/mobile) ────────────── */}
          <aside className="hidden xl:block w-[280px] shrink-0 sticky top-[76px] h-[calc(100vh-5rem)]">
            <FunEcosystemPanel />
          </aside>

          {/* ── CENTER CONTENT ───────────────────────────────── */}
          <main className="flex-1 min-w-0 space-y-4">

            {/* Filter Chips */}
            <div className="flex gap-2 flex-wrap">
              {FILTER_CHIPS.map((chip) => (
                <button
                  key={chip}
                  onClick={() => setActiveFilter(chip)}
                  className="px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-150"
                  style={
                    activeFilter === chip
                      ? {
                          background: "linear-gradient(135deg, #7A2BFF, #00E7FF)",
                          color: "#fff",
                          boxShadow: "0 2px 8px rgba(122,43,255,0.30)",
                        }
                      : {
                          background: "rgba(255,255,255,0.70)",
                          border: "1px solid rgba(0,0,0,0.10)",
                          color: "#555",
                        }
                  }
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Video Grid – 3 cột desktop / 2 tablet / 1 mobile */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {MOCK_VIDEOS.map((v) => (
                <VideoCard key={v.id} video={v} />
              ))}
            </div>
          </main>

          {/* ── RIGHT PANEL (ẩn trên mobile) ──────────────────── */}
          <aside className="hidden lg:block w-[320px] shrink-0 sticky top-[76px] h-[calc(100vh-5rem)]">
            <HonorRightPanel />
          </aside>
        </div>
      </div>
    </div>
  );
};

// ─── Component VideoCard ────────────────────────────────────────────────────
function VideoCard({ video }: { video: (typeof MOCK_VIDEOS)[0] }) {
  return (
    <div
      className="rounded-2xl overflow-hidden group cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
      style={{
        background: "rgba(255,255,255,0.85)",
        border: "1px solid rgba(0,0,0,0.06)",
        boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
      }}
    >
      {/* Thumbnail 16:9 */}
      <div className="relative w-full" style={{ aspectRatio: "16/9" }}>
        <img
          src={video.thumb}
          alt={video.title}
          className="w-full h-full object-cover"
        />
        {/* Duration badge */}
        <span
          className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded-md text-[10px] font-bold text-white"
          style={{ background: "rgba(0,0,0,0.75)" }}
        >
          {video.duration}
        </span>
        {/* Play overlay on hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-12 h-12 rounded-full bg-white/25 backdrop-blur-sm flex items-center justify-center">
            <Play className="w-6 h-6 text-white fill-white ml-0.5" />
          </div>
        </div>
      </div>

      {/* Info dưới */}
      <div className="p-3 flex gap-2.5">
        {/* Avatar kênh */}
        <img
          src={video.avatar}
          alt={video.channel}
          className="w-8 h-8 rounded-full object-cover shrink-0 mt-0.5"
        />
        {/* Text info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-xs font-semibold text-gray-900 line-clamp-2 leading-snug mb-1">
            {video.title}
          </h3>
          <p className="text-[10px] text-gray-500 font-medium">{video.channel}</p>
          <div className="flex items-center gap-1 mt-0.5 text-[10px] text-gray-400">
            <Eye className="w-3 h-3" />
            <span>{video.views}</span>
            <span className="mx-0.5">·</span>
            <Clock className="w-3 h-3" />
            <span>{video.time}</span>
          </div>
        </div>
        {/* 3 chấm */}
        <button className="p-0.5 rounded hover:bg-gray-100 h-fit mt-0.5 shrink-0">
          <MoreVertical className="w-3.5 h-3.5 text-gray-400" />
        </button>
      </div>
    </div>
  );
}

export default UIPreview;
