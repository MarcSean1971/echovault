
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
  const handleClick = async () => {
    try {
      const result = await tryDirectAccess();
      if (result.success && result.url) {
        console.log("Direct access successful, URL:", result.url);
        // Open the URL in a new tab for direct access
        window.open(result.url, '_blank');
      } else {
        console.error("Direct access failed, result:", result);
        toast({
          title: "Direct access failed",
          description: "Falling back to alternative access method. Please try the download button.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error in direct access:", error);
      toast({
        title: "Access error",
        description: "There was a problem accessing this file. Please try again or use download button.",
        variant: "destructive"
      });
    }
  };

  return (
    <AccessButton
      variant="outline"
      isLoading={isLoading}
      onClick={handleClick}
      icon={<Link className={`h-4 w-4 ${HOVER_TRANSITION} transform hover:scale-105`} />}
      tooltipText="Use direct URL"
      className="bg-amber-100 hover:bg-amber-200 transition-all duration-200"
    />
  );
};
