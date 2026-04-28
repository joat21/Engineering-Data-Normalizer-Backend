import { Statistics } from "./Statistics";
import { QuickActions } from "./QuickActions";
import { useStatistics } from "../api/dashboard.api";
import { PageLoader } from "@/shared/ui";

export const DashboardPage = () => {
  const { data: statistics, isLoading } = useStatistics();

  if (isLoading) return <PageLoader />;

  return (
    <div className="flex flex-col gap-8 mx-auto px-4 w-full max-w-7xl">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-semibold">Панель управления</h1>
          <p>Добро пожаловать в систему управления оборудованием</p>
        </div>
      </div>

      <QuickActions />
      <Statistics data={statistics} />
    </div>
  );
};
