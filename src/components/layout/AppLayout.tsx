
import { Outlet, useNavigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import Navbar from "./Navbar";
import { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";

interface AppLayoutProps {
  isLoggedIn?: boolean;
}

export default function AppLayout({ isLoggedIn = false }: AppLayoutProps) {
  const [mounted, setMounted] = useState(false);
  const { isLoaded, isSignedIn } = useAuth();
  const navigate = useNavigate();

  // Ensure hydration before rendering
  useEffect(() => {
    setMounted(true);
  }, []);

  // Use the auth check from Clerk if available
  const authStatus = isLoaded ? isSignedIn : isLoggedIn;

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar isLoggedIn={authStatus} />
      <Toaster />
      <main className="flex-1 w-full">
        <Outlet />
      </main>
    </div>
  );
}
