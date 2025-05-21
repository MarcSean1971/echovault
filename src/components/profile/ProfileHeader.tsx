
import React from "react";
import { useIsMobile } from "@/hooks/use-mobile";

export function ProfileHeader() {
  const isMobile = useIsMobile();
  
  return (
    <div className="mb-8 animate-fade-in">
      <div className={`flex ${isMobile ? 'flex-col gap-4' : 'flex-row items-center justify-between'} mb-2`}>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 text-transparent bg-clip-text">
            Your Profile
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your personal information and contact details
          </p>
        </div>
      </div>
    </div>
  );
}
