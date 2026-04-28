import { QuickActions } from "./QuickActions";

export const HomePage = () => {
  return (
    <div className="flex flex-col gap-8 mx-auto px-4 w-full max-w-7xl">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-semibold">Панель управления</h1>
          <p>Добро пожаловать в систему управления оборудованием</p>
        </div>
      </div>

      <QuickActions />
    </div>
  );
};
