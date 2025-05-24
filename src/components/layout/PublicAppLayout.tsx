
import { Outlet } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Logo } from "./navbar/Logo";

/**
 * Public layout for unauthenticated pages like message access
 * Uses clean white background but allows theme colors for UI elements
 */
export default function PublicAppLayout() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header with theme colors allowed */}
      <header className="sticky top-0 z-30 w-full border-b shadow-sm md:py-3 py-2 bg-white">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div>
            <Logo />
          </div>
          <div className="text-sm text-muted-foreground">
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
