import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Smartphone, CheckCircle, Share, Plus, MoreVertical, Home, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const InstallPWA = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [platform, setPlatform] = useState<"ios" | "android" | "desktop">("desktop");
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    // Detect platform
    const userAgent = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) {
      setPlatform("ios");
    } else if (/android/.test(userAgent)) {
      setPlatform("android");
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setIsInstalled(true);
    }

    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4 flex flex-col items-center justify-center">
      {/* Back button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 left-4 text-foreground"
        onClick={() => navigate("/")}
      >
        <ArrowLeft className="w-5 h-5" />
      </Button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="border-primary/20 bg-card/80 backdrop-blur-sm shadow-2xl">
          <CardHeader className="text-center pb-2">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
              className="mx-auto mb-4 w-24 h-24 rounded-2xl bg-gradient-to-br from-primary via-cosmic-cyan to-cosmic-gold flex items-center justify-center shadow-lg"
            >
              <Smartphone className="w-12 h-12 text-primary-foreground" />
            </motion.div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary via-cosmic-cyan to-cosmic-gold bg-clip-text text-transparent">
              Cài đặt FUN PLAY
            </CardTitle>
            <CardDescription className="text-muted-foreground mt-2">
              Trải nghiệm ứng dụng mượt mà như app thật
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {isInstalled ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center space-y-4"
              >
                <div className="w-20 h-20 mx-auto rounded-full bg-green-500/20 flex items-center justify-center">
                  <CheckCircle className="w-12 h-12 text-green-500" />
                </div>
                <p className="text-foreground font-medium text-lg">
                  Ứng dụng đã được cài đặt! 🎉
                </p>
                <p className="text-muted-foreground text-sm">
                  Bạn có thể mở FUN PLAY từ màn hình chính
                </p>
                <Button
                  onClick={() => navigate("/")}
                  className="w-full bg-gradient-to-r from-primary to-cosmic-cyan text-primary-foreground hover:opacity-90 h-12"
                >
                  <Home className="w-5 h-5 mr-2" />
                  Về trang chủ
                </Button>
              </motion.div>
            ) : (
              <>
                {/* Benefits */}
                <div className="space-y-3 bg-muted/30 p-4 rounded-xl">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <span className="text-xl">✨</span>
                    Lợi ích khi cài đặt:
                  </h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-primary" />
                      Truy cập nhanh từ màn hình chính
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-primary" />
                      Trải nghiệm fullscreen như app thật
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-primary" />
                      Tải nhanh hơn và hoạt động offline
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-primary" />
                      Nhận thông báo về video mới
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-primary" />
                      Đồng bộ ví Web3 và giao dịch
                    </li>
                  </ul>
                </div>

                {deferredPrompt ? (
                  <Button
                    onClick={handleInstall}
                    className="w-full bg-gradient-to-r from-primary to-cosmic-cyan text-primary-foreground hover:opacity-90 h-14 text-lg"
                    size="lg"
                  >
                    <Download className="w-6 h-6 mr-2" />
                    Cài đặt ngay
                  </Button>
                ) : (
                  <div className="space-y-4">
                    {/* iOS Instructions */}
                    {platform === "ios" && (
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-muted/50 p-4 rounded-xl space-y-3"
                      >
                        <div className="flex items-center gap-2 text-foreground font-semibold">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
                            <span className="text-white text-sm">🍎</span>
                          </div>
                          Hướng dẫn cho iPhone/iPad
                        </div>
                        <div className="space-y-3 text-sm">
                          <div className="flex items-start gap-3 p-3 bg-background/50 rounded-lg">
                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                              <span className="text-primary font-bold">1</span>
                            </div>
                            <div>
                              <p className="text-foreground font-medium">Nhấn nút Chia sẻ</p>
                              <p className="text-muted-foreground flex items-center gap-1">
                                Biểu tượng <Share className="w-4 h-4 inline" /> ở thanh dưới
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3 p-3 bg-background/50 rounded-lg">
                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                              <span className="text-primary font-bold">2</span>
                            </div>
                            <div>
                              <p className="text-foreground font-medium">Cuộn xuống và chọn</p>
                              <p className="text-muted-foreground flex items-center gap-1">
                                <Plus className="w-4 h-4" /> "Thêm vào Màn hình chính"
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3 p-3 bg-background/50 rounded-lg">
                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                              <span className="text-primary font-bold">3</span>
                            </div>
                            <div>
                              <p className="text-foreground font-medium">Nhấn "Thêm"</p>
                              <p className="text-muted-foreground">Ở góc phải trên cùng</p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Android Instructions */}
                    {platform === "android" && (
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-muted/50 p-4 rounded-xl space-y-3"
                      >
                        <div className="flex items-center gap-2 text-foreground font-semibold">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center">
                            <span className="text-white text-sm">🤖</span>
                          </div>
                          Hướng dẫn cho Android
                        </div>
                        <div className="space-y-3 text-sm">
                          <div className="flex items-start gap-3 p-3 bg-background/50 rounded-lg">
                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                              <span className="text-primary font-bold">1</span>
                            </div>
                            <div>
                              <p className="text-foreground font-medium">Mở menu trình duyệt</p>
                              <p className="text-muted-foreground flex items-center gap-1">
                                Nhấn biểu tượng <MoreVertical className="w-4 h-4 inline" /> ở góc phải
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3 p-3 bg-background/50 rounded-lg">
                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                              <span className="text-primary font-bold">2</span>
                            </div>
                            <div>
                              <p className="text-foreground font-medium">Chọn "Cài đặt ứng dụng"</p>
                              <p className="text-muted-foreground">Hoặc "Thêm vào Màn hình chính"</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3 p-3 bg-background/50 rounded-lg">
                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                              <span className="text-primary font-bold">3</span>
                            </div>
                            <div>
                              <p className="text-foreground font-medium">Xác nhận cài đặt</p>
                              <p className="text-muted-foreground">Nhấn "Cài đặt" trong hộp thoại</p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Desktop Instructions */}
                    {platform === "desktop" && (
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-muted/50 p-4 rounded-xl space-y-4"
                      >
                        <p className="text-sm text-muted-foreground text-center">
                          Truy cập trang này trên điện thoại để cài đặt app
                        </p>
                        
                        {/* Both platform instructions for desktop */}
                        <div className="grid gap-4">
                          <div className="p-3 bg-background/50 rounded-lg">
                            <p className="font-semibold text-foreground text-sm mb-2">📱 iPhone/iPad (Safari):</p>
                            <p className="text-xs text-muted-foreground">
                              Chia sẻ → Thêm vào Màn hình chính
                            </p>
                          </div>
                          <div className="p-3 bg-background/50 rounded-lg">
                            <p className="font-semibold text-foreground text-sm mb-2">🤖 Android (Chrome):</p>
                            <p className="text-xs text-muted-foreground">
                              Menu (⋮) → Cài đặt ứng dụng
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    <Button
                      onClick={() => navigate("/")}
                      variant="outline"
                      className="w-full h-12"
                    >
                      <Home className="w-5 h-5 mr-2" />
                      Về trang chủ
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Fun fact */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-xs text-muted-foreground mt-4 px-4"
        >
          💡 Mẹo: Khi cài đặt, bạn sẽ nhận thông báo khi có video mới và kiếm được CAMLY rewards!
        </motion.p>
      </motion.div>
    </div>
  );
};

export default InstallPWA;
