
import { Navigate, Outlet } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import Navbar from "./Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { isAdminEmail } from "@/utils/adminUtils";

export default function ProtectedLayout() {
  const { isLoaded, isSignedIn, user } = useAuth();
  const [isChecking, setIsChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (isLoaded) {
      // Check if user is admin
      if (user?.email) {
        setIsAdmin(isAdminEmail(user.email));
      }
      
      // Give a small delay to ensure auth state is properly checked
      const timer = setTimeout(() => {
        setIsChecking(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isLoaded, user]);

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
      <Navbar isLoggedIn={true} isAdmin={isAdmin} />
      <Toaster />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}

