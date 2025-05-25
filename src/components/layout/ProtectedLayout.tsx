
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import Navbar from "./Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";

export default function ProtectedLayout() {
  const { isLoaded, isSignedIn, isProfileComplete } = useAuth();
  const [isChecking, setIsChecking] = useState(true);
  const location = useLocation();

  useEffect(() => {
    if (isLoaded) {
      // Give a small delay to ensure auth state is properly checked
      const timer = setTimeout(() => {
        setIsChecking(false);
      }, 500);
      return () => clearTimeout(timer);
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

  // Redirect to profile if profile is incomplete and not already on profile page
  if (!isProfileComplete && location.pathname !== '/profile') {
    return <Navigate to="/profile" replace />;
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
