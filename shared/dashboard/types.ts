export interface DashboardSummary {
  totalEquipment: number;
  activeProjects: number;
  totalCategories: number;
  topCategories: {
    id: string;
    name: string;
    count: number;
  }[];
}
