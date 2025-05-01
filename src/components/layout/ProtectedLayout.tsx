
import { Navigate, Outlet } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import Navbar from "./Navbar";
import { useAuth } from "@clerk/clerk-react";
import { useState, useEffect } from "react";

export default function ProtectedLayout() {
  const { isLoaded, isSignedIn } = useAuth();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (isLoaded) {
      setIsChecking(false);
    }
  }, [isLoaded]);

  // Show loading state while checking authentication
  if (isChecking || !isLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-primary font-medium">Loading...</div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isSignedIn) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar isLoggedIn={true} />
      <Toaster />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
