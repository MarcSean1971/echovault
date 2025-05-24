
import { Outlet } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Logo } from "./navbar/Logo";

/**
 * Public layout for unauthenticated pages like message access
 * Uses the same white header styling as the main app
 */
export default function PublicAppLayout() {
  return (
    <div className="min-h-screen bg-white flex flex-col email-theme">
      {/* Header with white background matching main app */}
      <header className="sticky top-0 z-30 w-full border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 shadow-sm md:py-3 py-2 md:h-auto">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div>
            <Logo isPublicView={true} />
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
