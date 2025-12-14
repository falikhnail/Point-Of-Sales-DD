import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  bgColor?: string;
}

export function KPICard({ title, value, icon: Icon, trend, trendUp, bgColor = "bg-blue-50" }: KPICardProps) {
  // Ensure value is always a valid React node
  const displayValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
  
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <h3 className="text-2xl font-bold mt-2">{displayValue}</h3>
            {trend && (
              <p className={`text-sm mt-2 ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
                {trend}
              </p>
            )}
          </div>
          <div className={`${bgColor} p-3 rounded-lg`}>
            <Icon className="h-6 w-6 text-blue-600" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default KPICard;