
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, Outlet } from "react-router-dom";
import { useState, useEffect } from "react";

export default function AdminGuard() {
  const { isLoaded, user } = useAuth();
  const [isChecking, setIsChecking] = useState(true);

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
      <div className="flex items-center justify-center h-full min-h-[50vh]">
        <div className="animate-pulse text-primary font-medium">Loading...</div>
      </div>
    );
  }

  // Check if user is admin (marc.s@seelenbinderconsulting.com)
  const isAdmin = user?.email === "marc.s@seelenbinderconsulting.com";

  // Redirect to dashboard if not admin
  if (!isAdmin) {
    return <Navigate to="/dashboard" />;
  }

  return <Outlet />;
}
