import { Database, FileUp, FolderPlus } from "lucide-react";
import { Section } from "./Section";
import { QuickActionCard } from "./QuickActionCard";
import { AppLink } from "@/shared/ui";

export const QuickActions = () => {
  return (
    <Section title="Быстрые действия">
      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <li className="w-full list-none">
          <AppLink to="/import" className="w-full no-underline">
            <QuickActionCard
              title="Импорт оборудования"
              description="Загрузить данные из файла"
              icon={FileUp}
            />
          </AppLink>
        </li>
        <li className="w-full list-none">
          <AppLink to="/equipment" className="w-full no-underline">
            <QuickActionCard
              title="Каталог оборудования"
              description="Просмотр всего оборудования"
              icon={Database}
            />
          </AppLink>
        </li>
        <li className="w-full list-none">
          <AppLink to="/projects?create=true" className="w-full no-underline">
            <QuickActionCard
              title="Создать проект"
              description="Новый проект"
              icon={FolderPlus}
            />
          </AppLink>
        </li>
      </ul>
    </Section>
  );
};
