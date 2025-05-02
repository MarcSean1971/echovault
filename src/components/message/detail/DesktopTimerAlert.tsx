
import { MessageTimer } from "@/components/message/MessageTimer";

interface DesktopTimerAlertProps {
  deadline: Date | null;
  isArmed: boolean;
}

export function DesktopTimerAlert({ deadline, isArmed }: DesktopTimerAlertProps) {
  if (!isArmed || !deadline) return null;
  
  return (
    <div className="bg-destructive/5 border border-destructive/20 rounded-md p-3">
      <p className="text-sm font-medium text-destructive mb-2">Delivery countdown</p>
      <MessageTimer deadline={deadline} isArmed={isArmed} />
    </div>
  );
}
