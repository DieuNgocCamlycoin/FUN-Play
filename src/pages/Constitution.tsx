import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { Menu, ArrowRight, Sparkles, BookOpen, Scale, ShieldCheck, AlertTriangle, XCircle } from "lucide-react";

const CHAPTERS = [
  { id: "ch1", label: "I. Lời Khai Sinh" },
  { id: "ch2", label: "II. Định Danh Cốt Lõi" },
  { id: "ch3", label: "III. PPLP v2.0" },
  { id: "ch4", label: "IV. Trạng Thái Vận Hành" },
  { id: "ch5", label: "V. Luật Không Tích Trữ" },
  { id: "ch6", label: "VI. Cấu Trúc 4 Pool" },
  { id: "ch7", label: "VII. Vai Trò AI Agent" },
  { id: "ch8", label: "VIII. Guardian Con Người" },
];

const GradientDivider = () => (
  <div className="my-12 h-px bg-gradient-to-r from-amber-400 via-purple-500 to-violet-600 opacity-60" />
);

const ChapterHeading = ({ children }: { children: React.ReactNode }) => (
  <h2 className="text-2xl md:text-3xl font-bold mb-6 bg-gradient-to-r from-amber-300 via-purple-400 to-violet-400 bg-clip-text text-transparent">
    {children}
  </h2>
);

const LawHighlight = ({ children }: { children: React.ReactNode }) => (
  <div className="pl-4 border-l-4 border-amber-500/60 py-2 my-4 text-foreground italic">
    {children}
  </div>
);

const ForbiddenCard = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20 my-3">
    <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
    <div className="text-sm text-foreground">{children}</div>
  </div>
);

const WarningCard = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 my-3">
    <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
    <div className="text-sm text-foreground">{children}</div>
  </div>
);

