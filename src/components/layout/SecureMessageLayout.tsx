
import { Outlet } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function SecureMessageLayout() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <main className="flex-1 w-full">
          <Outlet />
        </main>
      </TooltipProvider>
    </div>
  );
}
