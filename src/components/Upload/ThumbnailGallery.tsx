import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

interface ThumbnailGalleryProps {
  onSelect: (url: string) => void;
}

// Expanded thumbnail templates with more variety
const THUMBNAIL_CATEGORIES = [
  {
    name: "Ánh sáng & Healing",
    emoji: "✨",
    templates: [
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=640&h=360&fit=crop",
      "https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=640&h=360&fit=crop",
      "https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=640&h=360&fit=crop",
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=640&h=360&fit=crop",
      "https://images.unsplash.com/photo-1475274047050-1d0c0975c63e?w=640&h=360&fit=crop",
      "https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?w=640&h=360&fit=crop",
      "https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=640&h=360&fit=crop",
      "https://images.unsplash.com/photo-1532274402911-5a369e4c4bb5?w=640&h=360&fit=crop",
    ],
  },
  {
    name: "Thiền định",
    emoji: "🧘",
    templates: [
      "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=640&h=360&fit=crop",
      "https://images.unsplash.com/photo-1528715471579-d1bcf0ba5e83?w=640&h=360&fit=crop",
      "https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=640&h=360&fit=crop",
      "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=640&h=360&fit=crop",
      "https://images.unsplash.com/photo-1508672019048-805c876b67e2?w=640&h=360&fit=crop",
      "https://images.unsplash.com/photo-1545389336-cf090694435e?w=640&h=360&fit=crop",
      "https://images.unsplash.com/photo-1593811167562-9cef47bfc4d7?w=640&h=360&fit=crop",
      "https://images.unsplash.com/photo-1602192509154-0b900ee1f851?w=640&h=360&fit=crop",
    ],
  },
  {
    name: "Vũ trụ & Stars",
    emoji: "🌌",
    templates: [
      "https://images.unsplash.com/photo-1464802686167-b939a6910659?w=640&h=360&fit=crop",
      "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=640&h=360&fit=crop",
      "https://images.unsplash.com/photo-1462332420958-a05d1e002413?w=640&h=360&fit=crop",
      "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=640&h=360&fit=crop",
      "https://images.unsplash.com/photo-1520034475321-cbe63696469a?w=640&h=360&fit=crop",
      "https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=640&h=360&fit=crop",
      "https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?w=640&h=360&fit=crop",
      "https://images.unsplash.com/photo-1516339901601-2e1b62dc0c45?w=640&h=360&fit=crop",
    ],
  },
  {
    name: "Thiên nhiên",
    emoji: "🌿",
    templates: [
      "https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=640&h=360&fit=crop",
      "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=640&h=360&fit=crop",
      "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=640&h=360&fit=crop",
      "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=640&h=360&fit=crop",
      "https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=640&h=360&fit=crop",
      "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=640&h=360&fit=crop",
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=640&h=360&fit=crop",
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=640&h=360&fit=crop",
    ],
  },
  {
    name: "Gradient & Abstract",
    emoji: "🎨",
    templates: [
      "https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=640&h=360&fit=crop",
      "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=640&h=360&fit=crop",
      "https://images.unsplash.com/photo-1557683316-973673baf926?w=640&h=360&fit=crop",
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=640&h=360&fit=crop",
      "https://images.unsplash.com/photo-1550859492-d5da9d8e45f3?w=640&h=360&fit=crop",
      "https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=640&h=360&fit=crop",
      "https://images.unsplash.com/photo-1604076913837-52ab5629fba9?w=640&h=360&fit=crop",
      "https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?w=640&h=360&fit=crop",
    ],
  },
];

export function ThumbnailGallery({ onSelect }: ThumbnailGalleryProps) {
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState(THUMBNAIL_CATEGORIES[0].name);
  const [loadingImages, setLoadingImages] = useState<Set<string>>(new Set());
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());

  const handleSelect = (url: string) => {
    setSelectedUrl(url);
    onSelect(url);
  };

  const handleImageLoad = (url: string) => {
    setLoadedImages(prev => new Set(prev).add(url));
    setLoadingImages(prev => {
      const next = new Set(prev);
      next.delete(url);
      return next;
    });
  };

  const handleImageLoadStart = (url: string) => {
    if (!loadedImages.has(url)) {
      setLoadingImages(prev => new Set(prev).add(url));
    }
  };

  return (
    <div className="space-y-4">
      {/* Category Tabs - horizontal scroll on mobile */}
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-2 pb-2">
          {THUMBNAIL_CATEGORIES.map((category) => (
            <Button
              key={category.name}
              variant={activeCategory === category.name ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveCategory(category.name)}
              className={cn(
                "flex-shrink-0 gap-1.5 min-h-[40px]",
                activeCategory === category.name 
                  ? "bg-gradient-to-r from-[hsl(var(--cosmic-cyan))] to-[hsl(var(--cosmic-magenta))] text-white border-0 shadow-lg" 
                  : "hover:border-[hsl(var(--cosmic-cyan)/0.5)]"
              )}
            >
              <span>{category.emoji}</span>
              <span className="hidden xs:inline">{category.name}</span>
            </Button>
          ))}
        </div>
      </ScrollArea>

      {/* Gallery Grid - responsive with lazy loading */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <AnimatePresence mode="popLayout">
          {THUMBNAIL_CATEGORIES.find((c) => c.name === activeCategory)?.templates.map(
            (url, index) => (
              <motion.button
                key={url}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleSelect(url)}
                className={cn(
                  "relative aspect-video rounded-xl overflow-hidden border-2 transition-all group",
                  selectedUrl === url
                    ? "border-[hsl(var(--cosmic-cyan))] ring-2 ring-[hsl(var(--cosmic-magenta)/0.5)] shadow-lg shadow-[hsl(var(--cosmic-cyan)/0.3)]"
                    : "border-transparent hover:border-[hsl(var(--cosmic-cyan)/0.5)] hover:scale-105"
                )}
              >
                {/* Skeleton while loading */}
                {!loadedImages.has(url) && (
                  <Skeleton className="absolute inset-0" />
                )}
                
                <img
                  src={url}
                  alt={`Template ${index + 1}`}
                  className={cn(
                    "w-full h-full object-cover transition-opacity",
                    loadedImages.has(url) ? "opacity-100" : "opacity-0"
                  )}
                  loading="lazy"
                  onLoad={() => handleImageLoad(url)}
                  onLoadStart={() => handleImageLoadStart(url)}
                />
                
                {/* Rainbow glow on selected */}
                {selectedUrl === url && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--cosmic-cyan)/0.3)] to-[hsl(var(--cosmic-magenta)/0.3)] flex items-center justify-center"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[hsl(var(--cosmic-cyan))] to-[hsl(var(--cosmic-magenta))] flex items-center justify-center shadow-lg">
                      <Check className="w-6 h-6 text-white" />
                    </div>
                  </motion.div>
                )}

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
              </motion.button>
            )
          )}
        </AnimatePresence>
      </div>

      {/* Info */}
      <div className="flex items-center gap-2 p-3 rounded-xl bg-gradient-to-r from-[hsl(var(--cosmic-cyan)/0.1)] to-[hsl(var(--cosmic-magenta)/0.1)] border border-[hsl(var(--cosmic-cyan)/0.2)] text-sm">
        <Sparkles className="w-4 h-4 text-[hsl(var(--cosmic-gold))] flex-shrink-0" />
        <span className="text-muted-foreground">
          Chọn template rồi vào tab "Chỉnh sửa" để thêm text overlay ✨
        </span>
      </div>
    </div>
  );
}
