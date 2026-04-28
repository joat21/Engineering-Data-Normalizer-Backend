import { Card } from "@heroui/react";
import type { LucideIcon } from "lucide-react";
import { formatNumber } from "@/shared/lib";

interface StatisticsCardProps {
  title: string;
  count: number;
  icon: LucideIcon;
}

export const StatisticsCard = ({
  title,
  count,
  icon: Icon,
}: StatisticsCardProps) => {
  return (
    <Card className="gap-3 p-6 w-full min-h-28 border-2 border-default/50">
      <div className="flex justify-between items-center">
        <h3 className="text-lg">{title}</h3>
        <span className="p-2 rounded-xl bg-accent-soft">
          <Icon className="text-accent" />
        </span>
      </div>
      <span className="text-2xl font-bold">{formatNumber(count)}</span>
    </Card>
  );
};
