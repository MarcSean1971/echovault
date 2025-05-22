
import { Outlet } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Logo } from "./navbar/Logo";

/**
 * Public layout for unauthenticated pages like message access
 * Does not include authenticated elements like header buttons or avatar
 */
export default function PublicAppLayout() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Simple header with just the logo */}
      <header className="sticky top-0 z-30 w-full border-b bg-purple-600 text-white md:py-3 py-2">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <Logo />
          <div className="text-sm text-purple-100">
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
