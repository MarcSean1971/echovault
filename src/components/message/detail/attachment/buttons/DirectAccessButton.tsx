
import React from "react";
import { Link } from "lucide-react";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";
import { AccessButton } from "./AccessButton";
import { AccessMethod } from "@/components/message/detail/attachment/types";

interface DirectAccessButtonProps { 
  isLoading: boolean; 
  tryDirectAccess: () => Promise<{ success: boolean; url: string | null; method: AccessMethod | null }>;
}

export const DirectAccessButton: React.FC<DirectAccessButtonProps> = ({ 
  isLoading, 
  tryDirectAccess 
}) => {
  const handleClick = async () => {
    const result = await tryDirectAccess();
    if (result.success && result.url) {
      console.log("Direct access successful, URL:", result.url);
    } else {
      console.error("Direct access failed");
    }
  };

  return (
    <AccessButton
      variant="outline"
      isLoading={isLoading}
      onClick={handleClick}
      icon={<Link className={`h-4 w-4 ${HOVER_TRANSITION}`} />}
      tooltipText="Use direct URL"
      className="bg-amber-100 hover:bg-amber-200"
    />
  );
};
