
import React, { ReactNode } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

interface SecureMessageLayoutProps {
  children: ReactNode;
}

export default function SecureMessageLayout({ children }: SecureMessageLayoutProps) {
  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background flex flex-col">
        <Toaster />
        <Sonner />
        <main className="flex-1 w-full">
          {children}
        </main>
      </div>
    </TooltipProvider>
  );
}
