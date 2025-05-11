
import React from "react";
import { cn } from "@/lib/utils";

interface MessageFormSectionProps {
  title: string;
  description: string;
  children: React.ReactNode;
  className?: string;
}

export function MessageFormSection({ 
  title, 
  description, 
  children, 
  className 
}: MessageFormSectionProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <div>
        <h3 className="text-lg font-medium">{title}</h3>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </div>
      <div>{children}</div>
    </div>
  );
}
