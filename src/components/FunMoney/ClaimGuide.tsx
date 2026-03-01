/**
 * ClaimGuide - Hướng dẫn từ A-Z cho user mint & claim FUN về ví
 * Cập nhật theo mô hình LS-Math v1.0 (Light Score → Epoch Mint → Claim)
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from '@/components/ui/accordion';
import { 
  BookOpen, 
  Wallet, 
  MousePointerClick, 
  Shield, 
  ArrowDownToLine, 
  Zap, 
  CheckCircle2, 
  AlertTriangle,
  ExternalLink,
  Coins,
  Sun,
  TrendingUp,
  CalendarClock,
  Layers
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SCORING_RULES_V1 } from '@/lib/fun-money/scoring-config-v1';

const steps = [
  {
    id: 'step-1',
    number: 'A',
    title: 'Kết nối ví (Wallet)',
    icon: Wallet,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    content: (
      <div className="space-y-3">
        <p>Bạn cần có một ví tiền điện tử hỗ trợ mạng <strong>BSC Testnet</strong>. Khuyến nghị sử dụng <strong>MetaMask</strong>.</p>
        <div className="bg-muted rounded-lg p-3 space-y-2">
          <p className="font-semibold text-sm">📱 Cài đặt MetaMask:</p>
          <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
            <li>Trên máy tính: Cài extension MetaMask từ <a href="https://metamask.io" target="_blank" rel="noopener noreferrer" className="text-primary underline">metamask.io</a></li>
            <li>Trên điện thoại: Tải app MetaMask từ App Store / Google Play</li>
            <li>Tạo ví mới hoặc nhập ví có sẵn</li>
          </ul>
        </div>
        <div className="bg-muted rounded-lg p-3 space-y-2">
          <p className="font-semibold text-sm">🔗 Kết nối ví với nền tảng:</p>
          <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
            <li>Bấm nút <strong>"Kết nối ví"</strong> trên thanh điều hướng</li>
            <li>Chọn MetaMask hoặc WalletConnect</li>
            <li>Xác nhận kết nối trong ví của bạn</li>
          </ul>
        </div>
      </div>
    )
  },
  {
    id: 'step-2',
    number: 'B',
    title: 'Chuyển sang mạng BSC Testnet',
    icon: Shield,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
    content: (
      <div className="space-y-3">
        <p>FUN Money hoạt động trên mạng <strong>BNB Smart Chain Testnet (Chain ID: 97)</strong>.</p>
        <div className="bg-muted rounded-lg p-3 space-y-2">
          <p className="font-semibold text-sm">⚙️ Cách chuyển mạng:</p>
          <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
            <li>Hệ thống sẽ tự động nhắc bạn chuyển mạng khi cần</li>
            <li>Bấm <strong>"Chuyển mạng"</strong> và xác nhận trong ví</li>
            <li>Nếu chưa có mạng BSC Testnet, hệ thống sẽ tự thêm cho bạn</li>
          </ul>
        </div>
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
          <p className="text-sm flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
            <span>Bạn cần có <strong>tBNB</strong> (BNB testnet) để trả phí gas. Nhận miễn phí tại{' '}
              <a href="https://www.bnbchain.org/en/testnet-faucet" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                BNB Testnet Faucet
              </a>
            </span>
          </p>
        </div>
      </div>
    )
  },
  {
    id: 'step-3',
    number: 'C',
    title: 'Hoạt động để tích lũy Light Score',
    icon: Sun,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    content: (
      <div className="space-y-3">
        <p>Mỗi hành động trên nền tảng sẽ được ghi nhận và tính điểm <strong>Light Score</strong> theo mô hình <strong>LS-Math v1.0</strong>:</p>
        <div className="bg-muted rounded-lg p-3 space-y-2">
          <p className="font-semibold text-sm">🌟 Điểm hành động nền (Base Action):</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
            {[
              { action: 'Đăng bài viết', points: '3 điểm', emoji: '✍️' },
              { action: 'Bình luận', points: '1.5 điểm', emoji: '💬' },
              { action: 'Đăng video', points: '5 điểm', emoji: '🎬' },
              { action: 'Phản hồi bình luận', points: '0.3 điểm', emoji: '↩️' },
              { action: 'Check-in hằng ngày', points: 'Tăng streak', emoji: '📅' },
              { action: 'Quyên góp', points: 'Ghi nhận', emoji: '💝' },
            ].map(item => (
              <div key={item.action} className="bg-background rounded-lg p-2.5 text-center border border-border">
                <span className="text-lg">{item.emoji}</span>
                <p className="text-xs font-medium mt-1">{item.action}</p>
                <p className="text-xs text-primary font-bold">{item.points}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-muted rounded-lg p-3 space-y-2">
          <p className="font-semibold text-sm">🧮 Công thức tính điểm ngày:</p>
          <p className="text-sm text-muted-foreground">
            <strong>Light = (40% Hành động + 60% Chất lượng nội dung) × Uy tín × Bền vững × Chuỗi × Cân bằng</strong>
          </p>
          <ul className="list-disc list-inside text-xs space-y-1 text-muted-foreground mt-2">
            <li><strong>Uy tín (w):</strong> Tỉ lệ logarit từ {SCORING_RULES_V1.reputation.w_min} → {SCORING_RULES_V1.reputation.w_max} dựa trên lịch sử hoạt động</li>
            <li><strong>Chất lượng (C):</strong> Nội dung được cộng đồng đánh giá qua 5 trụ cột (Sự thật, Hàn gắn, Hợp nhất, Phụng sự, Bền vững)</li>
            <li><strong>Bền vững (M_cons):</strong> Hoạt động đều đặn nhiều ngày liên tục sẽ được thưởng thêm</li>
            <li><strong>Chuỗi (M_seq):</strong> Thực hiện đa dạng hành động trong ngày (bình luận + video + check-in...) được cộng bonus</li>
            <li><strong>Cân bằng (Π):</strong> Hệ thống giảm điểm nếu phát hiện hành vi spam hoặc trục lợi (tối đa -{SCORING_RULES_V1.penalty.max_penalty * 100}%)</li>
          </ul>
        </div>
      </div>
    )
  },
  {
    id: 'step-4',
    number: 'D',
    title: '5 Cấp độ Light Score',
    icon: Layers,
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/30',
    content: (
      <div className="space-y-3">
        <p>Light Score tích lũy theo thời gian và xác định <strong>cấp độ</strong> của bạn:</p>
        <div className="bg-muted rounded-lg p-3 space-y-2">
          {[
            { level: 'Seed', threshold: SCORING_RULES_V1.levels.seed, emoji: '🌱', desc: 'Người mới — bắt đầu hành trình' },
            { level: 'Sprout', threshold: SCORING_RULES_V1.levels.sprout, emoji: '🌿', desc: 'Đã nảy mầm — hoạt động đều đặn' },
            { level: 'Builder', threshold: SCORING_RULES_V1.levels.builder, emoji: '🔨', desc: 'Người xây dựng — đóng góp nội dung chất lượng' },
            { level: 'Guardian', threshold: SCORING_RULES_V1.levels.guardian, emoji: '🛡️', desc: 'Người bảo vệ — thành viên cốt lõi' },
            { level: 'Architect', threshold: SCORING_RULES_V1.levels.architect, emoji: '👑', desc: 'Kiến trúc sư — đóng góp xuất sắc bền vững' },
          ].map(item => (
            <div key={item.level} className="flex items-center gap-3 py-1.5">
              <span className="text-lg">{item.emoji}</span>
              <div className="flex-1">
                <span className="font-semibold text-sm">{item.level}</span>
                <span className="text-xs text-muted-foreground ml-2">≥ {item.threshold} Light</span>
              </div>
              <span className="text-xs text-muted-foreground">{item.desc}</span>
            </div>
          ))}
        </div>
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
          <p className="text-sm flex items-start gap-2">
            <Sun className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <span>Cấp độ càng cao → phần thưởng FUN mỗi chu kỳ càng lớn. Yêu cầu tối thiểu <strong>{SCORING_RULES_V1.mint.min_light_threshold} Light</strong> để đủ điều kiện mint.</span>
          </p>
        </div>
      </div>
    )
  },
  {
    id: 'step-5',
    number: 'E',
    title: 'Bấm MINT để gửi yêu cầu',
    icon: MousePointerClick,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
    content: (
      <div className="space-y-3">
        <p>Khi bạn đã đạt đủ điều kiện (Light Score ≥ {SCORING_RULES_V1.mint.min_light_threshold} và vượt 5 điều kiện PPLP v2.0):</p>
        <div className="bg-muted rounded-lg p-3 space-y-2">
          <p className="font-semibold text-sm">✅ 5 Điều kiện xác thực PPLP v2.0:</p>
          <ul className="list-decimal list-inside text-sm space-y-1.5 text-muted-foreground">
            <li><strong>hasRealAction</strong> — Có hành động thực (không fake)</li>
            <li><strong>hasRealValue</strong> — Hành động tạo giá trị thực cho cộng đồng</li>
            <li><strong>hasPositiveImpact</strong> — Tác động tích cực (5 trụ cột)</li>
            <li><strong>noExploitation</strong> — Không trục lợi hệ thống</li>
            <li><strong>charterCompliant</strong> — Tuân thủ Hiến chương cộng đồng</li>
          </ul>
        </div>
        <div className="bg-muted rounded-lg p-3 space-y-2">
          <p className="font-semibold text-sm">🚀 Cách mint:</p>
          <ul className="list-decimal list-inside text-sm space-y-1.5 text-muted-foreground">
            <li>Kiểm tra <strong>"FUN Có Thể Mint"</strong> và điều kiện ở đầu trang</li>
            <li>Bấm nút <strong>"⚡ MINT FUN"</strong></li>
            <li>Hệ thống tự động tạo yêu cầu với bằng chứng hoạt động</li>
            <li>Yêu cầu sẽ có trạng thái <Badge variant="outline" className="text-yellow-500 border-yellow-500/30 text-xs">Pending</Badge></li>
          </ul>
        </div>
      </div>
    )
  },
  {
    id: 'step-6',
    number: 'F',
    title: 'Chu kỳ Mint (Epoch) & Admin duyệt',
    icon: CalendarClock,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    content: (
      <div className="space-y-3">
        <p>FUN Money được phân phối theo <strong>chu kỳ (Epoch)</strong>, không mint tức thì:</p>
        <div className="bg-muted rounded-lg p-3 space-y-2">
          <p className="font-semibold text-sm">📆 Quy trình pipeline tự động:</p>
          <ul className="list-disc list-inside text-sm space-y-1.5 text-muted-foreground">
            <li><strong>Hằng ngày 02:00</strong> — Tổng hợp dữ liệu hoạt động (Features)</li>
            <li><strong>Hằng ngày 02:30</strong> — Nhận diện chuỗi hành vi (Sequences)</li>
            <li><strong>Mỗi 4 giờ</strong> — Tính lại Light Score</li>
            <li><strong>Thứ Hai 03:00</strong> — Chốt Epoch Mint (phân bổ FUN)</li>
          </ul>
        </div>
        <div className="bg-muted rounded-lg p-3 space-y-2">
          <p className="font-semibold text-sm">⚖️ Chính sách Anti-Whale & Công bằng:</p>
          <ul className="list-disc list-inside text-sm space-y-1.5 text-muted-foreground">
            <li>Mỗi người dùng tối đa nhận <strong>{SCORING_RULES_V1.mint.anti_whale_cap * 100}%</strong> tổng quỹ thưởng mỗi chu kỳ</li>
            <li>Phần dư từ người bị giới hạn được <strong>tái phân bổ</strong> cho người dùng khác</li>
            <li>Không hiển thị bảng xếp hạng — triết lý <strong>Không nuôi Ego</strong></li>
          </ul>
        </div>
        <div className="bg-muted rounded-lg p-3 space-y-2">
          <p className="font-semibold text-sm">🔐 Admin duyệt on-chain:</p>
          <ul className="list-disc list-inside text-sm space-y-1.5 text-muted-foreground">
            <li>Admin (Attester) kiểm tra và ký giao dịch mint lên blockchain</li>
            <li>Token được mint vào hợp đồng ở trạng thái <Badge variant="outline" className="text-orange-500 border-orange-500/30 text-xs">LOCKED</Badge></li>
            <li>Admin trả phí gas cho bước này</li>
          </ul>
        </div>
        <p className="text-sm text-muted-foreground italic">⏱️ Thời gian duyệt phụ thuộc vào Admin, thường trong 24h sau khi epoch chốt.</p>
      </div>
    )
  },
  {
    id: 'step-7',
    number: 'G',
    title: 'Activate - Kích hoạt token',
    icon: Zap,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/30',
    content: (
      <div className="space-y-3">
        <p>Sau khi Admin mint xong, bạn sẽ thấy số token ở trạng thái <strong>LOCKED</strong>:</p>
        <div className="bg-muted rounded-lg p-3 space-y-2">
          <ul className="list-decimal list-inside text-sm space-y-2 text-muted-foreground">
            <li>Vào mục <strong>"Activate & Claim"</strong> trên trang FUN Money</li>
            <li>Bấm nút <strong>"Activate & Claim"</strong> màu vàng</li>
            <li>Bạn sẽ thấy số LOCKED token</li>
            <li>Bấm <strong>"⚡ Activate"</strong> để kích hoạt</li>
            <li>Xác nhận giao dịch trong ví (trả phí gas bằng tBNB)</li>
            <li>Token chuyển sang trạng thái <Badge variant="outline" className="text-blue-500 border-blue-500/30 text-xs">ACTIVATED</Badge></li>
          </ul>
        </div>
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
          <p className="text-sm flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
            <span>Bước này yêu cầu phí gas <strong>tBNB</strong>. Đảm bảo ví bạn có đủ tBNB.</span>
          </p>
        </div>
      </div>
    )
  },
  {
    id: 'step-8',
    number: 'H',
    title: 'Claim - Nhận FUN Money về ví',
    icon: ArrowDownToLine,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
    content: (
      <div className="space-y-3">
        <p>Đây là bước cuối cùng! Token ACTIVATED sẽ được chuyển thành ERC-20 trong ví của bạn:</p>
        <div className="bg-muted rounded-lg p-3 space-y-2">
          <ul className="list-decimal list-inside text-sm space-y-2 text-muted-foreground">
            <li>Sau khi Activate thành công, bạn sẽ thấy số token <strong>ACTIVATED</strong></li>
            <li>Bấm nút <strong>"🎁 Claim"</strong></li>
            <li>Xác nhận giao dịch trong ví (trả phí gas bằng tBNB)</li>
            <li>Token chuyển sang trạng thái <Badge variant="outline" className="text-emerald-500 border-emerald-500/30 text-xs">FLOWING ✨</Badge></li>
            <li>🎉 <strong>FUN Money đã nằm trong ví của bạn!</strong></li>
          </ul>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3">
          <p className="text-sm flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <span>Sau khi Claim xong, bạn có thể thấy FUN Money trong ví MetaMask bằng cách bấm <strong>"Thêm Contract FUN Money vào ví"</strong> ở mục Tổng Quan.</span>
          </p>
        </div>
      </div>
    )
  },
];

const faqItems = [
  {
    q: 'Light Score khác gì FUN Money?',
    a: 'Light Score là điểm đánh giá đóng góp của bạn (không phải tiền). FUN Money là token thưởng được mint dựa trên Light Score của bạn mỗi chu kỳ Epoch. Light Score cao → FUN nhận được nhiều hơn.'
  },
  {
    q: 'Tại sao tôi cần tBNB?',
    a: 'Mỗi giao dịch trên blockchain đều cần phí gas. Trên mạng BSC Testnet, phí gas được trả bằng tBNB. Admin trả phí cho bước mint (lockWithPPLP), còn bạn trả phí cho bước Activate và Claim. Nhận tBNB miễn phí tại BNB Testnet Faucet.'
  },
  {
    q: 'Tôi không thấy FUN trong ví MetaMask?',
    a: 'Bạn cần thêm token FUN vào MetaMask. Bấm nút "Thêm Contract FUN Money vào ví" ở mục Tổng Quan, hoặc thêm thủ công với địa chỉ contract: 0x39A1b047D5d143f8874888cfa1d30Fb2AE6F0CD6'
  },
  {
    q: 'Activate và Claim khác nhau thế nào?',
    a: 'Activate là bước chuyển token từ trạng thái bị khóa (LOCKED) sang kích hoạt (ACTIVATED). Claim là bước cuối để nhận token ERC-20 thật sự vào ví của bạn. Cả 2 bước đều cần phí gas tBNB.'
  },
  {
    q: 'Anti-Whale là gì? Tại sao tôi không nhận được nhiều hơn?',
    a: `Để đảm bảo công bằng, mỗi người dùng tối đa chỉ nhận ${SCORING_RULES_V1.mint.anti_whale_cap * 100}% tổng quỹ thưởng mỗi chu kỳ. Phần dư được tái phân bổ cho các thành viên khác. Đây là chính sách chống tập trung quyền lực.`
  },
  {
    q: 'Epoch Mint là gì?',
    a: 'FUN Money không được mint tức thì. Hệ thống tích lũy Light Score hằng ngày, sau đó phân phối FUN theo chu kỳ (Epoch) — thường chốt vào thứ Hai hàng tuần. Điều này đảm bảo cung tiền bền vững và công bằng cho toàn cộng đồng.'
  },
];

export function ClaimGuide() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <BookOpen className="w-6 h-6 text-primary" />
          Hướng Dẫn Mint & Claim FUN (A → Z)
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Làm theo 8 bước dưới đây — từ tích lũy Light Score đến nhận token FUN về ví
        </p>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="secondary" className="text-xs">
            <TrendingUp className="w-3 h-3 mr-1" />
            LS-Math v1.0
          </Badge>
          <Badge variant="outline" className="text-xs">
            Epoch Mint — {SCORING_RULES_V1.mint.epoch_type}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Steps */}
        <div className="space-y-3">
          {steps.map((step) => (
            <Accordion key={step.id} type="single" collapsible>
              <AccordionItem value={step.id} className={`border rounded-lg ${step.borderColor}`}>
                <AccordionTrigger className="px-4 py-3 hover:no-underline">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full ${step.bgColor} flex items-center justify-center shrink-0`}>
                      <span className={`font-black text-sm ${step.color}`}>{step.number}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <step.icon className={`w-5 h-5 ${step.color}`} />
                      <span className="font-semibold text-base text-left">{step.title}</span>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  {step.content}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          ))}
        </div>

        {/* Summary Flow */}
        <div className="bg-muted rounded-xl p-4 mt-4">
          <p className="font-bold text-sm mb-3 text-center">📋 Tóm tắt quy trình LS-Math v1.0</p>
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-medium">
            {[
              { label: 'Kết nối ví', color: 'bg-blue-500' },
              { label: 'Hoạt động', color: 'bg-amber-500' },
              { label: 'Light Score ↑', color: 'bg-cyan-500' },
              { label: 'MINT', color: 'bg-green-500' },
              { label: 'Epoch chốt', color: 'bg-amber-600' },
              { label: 'Activate', color: 'bg-yellow-500' },
              { label: 'Claim', color: 'bg-emerald-500' },
              { label: 'FUN trong ví! 🎉', color: 'bg-primary' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <span className={`px-2.5 py-1 rounded-full text-white ${item.color}`}>
                  {item.label}
                </span>
                {i < 7 && <span className="text-muted-foreground">→</span>}
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-4">
          <p className="font-bold text-base mb-3">❓ Câu Hỏi Thường Gặp</p>
          <Accordion type="single" collapsible>
            {faqItems.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`}>
                <AccordionTrigger className="text-sm text-left">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm text-muted-foreground">{faq.a}</p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button variant="outline" size="sm" asChild>
            <a
              href="https://www.bnbchain.org/en/testnet-faucet"
              target="_blank"
              rel="noopener noreferrer"
              className="gap-2"
            >
              <Coins className="w-4 h-4" />
              Nhận tBNB miễn phí
              <ExternalLink className="w-3 h-3" />
            </a>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a
              href="https://testnet.bscscan.com/address/0x39A1b047D5d143f8874888cfa1d30Fb2AE6F0CD6"
              target="_blank"
              rel="noopener noreferrer"
              className="gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              Xem Contract trên BSCScan
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
