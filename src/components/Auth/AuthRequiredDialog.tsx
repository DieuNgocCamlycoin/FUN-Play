import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface AuthRequiredDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuthRequiredDialog({ open, onOpenChange }: AuthRequiredDialogProps) {
  const navigate = useNavigate();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-2 border-primary/30 bg-gradient-to-br from-background via-background to-primary/5">
        <DialogHeader className="text-center space-y-4">
          {/* Vietnamese */}
          <DialogTitle className="text-xl font-extrabold text-center bg-gradient-to-r from-primary via-yellow-400 to-primary bg-clip-text text-transparent">
            VUI LÒNG ĐĂNG KÝ ĐỂ
          </DialogTitle>
          <ul className="text-left space-y-1.5 pl-4 text-foreground font-semibold text-base">
            <li>• ĐƯỢC CHƠI 🌼</li>
            <li>• ĐƯỢC HỌC 📚</li>
            <li>• ĐƯỢC VỌC 📲</li>
            <li>• ĐƯỢC LÌ XÌ 🧧</li>
          </ul>

          {/* English */}
          <p className="text-lg font-extrabold text-center bg-gradient-to-r from-primary via-yellow-400 to-primary bg-clip-text text-transparent pt-2">
            PLEASE REGISTER FOR
          </p>
          <ul className="text-left space-y-1.5 pl-4 text-muted-foreground font-medium text-sm">
            <li>• USE & EARN 💰</li>
            <li>• LEARN & EARN 💵</li>
            <li>• GIVE & GAIN 🏅</li>
            <li>• REVIEW & REWARD 🏆</li>
          </ul>
        </DialogHeader>
        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-2 pt-4">
          <Button
            className="w-full sm:w-auto bg-gradient-to-r from-primary to-yellow-500 hover:opacity-90 font-bold"
            onClick={() => {
              onOpenChange(false);
              navigate("/auth");
            }}
          >
            Đăng ký / Đăng nhập
          </Button>
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => onOpenChange(false)}
          >
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
