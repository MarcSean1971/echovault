
import { Outlet } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Logo } from "./navbar/Logo";

/**
 * Public layout for unauthenticated pages like message access
 * Uses the same white header styling as the main app
 */
export default function PublicAppLayout() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header with improved mobile spacing and layout */}
      <header className="sticky top-0 z-30 w-full border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 shadow-sm py-3 sm:py-2 md:py-3 md:h-auto">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="flex-shrink-0">
            <Logo isPublicView={true} />
          </div>
          <div className="text-xs sm:text-sm text-muted-foreground hidden xs:block sm:block">
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
