
import { Outlet } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import Navbar from "./Navbar";
import { useEffect, useState } from "react";

interface AppLayoutProps {
  isLoggedIn?: boolean;
}

export default function AppLayout({ isLoggedIn = false }: AppLayoutProps) {
  const [mounted, setMounted] = useState(false);

  // Ensure hydration before rendering
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar isLoggedIn={isLoggedIn} />
      <Toaster />
      <main className="flex-1 w-full">
        <Outlet />
      </main>
    </div>
  );
}
