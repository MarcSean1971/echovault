
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield } from "lucide-react";

export const LoadingState = () => {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8" style={{ backgroundColor: '#FFFFFF' }}>
      <div className="bg-white" style={{ backgroundColor: '#FFFFFF' }}>
        <Card className="overflow-hidden border shadow-sm bg-white" style={{ backgroundColor: '#FFFFFF' }}>
          {/* Header - Force pure white */}
          <div className="bg-white p-6 border-b" style={{ backgroundColor: '#FFFFFF' }}>
            <Skeleton className="h-8 w-3/4 bg-gray-200" />
            <div className="flex items-center mt-2">
              <Skeleton className="h-4 w-32 bg-gray-200" />
            </div>
          </div>
          
          {/* Security Badge - Force white background */}
          <div className="bg-white px-6 py-2 border-b border-gray-200 flex items-center" style={{ backgroundColor: '#FFFFFF' }}>
            <Shield className="h-4 w-4 text-primary mr-2 animate-pulse" />
            <Skeleton className="h-4 w-24 bg-gray-200" />
          </div>
          
          {/* Content Loading - Force white */}
          <div className="p-6 space-y-4 bg-white" style={{ backgroundColor: '#FFFFFF' }}>
            <Skeleton className="h-4 w-full bg-gray-200" />
            <Skeleton className="h-4 w-11/12 bg-gray-200" />
            <Skeleton className="h-4 w-10/12 bg-gray-200" />
            <Skeleton className="h-24 w-full bg-gray-200" />
            
            {/* Attachment Loading */}
            <div className="mt-6 pt-6 border-t">
              <div className="flex items-center mb-4">
                <Skeleton className="h-5 w-28 mr-3 bg-gray-200" />
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between border rounded-md p-3 bg-white" style={{ backgroundColor: '#FFFFFF' }}>
                  <div className="flex items-center space-x-3">
                    <Skeleton className="h-10 w-10 rounded-md bg-gray-200" />
                    <div>
                      <Skeleton className="h-4 w-48 bg-gray-200" />
                      <Skeleton className="h-3 w-24 mt-2 bg-gray-200" />
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Skeleton className="h-8 w-8 rounded-md bg-gray-200" />
                    <Skeleton className="h-8 w-8 rounded-md bg-gray-200" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Footer - Force white */}
          <div className="bg-white px-6 py-4 border-t border-gray-200" style={{ backgroundColor: '#FFFFFF' }}>
            <div className="flex justify-between">
              <Skeleton className="h-4 w-48 bg-gray-200" />
              <Skeleton className="h-4 w-32 bg-gray-200" />
            </div>
          </div>
        </Card>
        
        <div className="flex justify-center mt-4">
          <p className="text-sm text-primary animate-pulse font-medium">Loading secure message...</p>
        </div>
      </div>
    </div>
  );
};
