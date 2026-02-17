import { motion } from "framer-motion";
import { CheckCircle2, Circle } from "lucide-react";

interface ProfileCompletionProps {
  avatar: boolean;
  banner: boolean;
  bio: boolean;
  wallet: boolean;
  username?: boolean;
}

export const ProfileCompletionIndicator = ({ avatar, banner, bio, wallet, username = false }: ProfileCompletionProps) => {
  const completionItems = [
    { name: "Avatar", completed: avatar },
    { name: "Banner", completed: banner },
    { name: "Bio", completed: bio },
    { name: "Wallet", completed: wallet },
    { name: "Username", completed: username },
  ];

  const completionPercentage = (completionItems.filter(item => item.completed).length / completionItems.length) * 100;

  return (
    <div className="w-full p-4 rounded-xl border border-border/20 bg-background/50 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground">
          Hoàn thiện hồ sơ
        </h3>
        <span 
          className="text-sm font-bold"
          style={{
            background: "linear-gradient(135deg, #00E7FF, #7A2BFF, #FF00E5, #FFD700)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          {Math.round(completionPercentage)}%
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 bg-muted rounded-full overflow-hidden mb-4">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${completionPercentage}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{
            background: "linear-gradient(90deg, #00E7FF, #7A2BFF, #FF00E5, #FFD700)",
          }}
        />
      </div>

      {/* Completion Items */}
      <div className="grid grid-cols-2 gap-2">
        {completionItems.map((item, index) => (
          <motion.div
            key={item.name}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center gap-2"
          >
            {item.completed ? (
              <CheckCircle2 className="w-4 h-4 text-green-500" />
            ) : (
              <Circle className="w-4 h-4 text-muted-foreground" />
            )}
            <span className={`text-xs ${item.completed ? "text-foreground" : "text-muted-foreground"}`}>
              {item.name}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
