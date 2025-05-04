
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
    <div>
      <h3 className="font-medium flex items-center">
        <Smartphone className={`h-4 w-4 mr-2 ${ICON_HOVER_EFFECTS.default}`} />
        {title}
      </h3>
      <p className="text-sm text-gray-600">
        {description}
      </p>
    </div>
  );
}
