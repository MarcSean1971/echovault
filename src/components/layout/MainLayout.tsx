
import { Outlet } from "react-router-dom";

export const MainLayout = () => {
  return (
    <main className="min-h-screen">
      <Outlet />
    </main>
  );
};
