import { ShieldX, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BannedScreenProps {
  banReason: string | null;
  onSignOut: () => void;
}

export const BannedScreen = ({ banReason, onSignOut }: BannedScreenProps) => {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background">
      <div className="max-w-md w-full mx-4 text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
            <ShieldX className="w-10 h-10 text-destructive" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">
            Account Suspended
          </h1>
          <p className="text-muted-foreground">
            Your account has been suspended due to a violation of our platform policies.
          </p>
        </div>

        {banReason && (
          <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4">
            <p className="text-sm font-medium text-destructive">Reason</p>
            <p className="text-sm text-foreground mt-1">{banReason}</p>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          If you believe this is an error, please contact support.
        </p>

        <Button
          variant="outline"
          onClick={onSignOut}
          className="gap-2"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
};
