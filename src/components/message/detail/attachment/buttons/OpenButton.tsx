
import React from "react";
import { ExternalLink } from "lucide-react";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";
import { AccessButton } from "./AccessButton";

interface OpenButtonProps {
  isLoading: boolean;
  hasError: boolean;
  onClick: () => void;
}

export const OpenButton: React.FC<OpenButtonProps> = ({
  isLoading,
  hasError,
  onClick
}) => {
  return (
    <AccessButton
      variant="outline"
      isLoading={isLoading}
      onClick={onClick}
      disabled={hasError}
      icon={<ExternalLink className={`h-4 w-4 text-green-600 ${HOVER_TRANSITION} transform hover:scale-105`} />}
      tooltipText="Open file"
      className="hover:bg-green-50 hover:border-green-200"
    />
  );
};
