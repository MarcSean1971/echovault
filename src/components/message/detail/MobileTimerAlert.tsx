
import { MessageTimer } from "@/components/message/MessageTimer";
import { AlertCircle } from "lucide-react";

interface MobileTimerAlertProps {
  deadline: Date | null;
  isArmed: boolean;
}

export function MobileTimerAlert({ deadline, isArmed }: MobileTimerAlertProps) {
  if (!isArmed || !deadline) return null;
  
  return (
    <div className="col-span-full bg-destructive/5 border border-destructive p-3 rounded-lg">
      <p className="text-sm font-medium text-destructive mb-2 flex items-center">
        <AlertCircle className="h-4 w-4 mr-1" /> 
        Delivery countdown
      </p>
      <MessageTimer deadline={deadline} isArmed={isArmed} />
    </div>
  );
}
