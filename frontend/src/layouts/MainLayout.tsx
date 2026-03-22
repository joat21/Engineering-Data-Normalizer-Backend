import { Outlet } from "react-router";

export const MainLayout = () => {
  return (
    <div className="flex flex-col min-h-screen bg-linear-to-br from-blue-50 to-indigo-100">
      <main className="flex flex-1 justify-center mb-6 px-6">
        <div className="flex justify-center max-w-7xl w-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
