
import React from "react";
import { Link } from "lucide-react";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";
import { AccessButton } from "./AccessButton";

interface DirectAccessButtonProps { 
  isLoading: boolean; 
  tryDirectAccess: () => void;
}

export const DirectAccessButton: React.FC<DirectAccessButtonProps> = ({ 
  isLoading, 
  tryDirectAccess 
}) => {
  return (
    <AccessButton
      variant="outline"
      isLoading={isLoading}
      onClick={tryDirectAccess}
      icon={<Link className={`h-4 w-4 ${HOVER_TRANSITION}`} />}
      tooltipText="Use direct URL"
      className="bg-amber-100 hover:bg-amber-200"
    />
  );
};
