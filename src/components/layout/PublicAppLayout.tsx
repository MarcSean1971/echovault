
import { Outlet } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Logo } from "./navbar/Logo";

/**
 * Public layout for unauthenticated pages like message access
 * Uses email color scheme to match the final alert message email
 */
export default function PublicAppLayout() {
  return (
    <div className="min-h-screen bg-white flex flex-col email-theme">
      {/* Header with email purple background */}
      <header className="sticky top-0 z-30 w-full border-b shadow-sm md:py-3 py-2 email-header">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div>
            <Logo />
          </div>
          <div className="text-sm text-white/90">
            Secure Message Access
          </div>
        </div>
      </header>
      
      <Toaster />
      <main className="flex-1 w-full public-message-content">
        <Outlet />
      </main>
    </div>
  );
}
