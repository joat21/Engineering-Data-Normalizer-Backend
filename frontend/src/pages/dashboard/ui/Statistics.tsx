import { FolderOpen, FolderTree, Package } from "lucide-react";
import type { DashboardSummary } from "@engineering-data-normalizer/shared";
import { Section } from "./Section";
import { StatisticsCard } from "./StatisticsCard";

interface StatisticsProps {
  data: DashboardSummary | undefined;
}

export const Statistics = ({ data }: StatisticsProps) => {
  return (
    <Section title="Статистика">
      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <li className="w-full list-none">
          <StatisticsCard
            title="Всего позиций в каталоге"
            count={data?.totalEquipment ?? 0}
            icon={Package}
          />
        </li>
        <li className="w-full list-none">
          <StatisticsCard
            title="Активные проекты"
            count={data?.activeProjects ?? 0}
            icon={FolderOpen}
          />
        </li>
        <li className="w-full list-none">
          <StatisticsCard
            title="Категорий в справочнике"
            count={data?.totalCategories ?? 0}
            icon={FolderTree}
          />
        </li>
      </ul>
    </Section>
  );
};
