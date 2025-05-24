
import { Outlet } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Logo } from "./navbar/Logo";

/**
 * Public layout for unauthenticated pages like message access
 * Now matches the landing page header styling exactly with pure white background
 */
export default function PublicAppLayout() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header with pure white background (#FFFFFF) and exact landing page logo color */}
      <header className="public-header sticky top-0 z-30 w-full border-b backdrop-blur-md supports-[backdrop-filter]:bg-background/60 shadow-sm md:py-3 py-2">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="public-logo">
            <Logo />
          </div>
          <div className="text-sm text-muted-foreground">
            Secure Message Access
          </div>
        </div>
      </header>
      
      <Toaster />
      <main className="flex-1 w-full">
        <Outlet />
      </main>
    </div>
  );
}
