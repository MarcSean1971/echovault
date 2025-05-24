
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield } from "lucide-react";

export const LoadingState = () => {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <Card className="overflow-hidden border shadow-sm">
        {/* Animated Header */}
        <div className="bg-gradient-to-r from-primary to-accent p-6">
          <Skeleton className="h-8 w-3/4 bg-white/20" />
          <div className="flex items-center mt-2">
            <Skeleton className="h-4 w-32 bg-white/20" />
          </div>
        </div>
        
        {/* Security Badge */}
        <div className="bg-secondary/30 px-6 py-2 border-b border-secondary flex items-center">
          <Shield className="h-4 w-4 text-primary mr-2 animate-pulse" />
          <Skeleton className="h-4 w-24 bg-secondary/50" />
        </div>
        
        {/* Content Loading */}
        <div className="p-6 space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-11/12" />
          <Skeleton className="h-4 w-10/12" />
          <Skeleton className="h-24 w-full" />
          
          {/* Attachment Loading */}
          <div className="mt-6 pt-6 border-t">
            <div className="flex items-center mb-4">
              <Skeleton className="h-5 w-28 mr-3" />
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between border rounded-md p-3">
                <div className="flex items-center space-x-3">
                  <Skeleton className="h-10 w-10 rounded-md" />
                  <div>
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-24 mt-2" />
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Skeleton className="h-8 w-8 rounded-md" />
                  <Skeleton className="h-8 w-8 rounded-md" />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="bg-secondary/30 px-6 py-4 border-t border-secondary">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      </Card>
      
      <div className="flex justify-center mt-4">
        <p className="text-sm text-primary animate-pulse font-medium">Loading secure message...</p>
      </div>
    </div>
  );
};
