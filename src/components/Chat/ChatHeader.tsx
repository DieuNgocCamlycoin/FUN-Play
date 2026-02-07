import { ArrowLeft, Gift, Info, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { EnhancedDonateModal } from "@/components/Donate/EnhancedDonateModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ChatHeaderProps {
  otherUser: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
  showBackButton?: boolean;
}

export const ChatHeader = ({
  otherUser,
  showBackButton = false,
}: ChatHeaderProps) => {
  const navigate = useNavigate();
  const [donateModalOpen, setDonateModalOpen] = useState(false);

  const displayName = otherUser.display_name || otherUser.username;

  return (
    <>
      <div className="h-16 border-b flex items-center justify-between px-3 md:px-4 bg-background/95 backdrop-blur-xl">
        <div className="flex items-center gap-2 md:gap-3 min-w-0">
          {/* Mobile back button */}
          {showBackButton && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/messages")}
              className="flex-shrink-0 md:hidden"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}

          {/* User info */}
          <div
            className="flex items-center gap-3 min-w-0 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => navigate(`/user/${otherUser.id}`)}
          >
            <Avatar className="h-10 w-10 ring-2 ring-purple-200/50 flex-shrink-0">
              <AvatarImage src={otherUser.avatar_url || undefined} />
              <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-400 text-white font-medium">
                {displayName[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="font-semibold truncate">{displayName}</p>
              <p className="text-xs text-muted-foreground">
                @{otherUser.username}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {/* Donate button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDonateModalOpen(true)}
            className="text-amber-500 hover:text-amber-600 hover:bg-amber-50"
          >
            <Gift className="h-5 w-5" />
          </Button>

          {/* More options */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => navigate(`/user/${otherUser.id}`)}
              >
                <Info className="mr-2 h-4 w-4" />
                Xem trang cá nhân
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Donate Modal */}
      <EnhancedDonateModal
        open={donateModalOpen}
        onOpenChange={setDonateModalOpen}
        defaultReceiverId={otherUser.id}
        defaultReceiverName={otherUser.display_name || otherUser.username}
        defaultReceiverAvatar={otherUser.avatar_url || undefined}
      />
    </>
  );
};
