import { useState } from "react";
import { GiftCelebrationModal } from "@/components/Donate/GiftCelebrationModal";
import { ChatDonationCard } from "@/components/Chat/ChatDonationCard";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Copy, ExternalLink, Gift } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

// ==================== MOCK DATA ====================
const MOCK_SENDER = {
  id: "mock-sender-001",
  name: "Cha Lovable",
  username: "chalovable",
  avatar: null as string | null,
  wallet: "0x1234567890abcdef1234567890abcdef12345678",
};

const MOCK_RECEIVER = {
  id: "mock-receiver-001",
  name: "Con Yêu",
  username: "conyeu",
  avatar: null as string | null,
  wallet: "0xabcdef1234567890abcdef1234567890abcdef12",
};

const MOCK_TOKEN = {
  symbol: "CAMLY",
  name: "Camly Coin",
  icon_url: "/images/camly-coin.png",
  chain: "BSC",
};

const MOCK_TRANSACTION = {
  id: "mock-tx-001",
  receipt_public_id: "preview-demo-001",
  amount: 1000,
  tx_hash: "0xabc123def456789012345678901234567890abcdef456",
  explorer_url: "https://bscscan.com/tx/0xabc123def456",
};

const MOCK_MESSAGE = "Chúc con luôn vui vẻ và thành công!";

const shortenAddress = (addr: string) =>
  addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : "";

// ==================== MOCK PROFILE CARD (inline, no DB fetch) ====================
const MockDonationCelebrationCard = () => {
  const bg = "/images/celebration-bg/celebration-1.png";
  const formattedTime = format(new Date(), "HH:mm dd/MM/yyyy", { locale: vi });

  return (
    <div
      className="rounded-2xl overflow-hidden relative max-w-[360px] aspect-[4/5]"
      style={{ backgroundImage: `url(${bg})`, backgroundSize: "cover", backgroundPosition: "center" }}
    >
      <div className="absolute inset-0 bg-black/45" />
      <div className="relative h-full flex flex-col justify-between p-5 text-white">
        {/* TOP */}
        <div className="space-y-3">
          <p className="text-sm font-bold tracking-wide text-center drop-shadow-lg">
            🎉 CHÚC MỪNG TẶNG THƯỞNG THÀNH CÔNG 🎉
          </p>
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
              <Avatar className="h-12 w-12 ring-2 ring-white/30">
                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-sm">C</AvatarFallback>
              </Avatar>
              <p className="text-sm font-semibold truncate max-w-full drop-shadow">{MOCK_SENDER.name}</p>
              <p className="text-xs text-white/70">@{MOCK_SENDER.username}</p>
              <div className="flex items-center gap-0.5">
                <span className="text-[11px] font-mono text-white/60">{shortenAddress(MOCK_SENDER.wallet!)}</span>
                <Copy className="h-3.5 w-3.5 text-white/60" />
              </div>
            </div>
            <div className="flex flex-col items-center gap-0.5 flex-shrink-0 px-2">
              <div className="flex items-center gap-1.5 text-xl font-bold">
                <img src={MOCK_TOKEN.icon_url!} alt="" className="h-5 w-5" />
                <span className="text-amber-300 drop-shadow-lg">{MOCK_TRANSACTION.amount.toLocaleString()}</span>
              </div>
              <span className="text-xl">→</span>
              <span className="text-sm font-medium text-white/80">{MOCK_TOKEN.symbol}</span>
            </div>
            <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
              <Avatar className="h-12 w-12 ring-2 ring-amber-400/30">
                <AvatarFallback className="bg-gradient-to-br from-amber-500 to-orange-500 text-white text-sm">C</AvatarFallback>
              </Avatar>
              <p className="text-sm font-semibold truncate max-w-full drop-shadow">{MOCK_RECEIVER.name}</p>
              <p className="text-xs text-white/70">@{MOCK_RECEIVER.username}</p>
              <div className="flex items-center gap-0.5">
                <span className="text-[11px] font-mono text-white/60">{shortenAddress(MOCK_RECEIVER.wallet!)}</span>
                <Copy className="h-3.5 w-3.5 text-white/60" />
              </div>
            </div>
          </div>
        </div>

        {/* MIDDLE */}
        <div className="space-y-1.5 text-sm bg-black/30 rounded-xl p-3 backdrop-blur-sm">
          <div className="flex justify-between"><span className="text-white/60">Trạng thái</span><span className="text-green-400 font-medium">✅ Thành công</span></div>
          <div className="flex justify-between"><span className="text-white/60">Chủ đề</span><span>🎉 Chúc mừng</span></div>
          <div>
            <span className="text-white/60">Lời nhắn</span>
            <p className="italic mt-0.5 p-2 bg-white/10 rounded-lg text-sm">"{MOCK_MESSAGE}"</p>
          </div>
          <div className="flex justify-between"><span className="text-white/60">Thời gian</span><span>{formattedTime}</span></div>
          <div className="flex justify-between"><span className="text-white/60">Chain</span><span>BSC</span></div>
          <div className="flex justify-between items-center">
            <span className="text-white/60">TX Hash</span>
            <div className="flex items-center gap-1">
              <span className="font-mono text-xs">{MOCK_TRANSACTION.tx_hash.substring(0, 10)}…</span>
              <Copy className="h-3.5 w-3.5 text-white/60" />
              <ExternalLink className="h-3.5 w-3.5 text-white/60" />
            </div>
          </div>
          <div className="flex justify-between"><span className="text-white/60">Mã biên nhận</span><span className="font-mono text-xs">#{MOCK_TRANSACTION.receipt_public_id}</span></div>
        </div>

        {/* BOTTOM */}
        <Button variant="outline" size="sm" className="w-full text-sm border-white/30 text-white hover:bg-white/20 bg-white/10">
          <ExternalLink className="h-3.5 w-3.5 mr-1.5" />Xem biên nhận
        </Button>
      </div>
    </div>
  );
};

