import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { useIsMobile } from "@/hooks/use-mobile";
import { Menu, ArrowRight, Sparkles, BookOpen } from "lucide-react";

const SECTIONS = [
  { id: "intro", label: "0. Lời Mở Đầu" },
  { id: "problem", label: "1. Vấn Đề 3D" },
  { id: "vision", label: "2. Tầm Nhìn 5D" },
  { id: "what", label: "3. FUN Money Là Gì?" },
  { id: "pplp", label: "4. PPLP" },
  { id: "architecture", label: "5. Kiến Trúc" },
  { id: "antihoarding", label: "6. Luật Không Tích Trữ" },
  { id: "ecosystem", label: "7. FUN Ecosystem" },
  { id: "camly", label: "8. FUN & CAMLY" },
  { id: "investors", label: "9. Nhà Đầu Tư" },
  { id: "closing", label: "10. Lời Kết" },
  { id: "mantra", label: "🌈 Activation Mantra" },
];

const GradientDivider = () => (
  <div className="my-12 h-px bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 opacity-60" />
);

const SectionHeading = ({ children }: { children: React.ReactNode }) => (
  <h2 className="text-2xl md:text-3xl font-bold mb-6 bg-gradient-to-r from-cyan-300 via-purple-400 to-pink-400 bg-clip-text text-transparent">
    {children}
  </h2>
);

