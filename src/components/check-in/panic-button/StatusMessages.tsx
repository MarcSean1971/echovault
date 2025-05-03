
import { ReactNode } from "react";

interface StatusMessageProps {
  show: boolean;
  variant: "error" | "warning" | "success" | "info";
  children: ReactNode;
}

export function StatusMessage({ show, variant, children }: StatusMessageProps) {
  if (!show) return null;
  
  const variantClasses = {
    error: "text-red-500",
    warning: "text-amber-500",
    success: "text-green-600",
    info: "text-blue-500"
  };
  
  return (
    <p className={`${variantClasses[variant]} text-sm`}>
      {children}
    </p>
  );
}

interface StatusMessagesProps {
  isConfirming: boolean;
  locationPermission: string;
  hasPanicMessage: boolean;
  hasPanicMessages: boolean;
  isLoading: boolean;
  keepArmed: boolean;
}

export function StatusMessages({
  isConfirming,
  locationPermission,
  hasPanicMessage,
  hasPanicMessages,
  isLoading,
  keepArmed
}: StatusMessagesProps) {
  return (
    <>
      <StatusMessage show={isConfirming} variant="error">
        Click again to confirm emergency trigger
      </StatusMessage>

      <StatusMessage show={locationPermission === "denied"} variant="warning">
        Location access denied. Your current location won't be included in the emergency message.
      </StatusMessage>
      
      <StatusMessage show={!hasPanicMessage && !isLoading && !hasPanicMessages} variant="warning">
        No panic trigger messages configured. Create one to use this feature.
      </StatusMessage>
      
      <StatusMessage show={!hasPanicMessage && hasPanicMessages && !isLoading} variant="warning">
        You have panic messages, but they're not appearing here. Try checking your message settings.
      </StatusMessage>
      
      <StatusMessage show={hasPanicMessage && keepArmed} variant="success">
        This panic button will remain active after triggering.
      </StatusMessage>
    </>
  );
}