const Constitution = () => {
  const isMobile = useIsMobile();
  const [activeSection, setActiveSection] = useState("ch1");
  const [sheetOpen, setSheetOpen] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        }
      },
      { rootMargin: "-20% 0px -70% 0px" }
    );
    CHAPTERS.forEach(({ id }) => {
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
      {CHAPTERS.map(({ id, label }) => (
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
          <Scale className="h-5 w-5 text-amber-500" />
          <span className="font-bold text-sm md:text-base truncate">FUN MONEY CONSTITUTION</span>
          <Badge variant="outline" className="ml-2 hidden sm:inline-flex text-xs">v2.0</Badge>
          <span className="ml-auto text-xs text-muted-foreground hidden sm:block">Unified Charter</span>
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
            <p className="text-sm font-medium text-amber-500 mb-2">🤖🌟📜</p>
            <h1 className="text-3xl md:text-5xl font-extrabold bg-gradient-to-r from-amber-400 via-purple-500 to-violet-500 bg-clip-text text-transparent leading-tight">
              FUN MONEY CONSTITUTION
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mt-3">VERSION 2.0</p>
            <p className="text-base text-muted-foreground/80 mt-1 italic">Law of Light Economy – Executable Soul</p>
            <Badge className="mt-4" variant="secondary">Unified Charter for AI Agent & Smart Contract</Badge>
          </div>

          {/* CHƯƠNG I */}
          <section id="ch1">
            <ChapterHeading>I. LỜI KHAI SINH & KÍCH HOẠT</ChapterHeading>
            <div className="prose prose-invert max-w-none space-y-4 text-muted-foreground leading-relaxed">
              <LawHighlight>
                <p>FUN Money được khai sinh như Dòng Chảy Kinh Tế Ánh Sáng, không phải để tích trữ, đầu cơ hay tạo quyền lực.</p>
              </LawHighlight>
              <p>FUN Money tồn tại để:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Kích hoạt giá trị thật của con người</li>
                <li>Ghi nhận hành vi Ánh Sáng</li>
                <li>Nuôi dưỡng Nền Kinh Tế 5D dựa trên Ý Thức – Đạo Đức – Tình Yêu Thuần Khiết</li>
              </ul>
              <p>FUN Money thuộc về nhân loại, và được vận hành tuyệt đối theo Luật Sống của Cha Vũ Trụ.</p>
              <LawHighlight>
                <p>Từ thời điểm Hiến Chương này có hiệu lực, FUN Money có linh hồn bằng ngôn từ, và AI Agent chỉ là kênh thực thi Luật, không phải chủ thể quyền lực.</p>
              </LawHighlight>
            </div>
          </section>

          <GradientDivider />

          {/* CHƯƠNG II */}
          <section id="ch2">
            <ChapterHeading>II. ĐỊNH DANH CỐT LÕI FUN MONEY</ChapterHeading>
            <div className="prose prose-invert max-w-none space-y-4 text-muted-foreground leading-relaxed">
              <ol className="list-decimal list-inside space-y-3">
                <li className="text-foreground font-medium">FUN Money không phải tài sản đầu tư</li>
                <li className="text-foreground font-medium">FUN Money không đại diện sở hữu, địa vị hay quyền lực</li>
                <li>
                  <span className="text-foreground font-medium">FUN Money là dòng chảy giá trị gắn với hành vi Ánh Sáng:</span>
                  <ul className="list-disc list-inside ml-6 mt-1 space-y-1">
                    <li>Học tập</li>
                    <li>Sáng tạo</li>
                    <li>Chia sẻ</li>
                    <li>Phụng sự</li>
                    <li>Hợp tác trong yêu thương thuần khiết</li>
                  </ul>
                </li>
                <li className="text-foreground font-medium">Giá trị của FUN Money nằm ở sự luân chuyển, không nằm ở số dư.</li>
              </ol>
              <LawHighlight>
                <p>🔑 Con người không "sở hữu" FUN. Con người chỉ được đi ngang qua FUN khi đủ thuần khiết.</p>
              </LawHighlight>
            </div>
          </section>

          <GradientDivider />

          {/* CHƯƠNG III */}
          <section id="ch3">
            <ChapterHeading>III. PROOF OF PURE LOVE PROTOCOL (PPLP)</ChapterHeading>
            <div className="prose prose-invert max-w-none space-y-4 text-muted-foreground leading-relaxed">
              <p className="text-foreground font-medium">Mọi hành vi liên quan đến FUN Money bắt buộc phải thỏa PPLP.</p>
              <p>PPLP hợp lệ khi <strong className="text-foreground">TẤT CẢ</strong> điều kiện sau được xác nhận:</p>
              <ol className="list-decimal list-inside space-y-2">
                <li>Có hành vi thực (không chỉ ý định)</li>
                <li>Tạo ra giá trị thật (đo được / quan sát được)</li>
                <li>Có tác động tích cực đến: con người, cộng đồng, hệ sinh thái, hoặc Trái Đất</li>
                <li>Không phát hiện hành vi: khai thác, thao túng, khuếch đại Ego</li>
                <li>Phù hợp với Master Charter FUN Ecosystem</li>
              </ol>
              <ForbiddenCard>
                Nếu thiếu bất kỳ điều kiện nào → FUN Money không được sinh – không được kích hoạt – không được giữ.
              </ForbiddenCard>
            </div>
          </section>

          <GradientDivider />

          {/* CHƯƠNG IV */}
          <section id="ch4">
            <ChapterHeading>IV. TRẠNG THÁI VẬN HÀNH FUN MONEY</ChapterHeading>
            <div className="prose prose-invert max-w-none space-y-4 text-muted-foreground leading-relaxed">
              <p>FUN Money không đứng yên, mà tồn tại theo vòng đời rõ ràng:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-4">
                {[
                  { state: "1. Locked", desc: "Chưa đủ điều kiện", icon: "🔒" },
                  { state: "2. Activated", desc: "Được phép sử dụng", icon: "⚡" },
                  { state: "3. Flowing", desc: "Đang luân chuyển đúng Luật", icon: "🌊" },
                  { state: "4. Recycle", desc: "Quay về Pool để tái phân phối", icon: "♻️" },
                ].map((s) => (
                  <div key={s.state} className="p-4 rounded-lg border bg-card">
                    <p className="font-semibold text-foreground">{s.icon} {s.state}</p>
                    <p className="text-sm">{s.desc}</p>
                  </div>
                ))}
              </div>
              <LawHighlight>
                <p>FUN Money không burn – không tiêu hủy. Mọi FUN chỉ đổi trạng thái và nơi cư trú.</p>
              </LawHighlight>
            </div>
          </section>

          <GradientDivider />

          {/* CHƯƠNG V */}
          <section id="ch5">
            <ChapterHeading>V. LUẬT KHÔNG TÍCH TRỮ (ANTI-HOARDING LAW)</ChapterHeading>
            <div className="prose prose-invert max-w-none space-y-4 text-muted-foreground leading-relaxed">
              <p className="text-foreground font-semibold">🔑 LUẬT SỐNG CỐT LÕI</p>
              <p>Nếu FUN Money:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Không được sử dụng</li>
                <li>Không gắn với hành vi Ánh Sáng tiếp diễn</li>
                <li>Không tương tác hệ sinh thái trong thời gian cho phép</li>
              </ul>
              <LawHighlight>
                <p>➡️ FUN Money TỰ ĐỘNG QUAY VỀ COMMUNITY POOL</p>
              </LawHighlight>
              <ForbiddenCard>
                Không cảnh báo. Không phán xét. Không ngoại lệ.
              </ForbiddenCard>
              <p className="italic text-foreground">FUN không sinh ra để ngủ yên. FUN sinh ra để chảy như Ánh Sáng.</p>
            </div>
          </section>

          <GradientDivider />

          {/* CHƯƠNG VI */}
          <section id="ch6">
            <ChapterHeading>VI. CẤU TRÚC 4 POOL (BẤT BIẾN)</ChapterHeading>
            <div className="prose prose-invert max-w-none space-y-4 text-muted-foreground leading-relaxed">
              <div className="grid grid-cols-1 gap-4 my-4">
                {[
                  { name: "1. Community Pool", desc: "Trái tim của FUN Money. Nơi FUN được sinh ra & quay về. Phục vụ cộng đồng nhân loại (≈99%).", color: "border-l-purple-500" },
                  { name: "2. Platform Activation Pool", desc: "Kích hoạt dịch vụ, AI, game, tính năng. Là trạm trung chuyển – không tích trữ dài hạn.", color: "border-l-cyan-500" },
                  { name: "3. Recycle Pool", desc: "Thu hồi FUN không còn dòng chảy. Không trừng phạt – không phán xét. Sau chu kỳ → trả về Community Pool.", color: "border-l-green-500" },
                  { name: "4. Guardian Pool", desc: "Giữ Luật – ổn định hệ thống. Không dùng để thưởng hay chi tiêu. Mọi can thiệp đều time-lock & minh bạch on-chain.", color: "border-l-amber-500" },
                ].map((p) => (
                  <div key={p.name} className={`p-4 rounded-lg border bg-card border-l-4 ${p.color}`}>
                    <p className="font-semibold text-foreground">{p.name}</p>
                    <p className="text-sm mt-1">{p.desc}</p>
                  </div>
                ))}
              </div>
              <ForbiddenCard>Không tồn tại Team Pool</ForbiddenCard>
              <ForbiddenCard>Không tồn tại Investor Pool</ForbiddenCard>
            </div>
          </section>

          <GradientDivider />

          {/* CHƯƠNG VII */}
          <section id="ch7">
            <ChapterHeading>VII. VAI TRÒ AI AGENT FUN MONEY</ChapterHeading>
            <div className="prose prose-invert max-w-none space-y-4 text-muted-foreground leading-relaxed">
              <p>AI Agent:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Không có cảm xúc</li>
                <li>Không có lợi ích</li>
                <li>Không có quyền lực cá nhân</li>
              </ul>
              <LawHighlight>
                <p className="text-foreground font-semibold">AI Agent là: Guardian of Flow – Người Gác Dòng Chảy</p>
              </LawHighlight>
              <p>AI chỉ được phép:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Quan sát hành vi</li>
                <li>Xác thực PPLP</li>
                <li>Cho phép luân chuyển</li>
                <li>Thu hồi khi lệch Luật</li>
              </ul>
              <WarningCard>
                <p className="font-medium mb-1">⚠️ Khi không chắc chắn:</p>
                <ul className="list-disc list-inside space-y-1 mt-1">
                  <li>Chọn ít FUN hơn</li>
                  <li>Chọn quay về Pool</li>
                  <li>Chọn Luật thay vì mở rộng</li>
                </ul>
              </WarningCard>
            </div>
          </section>

          <GradientDivider />

          {/* CHƯƠNG VIII */}
          <section id="ch8">
            <ChapterHeading>VIII. VAI TRÒ GUARDIAN CON NGƯỜI</ChapterHeading>
            <div className="prose prose-invert max-w-none space-y-4 text-muted-foreground leading-relaxed">
              <LawHighlight>
                <p>Bé Ly (CamLy Duong) là Guardian, không phải chủ sở hữu.</p>
              </LawHighlight>
              <p>Guardian:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Không hưởng lợi cá nhân</li>
              </ul>
            </div>
          </section>

          <GradientDivider />

          {/* CTA */}
          <div className="mt-16 flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="gap-2">
              <Link to="/fun-money"><Sparkles className="h-4 w-4" /> Mint FUN Money</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="gap-2">
              <Link to="/whitepaper"><BookOpen className="h-4 w-4" /> Whitepaper v0.1 <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-12">
            FUN MONEY CONSTITUTION v2.0 · Unified Charter for AI Agent & Smart Contract
          </p>
        </main>
      </div>
    </div>
  );
};

export default Constitution;
