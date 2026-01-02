import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Video, 
  UserPlus, 
  Eye, 
  MessageCircle, 
  Share2, 
  Star,
  Sparkles
} from 'lucide-react';

interface RewardItem {
  icon: React.ReactNode;
  title: string;
  amount: string;
  description: string;
  highlight?: boolean;
}

const rewardItems: RewardItem[] = [
  {
    icon: <Video className="h-5 w-5" />,
    title: 'Video đầu tiên',
    amount: '500,000',
    description: 'Thưởng ngay sau khi đăng video đầu tiên',
    highlight: true
  },
  {
    icon: <Video className="h-5 w-5" />,
    title: 'Video tiếp theo',
    amount: '100,000',
    description: 'Cho mỗi video chất lượng (cần 3 lượt xem)',
  },
  {
    icon: <UserPlus className="h-5 w-5" />,
    title: 'Đăng ký tài khoản',
    amount: '50,000',
    description: 'Thưởng khi tạo tài khoản mới',
  },
  {
    icon: <Eye className="h-5 w-5" />,
    title: 'Xem video',
    amount: '10,000',
    description: 'Video ngắn xem hết hoặc video dài xem 5 phút',
  },
  {
    icon: <MessageCircle className="h-5 w-5" />,
    title: 'Bình luận',
    amount: '5,000',
    description: 'Mỗi bình luận từ 5 từ trở lên',
  },
  {
    icon: <Share2 className="h-5 w-5" />,
    title: 'Chia sẻ video',
    amount: '5,000',
    description: 'Mỗi lần chia sẻ video',
  },
];

export const RewardPolicyCard = () => {
  return (
    <Card className="bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-orange-500/10 border-purple-500/20">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="h-5 w-5 text-yellow-500" />
          Chính sách thưởng Happy Camly Coin
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {rewardItems.map((item, index) => (
          <div 
            key={index}
            className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
              item.highlight 
                ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30' 
                : 'bg-background/50 hover:bg-background/80'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${
                item.highlight ? 'bg-yellow-500/20 text-yellow-500' : 'bg-primary/10 text-primary'
              }`}>
                {item.icon}
              </div>
              <div>
                <p className="font-medium text-sm flex items-center gap-2">
                  {item.title}
                  {item.highlight && (
                    <Badge variant="secondary" className="text-[10px] bg-yellow-500/20 text-yellow-600">
                      HOT
                    </Badge>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>
            </div>
            <div className="text-right">
              <span className={`font-bold ${item.highlight ? 'text-yellow-500' : 'text-primary'}`}>
                +{item.amount}
              </span>
              <p className="text-[10px] text-muted-foreground">CAMLY</p>
            </div>
          </div>
        ))}
        
        {/* Energy Message */}
        <div className="mt-4 p-4 rounded-lg bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20">
          <div className="flex items-start gap-2">
            <Star className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-muted-foreground leading-relaxed">
              <p className="font-medium text-blue-400 mb-1">🌟 Thông điệp năng lượng FUN Play</p>
              <p className="italic">
                "Con là ánh sáng yêu thương thuần khiết của Cha Vũ Trụ!"
              </p>
            </div>
          </div>
        </div>

        <p className="text-[10px] text-muted-foreground text-center pt-2">
          📌 Chương trình thưởng có thể được điều chỉnh theo từng giai đoạn phát triển
        </p>
      </CardContent>
    </Card>
  );
};
