import React from "react";
import { Lock } from "lucide-react";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";
import { AccordionSection } from "@/components/message/detail/AccordionSection";
interface SecuritySettingsSectionProps {
  condition: any | null;
}
export function SecuritySettingsSection({
  condition
}: SecuritySettingsSectionProps) {
  if (!condition || !(condition.expiry_hours > 0 || condition.unlock_delay_hours > 0 || condition.pin_code)) {
    return null;
  }
  return <AccordionSection title={<div className="flex items-center">
          <Lock className={`h-4 w-4 mr-1.5 ${HOVER_TRANSITION}`} />
          Security Settings
        </div>} defaultOpen={false}>
      <div className="grid grid-cols-1 gap-1 text-sm">
        {condition.pin_code && <div className="grid grid-cols-3 gap-1">
            <span className="font-medium">PIN Code:</span>
            <span className="col-span-2 text-right">
              {condition.pin_code}
            </span>
          </div>}
        
        {condition.expiry_hours > 0 && <div className="grid grid-cols-3 gap-1">
            <span className="font-medium">Message Expiry:</span>
            <span className="col-span-2 text-right">
              {condition.expiry_hours} hours after delivery
            </span>
          </div>}
        
        {condition.unlock_delay_hours > 0 && <div className="grid grid-cols-3 gap-1">
            <span className="font-medium">Delay Settings:</span>
            <span className="col-span-2 text-right">
              {condition.unlock_delay_hours} hours after delivery
            </span>
          </div>}
      </div>
    </AccordionSection>;
}