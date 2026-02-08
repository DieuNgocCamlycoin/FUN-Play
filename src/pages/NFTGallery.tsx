import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAccount } from "wagmi";
import { MainLayout } from "@/components/Layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Image, Wallet, ExternalLink, Sparkles, Grid3X3, List } from "lucide-react";
import { toast } from "sonner";

interface NFT {
  id: string;
  name: string;
  description: string;
  image: string;
  collection: string;
  tokenId: string;
  contractAddress: string;
}

const NFTGallery = () => {
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const { address, isConnected } = useAccount();

  useEffect(() => {
    if (isConnected && address) {
      fetchNFTs();
    } else {
      setLoading(false);
    }
  }, [address, isConnected]);

  const fetchNFTs = async () => {
    setLoading(true);
    try {
      const mockNFTs: NFT[] = [
        {
          id: "1",
          name: "FUN Play Genesis #001",
          description: "The first FUN Play Genesis NFT collection",
          image: "https://images.unsplash.com/photo-1634973357973-f2ed2657db3c?w=400",
          collection: "FUN Play Genesis",
          tokenId: "001",
          contractAddress: "0x1234...5678",
        },
        {
          id: "2",
          name: "Cosmic Creator Badge",
          description: "Awarded to top content creators",
          image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400",
          collection: "FUN Play Badges",
          tokenId: "042",
          contractAddress: "0xabcd...efgh",
        },
        {
          id: "3",
          name: "Diamond Hands #777",
          description: "For the true believers",
          image: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400",
          collection: "Diamond Hands",
          tokenId: "777",
          contractAddress: "0x9876...5432",
        },
        {
          id: "4",
          name: "Aurora Spirit",
          description: "Mystical aurora themed artwork",
          image: "https://images.unsplash.com/photo-1579762715118-a6f1d4b934f1?w=400",
          collection: "Aurora Spirits",
          tokenId: "156",
          contractAddress: "0xfedc...ba98",
        },
      ];
      
      setTimeout(() => {
        setNfts(mockNFTs);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error("Error fetching NFTs:", error);
      toast.error("Không thể tải NFT");
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="p-4 lg:p-6 max-w-7xl mx-auto">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-[#00E7FF] to-[#FFD700] flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-[#00E7FF] via-[#7A2BFF] to-[#FFD700] bg-clip-text text-transparent">
                NFT Gallery
              </h1>
              <p className="text-muted-foreground">Bộ sưu tập NFT của bạn</p>
            </div>
          </div>
        </motion.div>

        {!isConnected ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <div className="w-24 h-24 rounded-full bg-gradient-to-r from-[#00E7FF]/20 to-[#FFD700]/20 flex items-center justify-center mb-6">
              <Wallet className="w-12 h-12 text-[#00E7FF]" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Kết nối ví để xem NFT</h2>
            <p className="text-muted-foreground mb-6 text-center max-w-md">
              Kết nối ví MetaMask hoặc Bitget Wallet để xem bộ sưu tập NFT của bạn
            </p>
            <Button
              className="bg-gradient-to-r from-[#00E7FF] to-[#FFD700] hover:opacity-90"
              onClick={() => toast.info("Vui lòng kết nối ví ở thanh điều hướng")}
            >
              <Wallet className="w-4 h-4 mr-2" />
              Kết nối ví
            </Button>
          </motion.div>
        ) : (
          <>
            {/* Controls */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-[#00E7FF]/50 text-[#00E7FF]">
                  {nfts.length} NFTs
                </Badge>
                <Badge variant="outline" className="border-[#FFD700]/50 text-[#FFD700]">
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </Badge>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={viewMode === "grid" ? "default" : "outline"}
                  size="icon"
                  onClick={() => setViewMode("grid")}
                  className={viewMode === "grid" ? "bg-[#00E7FF]" : ""}
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="icon"
                  onClick={() => setViewMode("list")}
                  className={viewMode === "list" ? "bg-[#00E7FF]" : ""}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* NFT Grid */}
            {loading ? (
              <div className={`grid gap-6 ${viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"}`}>
                {[...Array(4)].map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <Skeleton className="aspect-square w-full" />
                    <CardContent className="p-4">
                      <Skeleton className="h-5 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : nfts.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-20"
              >
                <Image className="w-16 h-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">Chưa có NFT nào</h3>
                <p className="text-muted-foreground">Bắt đầu sưu tập NFT đầu tiên của bạn!</p>
              </motion.div>
            ) : (
              <div className={`grid gap-6 ${viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"}`}>
                {nfts.map((nft, index) => (
                  <motion.div
                    key={nft.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="group overflow-hidden border-2 border-transparent hover:border-[#00E7FF]/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,231,255,0.3)]">
                      <div className={`relative ${viewMode === "list" ? "flex" : ""}`}>
                        <div className={`relative overflow-hidden ${viewMode === "list" ? "w-40 h-40" : "aspect-square"}`}>
                          <img
                            src={nft.image}
                            alt={nft.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          <Badge className="absolute top-3 left-3 bg-gradient-to-r from-[#00E7FF] to-[#FFD700]">
                            #{nft.tokenId}
                          </Badge>
                        </div>
                        <CardContent className={`p-4 ${viewMode === "list" ? "flex-1 flex flex-col justify-center" : ""}`}>
                          <h3 className="font-bold text-lg mb-1 truncate">{nft.name}</h3>
                          <p className="text-sm text-muted-foreground mb-2 truncate">{nft.collection}</p>
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{nft.description}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-[#00E7FF] font-mono">
                              {nft.contractAddress}
                            </span>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </MainLayout>
  );
};

export default NFTGallery;
