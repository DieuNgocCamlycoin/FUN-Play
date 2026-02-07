import { useState } from "react";
import { X, Sparkles, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";

interface GifPickerProps {
  onSelect: (gifUrl: string) => void;
  onClose: () => void;
}

// Pre-loaded celebration GIFs from GIPHY (stable URLs)
const CELEBRATION_GIFS = [
  // Money & Celebration
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcWZrOWJxaTN0d3NlMnJmMnVyOWZxOGtjcm9yY3JyemxqaXB2MWNsdiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o6Zt6cQPT8dpg4YkE/giphy.gif", // Money rain
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExdHd1bTBoNWJkMm5wN2doaXk0Z295bHc4bHdyN2c5MnZtaHQ3bGNxaiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/KzDqC8LvVC4lshCsGJ/giphy.gif", // Rich money
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExY3M5aHp6eGh5cGZocnBuaXM1aDZncW54MGZkcDV4czdnOGk1cnZ6aiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/26tP4gFBQewkLnMv6/giphy.gif", // Confetti celebration
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbjJ0MGN5MDg3NTN2dHFlNGF4dzR6dXZsMWR0NnpsMzE5cWNuOGY0byZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l0MYt5jPR6QX5pnqM/giphy.gif", // Party celebration
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExN3k5dXBxNmRvcHZ5cjFmbnpxbGttMjBzZDBxN3Z3Ymx3eGoyNm95eSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/g9582DNuQppxC/giphy.gif", // Happy dance
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExYmF6aHl0NWZqcG92OWt3NDB1Z3V1ZnJxNjQ0MnFobG93OXM5dnl5bCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/26u4cqiYI30juCOGY/giphy.gif", // Fireworks
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcXRxZ3UzMWVvbnEzbGd6NW5mdWFvazZ6eWhuOWlmcHEzMmFwcmM2aSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o7btNa0RUYa5E7iiQ/giphy.gif", // Gold coins
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExaDc4dWVhdndjZHlxMHM0OGoyZnM3NGxxb3VucGx1d3E3dHJlNGprcyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l0HlSSpu4J2LhVu36/giphy.gif", // Happy jump
  // Love & Heart
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNXZ1Z3ZlN3BkZnBpNjkxdG5xOTByaHIxYWhxNHMxcTRsOWVudnJrayZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/26BRv0ThflsHCqDrG/giphy.gif", // Heart love
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZm9vdjY0bDB0czBhN2FtZGF4MzN3bHh0aWlkbXNjNmNsZGFocHZ0aiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l4pTdcifPZLpDjL1e/giphy.gif", // Thank you hearts
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExOG5rOXhwbWdhYmNyNnZncjJydWgycmR2ZHB1Zm1hNDIza3RjdDNpdyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l2JhORT5IFnj6ioko/giphy.gif", // Sparkle hearts
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExdGJ5cDV3cHZ1ZG5yZThwaWZtZHUzNTdlZjVkb3lvaW1obWRsZnE4aiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3oEjI4sFlp73fvEYgw/giphy.gif", // Flying hearts
  // Grateful & Thanks
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExYnVxcHo0b2k2YnN5YmFjamRpaDg0ZGxjMDZrbTVhZmRlOWhkZ3BsNyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/ZfK4cXKJTTay1Ava29/giphy.gif", // Thank you bow
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExOHR1bW5yZGFmZXdhbHl4aDQ5cWEweml5dnh3bzVyMW4yc2o4MWJjNyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/osjgQPWRx3cac/giphy.gif", // Thank you
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZ2hoMjhxZnpqbmJmYnQ5dXNwbHBmMGptcm1lZG91Y244cWlnZ3czZSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3oz8xIsloV7zOmt81G/giphy.gif", // Clapping
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExaHB4dTd6NHIxeGFuY2xrYmpnNDlhNWYxbjFycHJxeTQ3d3preTJ1YyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l3q2XhfQ8oCkm1Ts4/giphy.gif", // Thumbs up
];

const GIF_CATEGORIES = [
  { name: "Tất cả", filter: null },
  { name: "Tiền 💰", filter: [0, 1, 2, 6] },
  { name: "Ăn mừng 🎉", filter: [3, 4, 5, 7] },
  { name: "Yêu thương 💖", filter: [8, 9, 10, 11] },
  { name: "Cảm ơn 🙏", filter: [12, 13, 14, 15] },
];

export const GifPicker = ({ onSelect, onClose }: GifPickerProps) => {
  const [selectedCategory, setSelectedCategory] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  const getFilteredGifs = () => {
    const category = GIF_CATEGORIES[selectedCategory];
    let gifs = category.filter 
      ? category.filter.map((i) => CELEBRATION_GIFS[i]).filter(Boolean)
      : CELEBRATION_GIFS;

    if (searchQuery) {
      // Simple search - just filter based on index for now
      gifs = gifs.slice(0, 8);
    }

    return gifs;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="border border-border rounded-xl bg-card shadow-xl overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[hsl(var(--cosmic-magenta))]" />
          <span className="font-medium text-sm">Chọn GIF</span>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Search (placeholder for future GIPHY API) */}
      <div className="p-2 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm GIF..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-8 text-sm"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="flex gap-1 p-2 border-b border-border overflow-x-auto">
        {GIF_CATEGORIES.map((cat, index) => (
          <Button
            key={cat.name}
            variant={selectedCategory === index ? "default" : "ghost"}
            size="sm"
            className={`text-xs whitespace-nowrap h-7 px-2 ${
              selectedCategory === index 
                ? "bg-[hsl(var(--cosmic-cyan))] text-white" 
                : ""
            }`}
            onClick={() => setSelectedCategory(index)}
          >
            {cat.name}
          </Button>
        ))}
      </div>

      {/* GIF Grid */}
      <ScrollArea className="h-[200px]">
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 p-2">
          <AnimatePresence mode="popLayout">
            {getFilteredGifs().map((gif, index) => (
              <motion.button
                key={gif}
                type="button"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.03 }}
                className="aspect-square rounded-lg overflow-hidden border border-transparent hover:border-[hsl(var(--cosmic-cyan))] hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-[hsl(var(--cosmic-cyan))]"
                onClick={() => onSelect(gif)}
              >
                <img
                  src={gif}
                  alt={`GIF ${index + 1}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </motion.button>
            ))}
          </AnimatePresence>
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-2 border-t border-border bg-muted/30">
        <p className="text-xs text-muted-foreground text-center">
          Powered by GIPHY ✨
        </p>
      </div>
    </motion.div>
  );
};

export default GifPicker;
