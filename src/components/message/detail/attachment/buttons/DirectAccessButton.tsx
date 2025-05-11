
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

  const handleClick = async () => {
    try {
      setAccessAttempted(true);
      const result = await tryDirectAccess();
      
      if (result.success && result.url) {
        console.log("Direct access successful, URL:", result.url);
        // Open the URL in a new tab for direct access
        window.open(result.url, '_blank');
        setTimeout(() => {
          setAccessAttempted(false);
        }, 3000);
      } else {
        console.error("Direct access failed, result:", result);
        toast({
          title: "Direct access failed",
          description: "Falling back to alternative access method. Please try the download button.",
          variant: "destructive"
        });
        
        // Reset the access attempted state after a delay
        setTimeout(() => {
          setAccessAttempted(false);
        }, 3000);
      }
    } catch (error) {
      console.error("Error in direct access:", error);
      toast({
        title: "Access error",
        description: "There was a problem accessing this file. Please try again or use download button.",
        variant: "destructive"
      });
      
      // Reset the access attempted state after a delay
      setTimeout(() => {
        setAccessAttempted(false);
      }, 3000);
    }
  };

  return (
    <AccessButton
      variant="outline"
      isLoading={isLoading}
      onClick={handleClick}
      icon={<Link className={`h-4 w-4 ${HOVER_TRANSITION} transform hover:scale-105 ${accessAttempted ? 'text-red-500' : ''}`} />}
      tooltipText="Use direct URL"
      className={`${accessAttempted ? 'bg-red-50 hover:bg-red-100' : 'bg-amber-100 hover:bg-amber-200'} transition-all duration-200`}
    />
  );
};