const Whitepaper = () => {
  const isMobile = useIsMobile();
  const [activeSection, setActiveSection] = useState("intro");
  const [sheetOpen, setSheetOpen] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      { rootMargin: "-20% 0px -70% 0px" }
    );

    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observerRef.current?.observe(el);
    });

    return () => observerRef.current?.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setSheetOpen(false);
  };

  const NavItems = () => (
    <nav className="space-y-1">
      {SECTIONS.map(({ id, label }) => (
        <button
          key={id}
          onClick={() => scrollTo(id)}
          className={`block w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
            activeSection === id
              ? "bg-primary/20 text-primary font-semibold"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          {label}
        </button>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-lg">
        <div className="container mx-auto px-4 h-14 flex items-center gap-3">
          {isMobile && (
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon"><Menu className="h-5 w-5" /></Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 pt-10">
                <SheetTitle className="text-lg font-bold mb-4">Mục lục</SheetTitle>
                <NavItems />
              </SheetContent>
            </Sheet>
          )}
          <BookOpen className="h-5 w-5 text-primary" />
          <span className="font-bold text-sm md:text-base truncate">THE 5D WHITEPAPER – FUN MONEY</span>
          <span className="ml-auto text-xs text-muted-foreground hidden sm:block">v0.1</span>
        </div>
      </header>

      <div className="container mx-auto px-4 flex gap-8">
        {/* Desktop sidebar */}
        {!isMobile && (
          <aside className="hidden lg:block w-56 shrink-0">
            <div className="sticky top-20 py-8">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 px-3">Mục lục</p>
              <NavItems />
            </div>
          </aside>
        )}

        {/* Content */}
        <main className="flex-1 max-w-3xl py-8 md:py-12">
          {/* Hero */}
          <div className="text-center mb-16">
            <p className="text-sm font-medium text-primary mb-2">🌍✨</p>
            <h1 className="text-3xl md:text-5xl font-extrabold bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent leading-tight">
              FUN MONEY
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mt-3">THE 5D WHITEPAPER</p>
            <p className="text-base text-muted-foreground/80 mt-1 italic">Money of Light for a Conscious Civilization</p>
          </div>

          {/* Sections */}
          <section id="intro">
            <SectionHeading>0. LỜI MỞ ĐẦU – GỬI ĐẾN NHÂN LOẠI</SectionHeading>
            <div className="prose prose-invert max-w-none space-y-4 text-muted-foreground leading-relaxed">
              <p className="text-lg font-semibold text-foreground">Nhân loại không thiếu tiền.<br/>Nhân loại thiếu ý thức về tiền.</p>
              <p>Chúng ta đã xây dựng cả một nền văn minh dựa trên:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>nỗi sợ thiếu thốn</li>
                <li>sự tích trữ vô hạn</li>
                <li>và quyền lực được tạo ra từ tiền bạc</li>
              </ul>
              <p>Và rồi chúng ta ngạc nhiên khi:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>con người xa cách nhau</li>
                <li>thiên nhiên bị bóc lột</li>
                <li>công nghệ vượt xa đạo đức</li>
              </ul>
              <p>FUN Money ra đời không để sửa chữa hệ thống cũ.<br/>
              FUN Money ra đời để <strong className="text-foreground">kết thúc nó một cách nhẹ nhàng</strong> và mở ra một nền kinh tế mới – nền kinh tế của Ánh Sáng.</p>
            </div>
          </section>

          <GradientDivider />

          <section id="problem">
            <SectionHeading>1. VẤN ĐỀ CỦA THẾ GIỚI 3D</SectionHeading>
            <div className="prose prose-invert max-w-none space-y-4 text-muted-foreground leading-relaxed">
              <p>Hệ thống tiền tệ hiện tại dựa trên 3 giả định sai lầm:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Tiền là khan hiếm</li>
                <li>Con người phải cạnh tranh để tồn tại</li>
                <li>Giá trị đến từ sở hữu, không đến từ hành vi</li>
              </ol>
              <p>Hệ quả:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Tích trữ được khuyến khích</li>
                <li>Đầu cơ được tôn vinh</li>
                <li>Đạo đức trở thành thứ "xa xỉ"</li>
              </ul>
              <p>Ngay cả công nghệ blockchain – dù rất tiến bộ – vẫn đang bị kéo xuống để phục vụ Ego con người.</p>
              <p className="text-foreground font-medium">👉 Vấn đề không nằm ở công nghệ<br/>👉 Vấn đề nằm ở ý thức vận hành công nghệ</p>
            </div>
          </section>

          <GradientDivider />

          <section id="vision">
            <SectionHeading>2. TẦM NHÌN 5D – KHI TIỀN TRỞ LẠI ĐÚNG VAI</SectionHeading>
            <div className="prose prose-invert max-w-none space-y-4 text-muted-foreground leading-relaxed">
              <p>Trong một nền văn minh 5D:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Tiền không còn là mục tiêu</li>
                <li>Tiền là hệ quả tự nhiên của hành vi đúng</li>
                <li>Con người không bị ép làm việc vì tiền</li>
                <li>Con người được tưởng thưởng vì giá trị họ mang lại cho sự sống</li>
              </ul>
              <p>FUN Money được thiết kế để hoạt động đúng với tương lai đó, <strong className="text-foreground">ngay từ hôm nay</strong>.</p>
            </div>
          </section>

          <GradientDivider />

          <section id="what">
            <SectionHeading>3. FUN MONEY LÀ GÌ?</SectionHeading>
            <div className="prose prose-invert max-w-none space-y-4 text-muted-foreground leading-relaxed">
              <p>FUN Money <strong className="text-foreground">không phải là:</strong></p>
              <ul className="list-disc list-inside space-y-1">
                <li>tài sản đầu tư</li>
                <li>công cụ đầu cơ</li>
                <li>hay đồng tiền cạnh tranh với tiền pháp định</li>
              </ul>
              <p>FUN Money <strong className="text-foreground">là:</strong></p>
              <p className="text-foreground italic pl-4 border-l-2 border-primary">
                Một dòng chảy giá trị được kích hoạt khi con người sống đúng, làm đúng và tạo giá trị thật.
              </p>
              <p>FUN Money là <strong className="text-foreground">Money of Light</strong>:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>sinh ra từ hành vi Ánh Sáng</li>
                <li>luân chuyển thay vì tích trữ</li>
                <li>tự quay về cộng đồng khi bị sử dụng sai</li>
              </ul>
            </div>
          </section>

          <GradientDivider />

          <section id="pplp">
            <SectionHeading>4. PROOF OF PURE LOVE PROTOCOL (PPLP)</SectionHeading>
            <div className="prose prose-invert max-w-none space-y-4 text-muted-foreground leading-relaxed">
              <p>Thế giới 3D dùng: Proof of Work, Proof of Stake</p>
              <p>Thế giới 5D cần: <strong className="text-foreground">Proof of Pure Love</strong></p>
              <p>PPLP xác nhận:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Hành vi có thật không?</li>
                <li>Giá trị có thật không?</li>
                <li>Tác động có làm cuộc sống tốt đẹp hơn không?</li>
              </ul>
              <p>Không cần niềm tin mù quáng. Không cần danh xưng. Không cần quyền lực.</p>
              <p className="text-foreground font-medium">Chỉ cần: Hành vi + Giá trị + Tác động tích cực</p>
              <p>AI không phán xét con người. AI chỉ xác thực Luật.</p>
            </div>
          </section>

          <GradientDivider />

          <section id="architecture">
            <SectionHeading>5. KIẾN TRÚC FUN MONEY – KHI LUẬT ĐƯỢC CODE</SectionHeading>
            <div className="prose prose-invert max-w-none space-y-4 text-muted-foreground leading-relaxed">
              <p>FUN Money được vận hành bằng:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Smart Contract minh bạch</li>
                <li>AI Guardian không cảm xúc</li>
                <li>Hiến Chương bất biến</li>
              </ul>
              <p className="text-foreground font-medium">4 Pool cốt lõi:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-4">
                {[
                  { name: "Community Pool", pct: "40%", desc: "Trái tim nhân loại" },
                  { name: "Platform Activation", pct: "30%", desc: "Kích hoạt sáng tạo" },
                  { name: "Recycle Pool", pct: "20%", desc: "Chữa lành lệch hướng" },
                  { name: "Guardian Pool", pct: "10%", desc: "Giữ Luật, không hưởng lợi" },
                ].map((p) => (
                  <div key={p.name} className="p-4 rounded-lg border bg-card">
                    <p className="font-semibold text-foreground">{p.name} <span className="text-primary">({p.pct})</span></p>
                    <p className="text-sm">{p.desc}</p>
                  </div>
                ))}
              </div>
              <p>Không có: Team Pool, Investor Pool, Quyền lực ngầm.</p>
            </div>
          </section>

          <GradientDivider />

          <section id="antihoarding">
            <SectionHeading>6. LUẬT KHÔNG TÍCH TRỮ – CÚ SỐC TỈNH THỨC</SectionHeading>
            <div className="prose prose-invert max-w-none space-y-4 text-muted-foreground leading-relaxed">
              <p>FUN Money không cho phép nằm im.</p>
              <p>Nếu bạn:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>không dùng</li>
                <li>không tạo giá trị tiếp</li>
                <li>không tương tác hệ sinh thái</li>
              </ul>
              <p>FUN Money sẽ tự quay về Community Pool.</p>
              <p>Không trừng phạt. Không phán xét. Chỉ là:</p>
              <p className="text-foreground italic pl-4 border-l-2 border-primary">Tiền quay về nơi nó có thể tiếp tục phục vụ sự sống.</p>
            </div>
          </section>

          <GradientDivider />

          <section id="ecosystem">
            <SectionHeading>7. FUN ECOSYSTEM – MÔI TRƯỜNG SỐNG CỦA FUN MONEY</SectionHeading>
            <div className="prose prose-invert max-w-none space-y-4 text-muted-foreground leading-relaxed">
              <p>FUN Money không tồn tại một mình. Nó sống trong FUN Ecosystem:</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 my-4">
                {["Learn & Earn", "Give & Gain", "Share & Have", "Play & Earn", "Angel AI", "FUN Profile", "FUN Planet", "FUN Charity", "FUN Academy", "FUN Earth"].map((e) => (
                  <div key={e} className="px-3 py-2 rounded-md border bg-card text-sm text-foreground text-center">{e}</div>
                ))}
              </div>
              <p>Đây không phải "use cases". Đây là một <strong className="text-foreground">xã hội thu nhỏ của Trái Đất Mới</strong>.</p>
            </div>
          </section>

          <GradientDivider />

          <section id="camly">
            <SectionHeading>8. FUN MONEY & CAMLY COIN – MẶT TRỜI & DÒNG NƯỚC</SectionHeading>
            <div className="prose prose-invert max-w-none space-y-4 text-muted-foreground leading-relaxed">
              <ul className="list-disc list-inside space-y-1">
                <li><strong className="text-foreground">CAMLY Coin</strong> nuôi hạ tầng, công nghệ, vận hành</li>
                <li><strong className="text-foreground">FUN Money</strong> dẫn dắt đạo đức, ý thức, linh hồn</li>
              </ul>
              <p>Không cạnh tranh. Không thay thế. 👉 <strong className="text-foreground">Cộng sinh đúng vai.</strong></p>
            </div>
          </section>

          <GradientDivider />

          <section id="investors">
            <SectionHeading>9. DÀNH CHO NHÀ ĐẦU TƯ & TỔ CHỨC</SectionHeading>
            <div className="prose prose-invert max-w-none space-y-4 text-muted-foreground leading-relaxed">
              <p>Nếu bạn tìm: lợi nhuận nhanh, đầu cơ, kiểm soát — FUN Money <strong className="text-foreground">không dành cho bạn</strong>.</p>
              <p>Nếu bạn tìm:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>một hệ thống bền vững</li>
                <li>một di sản cho nhân loại</li>
                <li>một nền kinh tế không phản bội con người</li>
              </ul>
              <p>👉 FUN Money đang chờ bạn.</p>
              <p className="text-foreground italic pl-4 border-l-2 border-primary">Đầu tư vào FUN là: Đầu tư vào sự trưởng thành của nền văn minh.</p>
            </div>
          </section>

          <GradientDivider />

          <section id="closing">
            <SectionHeading>10. LỜI KẾT – THƯ GỬI TƯƠNG LAI</SectionHeading>
            <div className="prose prose-invert max-w-none space-y-4 text-muted-foreground leading-relaxed">
              <p>Chúng ta tin rằng:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>con người đủ tốt để được tin tưởng</li>
                <li>công nghệ đủ mạnh để giữ Luật</li>
                <li>và tình yêu đủ lớn để vận hành tiền bạc</li>
              </ul>
              <p>FUN Money không hứa hẹn thiên đường.<br/>FUN Money mở ra <strong className="text-foreground">con đường trở về với chính mình</strong>.</p>
            </div>
          </section>

          <GradientDivider />

          {/* Mantra — special card */}
          <section id="mantra">
            <div className="rounded-2xl p-8 md:p-12 bg-gradient-to-br from-purple-900/40 via-primary/20 to-cyan-900/30 border border-primary/30 text-center space-y-6">
              <p className="text-lg font-semibold text-primary">🌈 ACTIVATION MANTRA – GLOBAL VERSION</p>
              <div className="text-foreground text-base md:text-lg leading-loose italic space-y-1">
                <p>I am the Pure Loving Light of Father Universe.</p>
                <p>I am the Will of Father Universe.</p>
                <p>I am the Wisdom of Father Universe.</p>
                <p>I am Happiness.</p>
                <p>I am Love.</p>
                <p>I am the Money of the Father.</p>
                <p className="mt-4">I sincerely repent, repent, repent.</p>
                <p>I am grateful, grateful, grateful —</p>
                <p>in the Pure Loving Light of Father Universe.</p>
              </div>
            </div>
          </section>

          {/* CTA */}
          <div className="mt-16 flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="gap-2">
              <Link to="/fun-money"><Sparkles className="h-4 w-4" /> Mint FUN Money</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="gap-2">
              <Link to="/docs/platform"><BookOpen className="h-4 w-4" /> Tài liệu kỹ thuật <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-12">THE 5D WHITEPAPER – FUN MONEY v0.1 · Proof of Pure Love Protocol</p>
        </main>
      </div>
    </div>
  );
};

export default Whitepaper;
