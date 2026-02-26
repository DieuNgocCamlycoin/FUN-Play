/**
 * ClaimGuide - Hướng dẫn từ A-Z cho user claim FUN về ví
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
  Coins
} from 'lucide-react';
import { Button } from '@/components/ui/button';

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
    title: 'Hoạt động để tích lũy FUN',
    icon: Zap,
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/30',
    content: (
      <div className="space-y-3">
        <p>Mỗi hành động trên nền tảng sẽ được tính điểm và quy đổi thành FUN:</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {[
            { action: 'Xem video', fun: '10 FUN', emoji: '👁️' },
            { action: 'Like', fun: '5 FUN', emoji: '❤️' },
            { action: 'Comment', fun: '15 FUN', emoji: '💬' },
            { action: 'Share', fun: '20 FUN', emoji: '🔗' },
            { action: 'Upload video', fun: '100 FUN', emoji: '📤' },
            { action: 'Tạo bài viết', fun: '30 FUN', emoji: '✍️' },
          ].map(item => (
            <div key={item.action} className="bg-muted rounded-lg p-2.5 text-center">
              <span className="text-lg">{item.emoji}</span>
              <p className="text-xs font-medium mt-1">{item.action}</p>
              <p className="text-xs text-primary font-bold">{item.fun}</p>
            </div>
          ))}
        </div>
      </div>
    )
  },
  {
    id: 'step-4',
    number: 'D',
    title: 'Bấm MINT để gửi yêu cầu',
    icon: MousePointerClick,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
    content: (
      <div className="space-y-3">
        <p>Khi bạn đã tích lũy đủ FUN từ hoạt động:</p>
        <div className="bg-muted rounded-lg p-3 space-y-2">
          <ul className="list-decimal list-inside text-sm space-y-2 text-muted-foreground">
            <li>Kiểm tra số <strong>"FUN Có Thể Mint"</strong> ở đầu trang</li>
            <li>Bấm nút <strong>"⚡ MINT FUN"</strong> màu gradient</li>
            <li>Hệ thống tự động tạo yêu cầu mint với thông tin hoạt động của bạn</li>
            <li>Yêu cầu sẽ có trạng thái <Badge variant="outline" className="text-yellow-500 border-yellow-500/30 text-xs">Pending</Badge></li>
          </ul>
        </div>
      </div>
    )
  },
  {
    id: 'step-5',
    number: 'E',
    title: 'Chờ Admin duyệt & Mint on-chain',
    icon: CheckCircle2,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    content: (
      <div className="space-y-3">
        <p>Admin sẽ xem xét yêu cầu của bạn và thực hiện mint token lên blockchain:</p>
        <div className="bg-muted rounded-lg p-3 space-y-2">
          <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
            <li>Admin kiểm tra tính hợp lệ của hoạt động</li>
            <li>Bấm <strong>"Duyệt & Mint"</strong> để ký giao dịch on-chain</li>
            <li>Token được mint vào hợp đồng thông minh ở trạng thái <Badge variant="outline" className="text-orange-500 border-orange-500/30 text-xs">LOCKED</Badge></li>
          </ul>
        </div>
        <p className="text-sm text-muted-foreground italic">⏱️ Thời gian duyệt phụ thuộc vào Admin, thường trong 24h.</p>
      </div>
    )
  },
  {
    id: 'step-6',
    number: 'F',
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
    id: 'step-7',
    number: 'G',
    title: 'Claim - Nhận FUN về ví',
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
            <li>🎉 <strong>FUN token đã nằm trong ví của bạn!</strong></li>
          </ul>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3">
          <p className="text-sm flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <span>Sau khi Claim xong, bạn có thể thấy FUN trong ví MetaMask bằng cách bấm <strong>"Thêm FUN vào ví"</strong> ở mục Tổng Quan.</span>
          </p>
        </div>
      </div>
    )
  },
];

const faqItems = [
  {
    q: 'Tại sao tôi cần tBNB?',
    a: 'Mỗi giao dịch trên blockchain đều cần phí gas. Trên mạng BSC Testnet, phí gas được trả bằng tBNB. Bạn có thể nhận miễn phí tại BNB Testnet Faucet.'
  },
  {
    q: 'Tôi không thấy FUN trong ví MetaMask?',
    a: 'Bạn cần thêm token FUN vào MetaMask. Bấm nút "Thêm FUN vào ví" ở mục Tổng Quan, hoặc thêm thủ công với địa chỉ contract: 0x39A1b047D5d143f8874888cfa1d30Fb2AE6F0CD6'
  },
  {
    q: 'Activate và Claim khác nhau thế nào?',
    a: 'Activate là bước chuyển token từ trạng thái bị khóa (LOCKED) sang kích hoạt (ACTIVATED). Claim là bước cuối để nhận token ERC-20 thật sự vào ví của bạn. Cả 2 bước đều cần phí gas tBNB.'
  },
  {
    q: 'Admin mất bao lâu để duyệt?',
    a: 'Thông thường trong vòng 24 giờ. Bạn sẽ nhận được thông báo khi yêu cầu được duyệt. Trạng thái realtime hiển thị ngay trên trang.'
  },
];

export function ClaimGuide() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <BookOpen className="w-6 h-6 text-primary" />
          Hướng Dẫn Claim FUN Về Ví (A → Z)
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Làm theo 7 bước dưới đây để nhận token FUN vào ví của bạn
        </p>
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
          <p className="font-bold text-sm mb-3 text-center">📋 Tóm tắt quy trình</p>
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-medium">
            {[
              { label: 'Kết nối ví', color: 'bg-blue-500' },
              { label: 'Hoạt động', color: 'bg-cyan-500' },
              { label: 'Bấm MINT', color: 'bg-green-500' },
              { label: 'Admin duyệt', color: 'bg-amber-500' },
              { label: 'Activate', color: 'bg-yellow-500' },
              { label: 'Claim', color: 'bg-emerald-500' },
              { label: 'FUN trong ví! 🎉', color: 'bg-primary' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <span className={`px-2.5 py-1 rounded-full text-white ${item.color}`}>
                  {item.label}
                </span>
                {i < 6 && <span className="text-muted-foreground">→</span>}
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
