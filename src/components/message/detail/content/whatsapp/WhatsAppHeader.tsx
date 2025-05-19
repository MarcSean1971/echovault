
import { Smartphone } from "lucide-react";
import { ICON_HOVER_EFFECTS } from "@/utils/hoverEffects";

interface WhatsAppHeaderProps {
  title?: string;
  description?: string;
}

export function WhatsAppHeader({
  title = "WhatsApp Integration",
  description = "Test the WhatsApp notification for this message"
}: WhatsAppHeaderProps) {
  return (
    <div className="mb-3">
      <div className="flex items-center">
        <Smartphone className={`h-4 w-4 mr-2 text-blue-600 ${ICON_HOVER_EFFECTS.default}`} />
        <h3 className="text-sm font-medium">{title}</h3>
      </div>
      {description && (
        <p className="text-xs text-gray-600 mt-1 ml-6">
          {description}
        </p>
      )}
    </div>
  );
}
