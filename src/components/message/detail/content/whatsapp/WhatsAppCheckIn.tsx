
import { Clock } from "lucide-react";
import { ICON_HOVER_EFFECTS } from "@/utils/hoverEffects";

interface WhatsAppCheckInProps {
  checkInCode: string | null;
}

export function WhatsAppCheckIn({ checkInCode }: WhatsAppCheckInProps) {
  return (
    <div className="mt-3 border-t border-blue-100 pt-2">
      <div className="flex items-center">
        <Clock className={`h-4 w-4 mr-2 ${ICON_HOVER_EFFECTS.default}`} />
        <h4 className="text-sm font-medium">WhatsApp Check-In</h4>
      </div>
      <p className="text-xs text-gray-600 mt-1">
        You can check in via WhatsApp by sending 
        {checkInCode ? (
          <> "<span className="font-medium">{checkInCode}</span>", </>
        ) : null}
        "CHECKIN" or "CODE" to the WhatsApp number.
      </p>
    </div>
  );
}
