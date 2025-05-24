
import { Outlet } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Logo } from "./navbar/Logo";

/**
 * Public layout for unauthenticated pages like message access
 * NUCLEAR OPTION: Using inline styles to force white background
 */
export default function PublicAppLayout() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header with FORCED white background using inline styles */}
      <header 
        className="public-header sticky top-0 z-30 w-full border-b shadow-sm md:py-3 py-2"
        style={{
          backgroundColor: '#FFFFFF',
          background: '#FFFFFF',
          backgroundImage: 'none',
          backdropFilter: 'none',
          WebkitBackdropFilter: 'none'
        }}
      >
        <div 
          className="container mx-auto px-4 flex items-center justify-between"
          style={{
            backgroundColor: '#FFFFFF',
            background: '#FFFFFF'
          }}
        >
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
