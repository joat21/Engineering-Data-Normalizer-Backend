import { Outlet } from "react-router";
import { Sidebar } from "@/widgets/Sidebar";

export const MainLayout = () => {
  return (
    <div className="flex h-screen w-full bg-linear-to-br from-blue-50 to-indigo-100">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0 h-full">
        <div className="flex-1 p-6 h-full overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
