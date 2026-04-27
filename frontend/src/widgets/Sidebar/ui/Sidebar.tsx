import { Button, cn } from "@heroui/react";
import {
  Home,
  Upload,
  FolderTree,
  Wrench,
  FolderKanban,
  ChevronLeft,
  ChevronRight,
  GitCompare,
} from "lucide-react";
import { MenuItem } from "./MenuItem";
import type { SidebarMenuItem } from "../model/types";
import { useLocalStorage } from "@/shared/lib/useLocalStorage";

const items: SidebarMenuItem[] = [
  { label: "Главная", icon: Home, path: "/" },
  { label: "Импорт", icon: Upload, path: "/import" },
  { label: "Оборудование", icon: Wrench, path: "/equipment" },
  { label: "Сравнение", icon: GitCompare, path: "/comparison" },
  { label: "Категории", icon: FolderTree, path: "/categories" },
  { label: "Проекты", icon: FolderKanban, path: "/projects" },
];

export const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useLocalStorage(
    "sidebar-collapsed",
    false,
  );

  return (
    <aside
      className={cn(
        "sticky top-0 flex flex-col max-w-75 w-full max-h-screen border-r border-default-200 bg-white/50 transition-all duration-400",
        isCollapsed && "max-w-16",
      )}
    >
      <div className="mb-20 px-4 pt-4">
        <Button
          size="sm"
          variant="outline"
          onPress={() => setIsCollapsed((prev) => !prev)}
          isIconOnly
        >
          {isCollapsed ? <ChevronRight /> : <ChevronLeft />}
        </Button>
      </div>
      <div className="flex flex-col justify-between mb-12 px-5 pt-4">
        <div
          className={cn(
            "max-w-full opacity-100 overflow-hidden whitespace-nowrap transition-all duration-400",
            isCollapsed && "max-w-0 opacity-0",
          )}
        >
          <p className="mb-1 text-[22px] font-semibold">
            Каталоги оборудования
          </p>
          <p className="text-lg">Система нормализации</p>
        </div>
      </div>

      <nav className="flex flex-col gap-1 px-2">
        {items.map((item) => (
          <MenuItem key={item.label} item={item} collapsed={isCollapsed} />
        ))}
      </nav>
    </aside>
  );
};
