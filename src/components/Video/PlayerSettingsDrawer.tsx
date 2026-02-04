import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Repeat, Repeat1 } from "lucide-react";

interface PlayerSettingsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  playbackSpeed: number;
  onSpeedChange: (speed: number) => void;
  loopMode: "off" | "all" | "one";
  onLoopChange: (mode: "off" | "all" | "one") => void;
}

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

export function PlayerSettingsDrawer({
  open,
  onOpenChange,
  playbackSpeed,
  onSpeedChange,
  loopMode,
  onLoopChange,
}: PlayerSettingsDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="bg-background">
        <DrawerHeader>
          <DrawerTitle>Cài đặt</DrawerTitle>
        </DrawerHeader>

        <div className="p-4 space-y-6 pb-8">
          {/* Playback Speed */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Tốc độ phát</Label>
            <div className="flex flex-wrap gap-2">
              {SPEEDS.map((speed) => (
                <Button
                  key={speed}
                  variant={playbackSpeed === speed ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    onSpeedChange(speed);
                    onOpenChange(false);
                  }}
                  className="min-w-[60px]"
                >
                  {speed === 1 ? "Bình thường" : `${speed}x`}
                </Button>
              ))}
            </div>
          </div>

          {/* Loop Mode */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Lặp lại</Label>
            <RadioGroup
              value={loopMode}
              onValueChange={(v) => {
                onLoopChange(v as "off" | "all" | "one");
                onOpenChange(false);
              }}
              className="space-y-1"
            >
              <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted transition-colors">
                <RadioGroupItem value="off" id="loop-off" />
                <Label htmlFor="loop-off" className="flex-1 cursor-pointer">
                  Tắt
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted transition-colors">
                <RadioGroupItem value="all" id="loop-all" />
                <Label
                  htmlFor="loop-all"
                  className="flex-1 cursor-pointer flex items-center gap-2"
                >
                  <Repeat className="h-4 w-4" />
                  Lặp tất cả
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted transition-colors">
                <RadioGroupItem value="one" id="loop-one" />
                <Label
                  htmlFor="loop-one"
                  className="flex-1 cursor-pointer flex items-center gap-2"
                >
                  <Repeat1 className="h-4 w-4" />
                  Lặp một video
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
