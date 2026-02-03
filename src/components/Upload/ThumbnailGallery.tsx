import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Check, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface ThumbnailGalleryProps {
  onSelect: (url: string) => void;
}

// Placeholder thumbnail templates - can be replaced with actual template URLs
const THUMBNAIL_CATEGORIES = [
  {
    name: "Ánh sáng & Healing",
    templates: [
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=640&h=360&fit=crop",
      "https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=640&h=360&fit=crop",
      "https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=640&h=360&fit=crop",
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=640&h=360&fit=crop",
    ],
  },
  {
    name: "Thiền định",
    templates: [
      "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=640&h=360&fit=crop",
      "https://images.unsplash.com/photo-1528715471579-d1bcf0ba5e83?w=640&h=360&fit=crop",
      "https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=640&h=360&fit=crop",
      "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=640&h=360&fit=crop",
    ],
  },
  {
    name: "Vũ trụ & Stars",
    templates: [
      "https://images.unsplash.com/photo-1464802686167-b939a6910659?w=640&h=360&fit=crop",
      "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=640&h=360&fit=crop",
      "https://images.unsplash.com/photo-1462332420958-a05d1e002413?w=640&h=360&fit=crop",
      "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=640&h=360&fit=crop",
    ],
  },
  {
    name: "Thiên nhiên",
    templates: [
      "https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=640&h=360&fit=crop",
      "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=640&h=360&fit=crop",
      "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=640&h=360&fit=crop",
      "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=640&h=360&fit=crop",
    ],
  },
  {
    name: "Gradient & Abstract",
    templates: [
      "https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=640&h=360&fit=crop",
      "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=640&h=360&fit=crop",
      "https://images.unsplash.com/photo-1557683316-973673baf926?w=640&h=360&fit=crop",
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=640&h=360&fit=crop",
    ],
  },
];

export function ThumbnailGallery({ onSelect }: ThumbnailGalleryProps) {
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState(THUMBNAIL_CATEGORIES[0].name);

  const handleSelect = (url: string) => {
    setSelectedUrl(url);
    onSelect(url);
  };

  return (
    <div className="space-y-4">
      {/* Category Tabs */}
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-2 pb-2">
          {THUMBNAIL_CATEGORIES.map((category) => (
            <Button
              key={category.name}
              variant={activeCategory === category.name ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveCategory(category.name)}
              className="flex-shrink-0"
            >
              {category.name}
            </Button>
          ))}
        </div>
      </ScrollArea>

      {/* Gallery Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {THUMBNAIL_CATEGORIES.find((c) => c.name === activeCategory)?.templates.map(
          (url, index) => (
            <button
              key={index}
              onClick={() => handleSelect(url)}
              className={cn(
                "relative aspect-video rounded-lg overflow-hidden border-2 transition-all hover:scale-105",
                selectedUrl === url
                  ? "border-primary ring-2 ring-primary/50"
                  : "border-transparent hover:border-primary/50"
              )}
            >
              <img
                src={url}
                alt={`Template ${index + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              {selectedUrl === url && (
                <div className="absolute inset-0 bg-primary/30 flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-5 h-5 text-primary-foreground" />
                  </div>
                </div>
              )}
            </button>
          )
        )}
      </div>

      {/* Info */}
      <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 text-sm">
        <Sparkles className="w-4 h-4 text-primary" />
        <span className="text-muted-foreground">
          Chọn template rồi vào tab "Chỉnh sửa" để thêm text
        </span>
      </div>
    </div>
  );
}
