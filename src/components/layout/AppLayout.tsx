
import { Outlet } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import Navbar from "./Navbar";

interface AppLayoutProps {
  isLoggedIn?: boolean;
}

export default function AppLayout({ isLoggedIn = false }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar isLoggedIn={isLoggedIn} />
      <Toaster />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
