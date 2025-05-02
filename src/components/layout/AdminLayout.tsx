
import { Navigate, Outlet } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import Navbar from "./Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { isAdminEmail } from "@/utils/adminUtils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, ShieldAlert } from "lucide-react";

export default function AdminLayout() {
  const { isLoaded, isSignedIn, user } = useAuth();
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-primary font-medium">Loading...</div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isSignedIn) {
    return <Navigate to="/login" />;
  }
  
  // Check if user is admin
  const isAdmin = isAdminEmail(user?.email);
  
  // If not an admin, show unauthorized message
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar isLoggedIn={true} />
        <Toaster />
        <main className="flex-1 flex items-center justify-center p-4">
          <Alert variant="destructive" className="max-w-md">
            <ShieldAlert className="h-5 w-5" />
            <AlertTitle className="mb-2">Access Denied</AlertTitle>
            <AlertDescription>
              You are not authorized to access this area. This section is restricted to administrators only.
            </AlertDescription>
          </Alert>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar isLoggedIn={true} isAdmin={true} />
      <Toaster />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
