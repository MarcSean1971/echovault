
import { useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCondition } from "@/types/message";
import { usePanicButton } from "@/hooks/usePanicButton";
import { EmergencyButton } from "./panic-button/EmergencyButton";
import { CreateMessageButton } from "./panic-button/CreateMessageButton";
import { StatusMessages } from "./panic-button/StatusMessages";
import { hasActivePanicMessages } from "@/services/messages/conditions/panicTriggerService";
import { PanicMessageSelector } from "./panic-button/PanicMessageSelector";

interface PanicButtonCardProps {
  userId: string | undefined;
  panicMessage: MessageCondition | null;
  panicMessages: MessageCondition[]; // New prop for all panic messages
  isChecking: boolean;
  isLoading: boolean;
}

export function PanicButtonCard({ userId, panicMessage, panicMessages, isChecking, isLoading }: PanicButtonCardProps) {
  // Use the panic button hook
  const {
    panicMode,
    isConfirming,
    triggerInProgress,
    countDown,
    locationPermission,
    handlePanicButtonClick,
    handlePanicMessageSelect,
    handleCreatePanicMessage,
    getKeepArmedValue,
    isSelectorOpen,
    setIsSelectorOpen,
    inCancelWindow
  } = usePanicButton(userId, panicMessage, panicMessages);
  
  // State for checking if user has any panic messages (even if not loaded in this component)
  const [hasPanicMessages, setHasPanicMessages] = useState(false);
  
  // Check if user has any panic messages on mount
  useEffect(() => {
    const checkPanicMessages = async () => {
      if (!userId) return;
      
      try {
        const hasMessages = await hasActivePanicMessages(userId);
        setHasPanicMessages(hasMessages);
      } catch (error) {
        console.error("Error checking panic messages:", error);
      }
    };
    
    if (panicMessages.length === 0 && !isLoading && userId) {
      checkPanicMessages();
    }
  }, [userId, panicMessages, isLoading]);

  // Debug info
  useEffect(() => {
    if (panicMessage) {
      console.log("Panic message loaded:", panicMessage);
      if (panicMessage.panic_trigger_config) {
        console.log("Panic config (panic_trigger_config):", panicMessage.panic_trigger_config);
      }
      if (panicMessage.panic_config) {
        console.log("Panic config (panic_config):", panicMessage.panic_config);
      }
    }
    
    if (panicMessages.length > 0) {
      console.log(`Found ${panicMessages.length} panic messages available`);
    }
  }, [panicMessage, panicMessages]);

  const hasMultipleMessages = panicMessages.length > 1;

  return (
    <Card className={panicMode ? "border-red-500" : ""}>
      <CardHeader>
        <CardTitle className="flex items-center text-red-500">
          <AlertCircle className="h-5 w-5 mr-2" />
          Emergency Panic Button
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p>
          Press this button in emergency situations to immediately trigger your 
          configured emergency messages with your current location.
          {hasMultipleMessages && (
            <span className="ml-1 text-sm text-blue-600">
              ({panicMessages.length} messages available)
            </span>
          )}
        </p>
        
        {panicMessages.length > 0 ? (
          <EmergencyButton 
            isPanicMode={panicMode}
            isConfirming={isConfirming}
            countDown={countDown}
            onClick={handlePanicButtonClick}
            disabled={isChecking || (panicMode && !inCancelWindow) || isLoading || (triggerInProgress && !inCancelWindow)}
            inCancelWindow={inCancelWindow}
          />
        ) : (
          <CreateMessageButton 
            onClick={handleCreatePanicMessage}
            disabled={isLoading}
          />
        )}
        
        <StatusMessages
          isConfirming={isConfirming}
          locationPermission={locationPermission}
          hasPanicMessage={panicMessages.length > 0}
          hasPanicMessages={hasPanicMessages}
          isLoading={isLoading}
          keepArmed={!!panicMessage && getKeepArmedValue()}
          inCancelWindow={inCancelWindow}
        />
        
        {/* Message selection dialog */}
        {hasMultipleMessages && (
          <PanicMessageSelector 
            messages={panicMessages}
            isOpen={isSelectorOpen}
            onClose={() => setIsSelectorOpen(false)}
            onSelect={handlePanicMessageSelect}
          />
        )}
      </CardContent>
    </Card>
  );
}
