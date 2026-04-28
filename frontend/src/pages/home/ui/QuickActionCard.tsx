import { Card } from "@heroui/react";
import type { LucideIcon } from "lucide-react";

interface QuickActionCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
}

export const QuickActionCard = ({
  title,
  description,
  icon: Icon,
}: QuickActionCardProps) => {
  return (
    <Card className="flex-row items-center gap-4 p-6 w-full min-h-28 border-2 border-default/50 group hover:border-accent hover:bg-accent/5 transition-all">
      <span className="p-3 rounded-xl bg-accent-soft">
        <Icon className="text-accent" />
      </span>
      <div className="flex flex-col gap-1">
        <h3 className="text-lg font-medium">{title}</h3>
        <p className="text-gray-500">{description}</p>
      </div>
    </Card>
  );
};