// ==================== MOCK CHAT CARD (inline, override fetch) ====================
const MockChatDonationCard = ({ isMe }: { isMe: boolean }) => {
  const bg = "/images/celebration-bg/celebration-1.png";
  return (
    <div className={`max-w-[280px] ${isMe ? "ml-auto" : "mr-auto"}`}>
      <div className="relative rounded-2xl overflow-hidden aspect-[4/5]" style={{ backgroundImage: `url(${bg})`, backgroundSize: "cover", backgroundPosition: "center" }}>
        <div className="absolute inset-0 bg-black/45" />
        <div className="relative h-full flex flex-col items-center justify-between p-4 text-white text-center">
          <p className="text-xs font-bold tracking-wide drop-shadow-lg">🎉 CHÚC MỪNG TẶNG THƯỞNG THÀNH CÔNG 🎉</p>
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 ring-2 ring-white/30">
              <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-xs">C</AvatarFallback>
            </Avatar>
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1.5 font-bold text-base">
                <img src={MOCK_TOKEN.icon_url!} alt="" className="h-4 w-4" />
                <span className="text-amber-300 drop-shadow-lg">{MOCK_TRANSACTION.amount.toLocaleString()}</span>
              </div>
              <span className="text-xs text-white/70">{MOCK_TOKEN.symbol}</span>
            </div>
            <Avatar className="h-10 w-10 ring-2 ring-amber-400/30">
              <AvatarFallback className="bg-gradient-to-br from-amber-500 to-orange-500 text-white text-xs">C</AvatarFallback>
            </Avatar>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-medium">{MOCK_SENDER.name}</span>
            <span className="text-white/60">→</span>
            <span className="font-medium">{MOCK_RECEIVER.name}</span>
          </div>
          <p className="text-[10px] text-white/50">FUN PLAY • Tặng & Thưởng</p>
        </div>
      </div>
      <Button size="sm" variant="outline" className="gap-1.5 mt-1.5 w-full text-xs h-8 border-amber-300/50 hover:border-amber-400 hover:bg-amber-50 text-amber-700 dark:text-amber-300 dark:hover:bg-amber-900/30">
        <Gift className="w-3.5 h-3.5" />Xem Celebration Card
      </Button>
    </div>
  );
};

