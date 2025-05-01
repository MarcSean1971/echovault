
import { Navigate, Outlet } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import Navbar from "./Navbar";

export default function ProtectedLayout() {
  // This will be replaced with actual authentication check once Supabase is implemented
  const isAuthenticated = false; // For development, we'll set this to false

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
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
