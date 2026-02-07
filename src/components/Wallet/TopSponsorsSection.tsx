import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Crown, Heart, ExternalLink } from "lucide-react";
import { useTopSponsors } from "@/hooks/useTopSponsors";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

export const TopSponsorsSection = () => {
  const { sponsors, loading } = useTopSponsors();
  const navigate = useNavigate();

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return "from-yellow-400 via-yellow-500 to-amber-500 shadow-yellow-500/30";
      case 2:
        return "from-gray-300 via-gray-400 to-gray-500 shadow-gray-400/30";
      case 3:
        return "from-amber-600 via-amber-700 to-orange-700 shadow-amber-600/30";
      default:
        return "from-gray-200 to-gray-300 shadow-none";
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank <= 3) return <Crown className="h-4 w-4" />;
    return <span className="text-sm font-bold">#{rank}</span>;
  };

  return (
    <Card className="bg-white/90 backdrop-blur-xl border border-white/20 shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-pink-500" />
          Top Mạnh Thường Quân
        </CardTitle>
        <CardDescription>
          Những người donate nhiều nhất trên FUN PLAY
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-24 mb-1" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-6 w-20" />
              </div>
            ))}
          </div>
        ) : sponsors.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Heart className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Chưa có dữ liệu sponsor</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sponsors.slice(0, 10).map((sponsor, index) => (
              <motion.div
                key={sponsor.userId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => navigate(`/user/${sponsor.userId}`)}
                className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 cursor-pointer transition-all group"
              >
                {/* Rank Badge */}
                <div 
                  className={`h-8 w-8 rounded-full flex items-center justify-center text-white bg-gradient-to-br shadow-lg ${getRankStyle(index + 1)}`}
                >
                  {getRankIcon(index + 1)}
                </div>
                
                {/* Avatar */}
                <Avatar className="h-10 w-10 ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all">
                  <AvatarImage src={sponsor.avatarUrl || ""} />
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {sponsor.displayName?.[0] || sponsor.username?.[0] || "?"}
                  </AvatarFallback>
                </Avatar>
                
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate group-hover:text-primary transition-colors">
                    {sponsor.displayName || sponsor.username}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    @{sponsor.username}
                  </p>
                </div>
                
                {/* Amount */}
                <div className="text-right">
                  <Badge 
                    variant="outline" 
                    className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/30 text-yellow-600"
                  >
                    {sponsor.totalDonated?.toLocaleString() || 0} CAMLY
                  </Badge>
                </div>
                
                {/* Link indicator */}
                <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
