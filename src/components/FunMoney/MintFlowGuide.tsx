import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, BarChart3, Layers, ShieldCheck, Wallet } from 'lucide-react';

const STEPS = [
  {
    icon: Activity,
    title: 'Hành động',
    desc: 'Xem video, like, comment, upload trên nền tảng',
    color: 'from-cyan-500 to-cyan-400',
  },
  {
    icon: BarChart3,
    title: 'Tích lũy Light Score',
    desc: 'Hệ thống tự động tính điểm rolling 30 ngày',
    color: 'from-cyan-400 to-purple-500',
  },
  {
    icon: Layers,
    title: 'Phân bổ theo Epoch',
    desc: 'Cuối tháng, phân bổ FUN từ pool 5.000.000',
    color: 'from-purple-500 to-purple-400',
  },
  {
    icon: ShieldCheck,
    title: 'Ký duyệt',
    desc: 'Admin review & ký giao dịch Multisig 3-of-3',
    color: 'from-purple-400 to-pink-500',
  },
  {
    icon: Wallet,
    title: 'Nhận FUN về ví',
    desc: 'Claim FUN token (ERC-20) vào ví BSC của bạn',
    color: 'from-pink-500 to-pink-400',
  },
];

export function MintFlowGuide() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          Quy trình nhận FUN Money
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Desktop: horizontal */}
        <div className="hidden md:flex items-start justify-between gap-2">
          {STEPS.map((step, i) => (
            <div key={i} className="flex items-start flex-1">
              <div className="flex flex-col items-center text-center flex-1">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center text-white shadow-lg mb-2`}>
                  <step.icon className="w-5 h-5" />
                </div>
                <p className="text-sm font-semibold">{step.title}</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-[140px]">{step.desc}</p>
              </div>
              {i < STEPS.length - 1 && (
                <div className="flex items-center pt-5 px-1">
                  <div className="w-8 h-0.5 bg-gradient-to-r from-primary/40 to-primary/20" />
                  <div className="w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-l-[6px] border-l-primary/40" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Mobile: vertical */}
        <div className="md:hidden space-y-4">
          {STEPS.map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center text-white shadow-lg shrink-0`}>
                  <step.icon className="w-4 h-4" />
                </div>
                {i < STEPS.length - 1 && (
                  <div className="w-0.5 h-8 bg-gradient-to-b from-primary/30 to-transparent mt-1" />
                )}
              </div>
              <div className="pt-1">
                <p className="text-sm font-semibold">{step.title}</p>
                <p className="text-xs text-muted-foreground">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
