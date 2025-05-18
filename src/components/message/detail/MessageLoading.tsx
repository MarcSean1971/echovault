
import React from "react";

interface MessageLoadingProps {
  message?: string;
}

export function MessageLoading({ message = "Loading..." }: MessageLoadingProps) {
  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-center">
          <div className="h-8 w-48 bg-muted rounded-md mx-auto mb-4"></div>
          <div className="h-4 w-32 bg-muted rounded-md mx-auto"></div>
          <div className="mt-4 text-muted-foreground">{message}</div>
        </div>
      </div>
    </div>
  );
}
