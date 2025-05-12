
import React from "react";
import { CalendarClock, Clock, AlertCircle, BellRing } from "lucide-react";

interface DeliveryIconProps {
  conditionType?: string;
  className?: string;
}

export function DeliveryIcon({ conditionType, className = "mr-2 h-5 w-5" }: DeliveryIconProps) {
  switch (conditionType) {
    case "no_check_in":
      return <Clock className={className} />;
    case "panic_trigger":
      return <AlertCircle className={className} />;
    case "inactivity_to_recurring":
      return <BellRing className={className} />;
    case "inactivity_to_date":
      return <CalendarClock className={className} />;
    default:
      return <Clock className={className} />;
  }
}
