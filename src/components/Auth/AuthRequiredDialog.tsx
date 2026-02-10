import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
        <DialogHeader className="text-center">
          <DialogTitle className="text-xl font-extrabold text-center bg-gradient-to-r from-primary via-yellow-400 to-primary bg-clip-text text-transparent">
            VUI LÒNG ĐĂNG KÝ ĐỂ ĐƯỢC CHƠI, ĐƯỢC HỌC, ĐƯỢC VỌC, ĐƯỢC LÌ XÌ 🧧
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground pt-2">
            Đăng ký tài khoản miễn phí để tương tác và nhận thưởng CAMLY trên nền tảng FUN Play!
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-2">
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