// ==================== MAIN PAGE ====================
const PreviewCelebration = () => {
  const [showModal, setShowModal] = useState(true);

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 space-y-10 max-w-4xl mx-auto">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-500 via-pink-500 to-purple-500 bg-clip-text text-transparent">
          🎨 Preview Celebration Cards
        </h1>
        <p className="text-sm text-muted-foreground">Xem trước giao diện các component Celebration Card với dữ liệu mẫu</p>
      </div>

      {/* SECTION 1: GiftCelebrationModal */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <span className="bg-gradient-to-r from-amber-500 to-pink-500 text-white rounded-full h-7 w-7 flex items-center justify-center text-sm">1</span>
          GiftCelebrationModal (Modal sau khi tặng thành công)
        </h2>
        <p className="text-sm text-muted-foreground">Hiển thị trong dialog sau khi giao dịch on-chain thành công. Có hiệu ứng pháo hoa, coin bay, tuỳ chỉnh chủ đề/nhạc.</p>
        {showModal && (
          <div className="border border-border rounded-2xl p-4 bg-card max-w-md mx-auto">
            <GiftCelebrationModal
              transaction={MOCK_TRANSACTION}
              sender={MOCK_SENDER}
              receiver={MOCK_RECEIVER}
              token={MOCK_TOKEN}
              message={MOCK_MESSAGE}
              onClose={() => setShowModal(false)}
            />
          </div>
        )}
        {!showModal && (
          <div className="text-center">
            <Button variant="outline" onClick={() => setShowModal(true)} className="gap-2">
              <Gift className="h-4 w-4" />Mở lại Modal
            </Button>
          </div>
        )}
      </section>

      {/* SECTION 2: DonationCelebrationCard (Profile) */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <span className="bg-gradient-to-r from-amber-500 to-pink-500 text-white rounded-full h-7 w-7 flex items-center justify-center text-sm">2</span>
          DonationCelebrationCard (Card trên Profile/Feed)
        </h2>
        <p className="text-sm text-muted-foreground">Hiển thị trên trang cá nhân dưới dạng bài đăng. Tỉ lệ 4:5, đầy đủ thông tin giao dịch.</p>
        <div className="flex justify-center">
          <MockDonationCelebrationCard />
        </div>
      </section>

      {/* SECTION 3: ChatDonationCard (Messenger) */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <span className="bg-gradient-to-r from-amber-500 to-pink-500 text-white rounded-full h-7 w-7 flex items-center justify-center text-sm">3</span>
          ChatDonationCard (Card trong Tin nhắn)
        </h2>
        <p className="text-sm text-muted-foreground">Mini card trong hội thoại Messenger. Hiển thị 2 phiên bản: bên gửi (phải) và bên nhận (trái).</p>
        <div className="border border-border rounded-2xl p-4 bg-card max-w-md mx-auto space-y-4">
          <p className="text-xs text-muted-foreground text-center">— isMe=false (Bên nhận, căn trái) —</p>
          <MockChatDonationCard isMe={false} />
          <p className="text-xs text-muted-foreground text-center">— isMe=true (Bên gửi, căn phải) —</p>
          <MockChatDonationCard isMe={true} />
        </div>
      </section>

      <div className="text-center pb-8">
        <p className="text-xs text-muted-foreground">Dữ liệu mẫu — không có giao dịch thật nào được thực hiện.</p>
      </div>
    </div>
  );
};

export default PreviewCelebration;
