
import React from "react";
import { Link } from "lucide-react";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";
import { AccessButton } from "./AccessButton";
import { AccessMethod } from "@/components/message/detail/attachment/types";
import { toast } from "@/components/ui/use-toast";

interface DirectAccessButtonProps { 
  isLoading: boolean; 
  tryDirectAccess: () => Promise<{ success: boolean; url: string | null; method: AccessMethod | null }>;
}

export const DirectAccessButton: React.FC<DirectAccessButtonProps> = ({ 
  isLoading, 
  tryDirectAccess 
}) => {
  const [accessAttempted, setAccessAttempted] = React.useState(false);
  const [hasError, setHasError] = React.useState(false);

  const handleClick = async () => {
    try {
      setAccessAttempted(true);
      setHasError(false);
      
      const result = await tryDirectAccess();
      
      if (result.success && result.url) {
        console.log("Direct access successful, URL:", result.url);
        // Open the URL in a new tab for direct access
        window.open(result.url, '_blank');
        
        // Reset the states after a delay
        setTimeout(() => {
          setAccessAttempted(false);
          setHasError(false);
        }, 3000);
      } else {
        console.error("Direct access failed, result:", result);
        setHasError(true);
        
        // Show more helpful error message
        toast({
          title: "File access issue",
          description: "Could not directly access this file. This might be due to the file path format. Try using the download button instead.",
          variant: "destructive"
        });
        
        // Reset the access attempted state after a delay
        setTimeout(() => {
          setAccessAttempted(false);
        }, 5000);
      }
    } catch (error) {
      console.error("Error in direct access:", error);
      setHasError(true);
      
      toast({
        title: "Access error",
        description: "There was a problem accessing this file. Please try the download button instead.",
        variant: "destructive"
      });
      
      // Reset the access attempted state after a delay
      setTimeout(() => {
        setAccessAttempted(false);
      }, 5000);
    }
  };

  return (
    <AccessButton
      variant="outline"
      isLoading={isLoading}
      onClick={handleClick}
      icon={<Link className={`h-4 w-4 ${HOVER_TRANSITION} transform hover:scale-105 ${hasError ? 'text-red-500' : (accessAttempted ? 'text-amber-500' : '')}`} />}
      tooltipText="Use direct URL"
      className={`${hasError ? 'bg-red-50 hover:bg-red-100' : (accessAttempted ? 'bg-amber-50 hover:bg-amber-100' : 'bg-amber-100 hover:bg-amber-200')} transition-all duration-200`}
    />
  );
};
