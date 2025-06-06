import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  change?: {
    value: string;
    trend: "up" | "down";
    period: string;
  };
  iconColor?: string;
}

export default function StatsCard({ 
  title, 
  value, 
  icon: Icon, 
  change, 
  iconColor = "text-primary" 
}: StatsCardProps) {
  return (
    <div className="stats-card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
        <div className={`w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center`}>
          <Icon className={`${iconColor} text-xl w-6 h-6`} />
        </div>
      </div>
      {change && (
        <div className="flex items-center mt-4 text-sm">
          <span className={`flex items-center ${
            change.trend === "up" ? "text-green-600" : "text-red-600"
          }`}>
            <span className="mr-1">
              {change.trend === "up" ? "↑" : "↓"}
            </span>
            {change.value}
          </span>
          <span className="text-gray-500 dark:text-gray-400 ml-2">{change.period}</span>
        </div>
      )}
    </div>
  );
}
