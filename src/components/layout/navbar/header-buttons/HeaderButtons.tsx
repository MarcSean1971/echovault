
import { useState, useEffect } from "react";
import { MessageCondition } from "@/types/message";
import { useIsMobile } from "@/hooks/use-mobile";
import { MessagesButton } from "./MessagesButton";
import { CheckInButton } from "./CheckInButton";
import { PanicButton } from "./PanicButton";
import { useTriggerDashboard } from "@/hooks/useTriggerDashboard";
import { useHeaderCheckIn } from "@/hooks/useHeaderCheckIn";
import { usePanicButton } from "@/hooks/usePanicButton";
import { useDeadlineMeter } from "@/hooks/useDeadlineMeter";
import { PanicMessageSelector } from "@/components/check-in/panic-button/PanicMessageSelector";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";

interface HeaderButtonsProps {
  conditions: MessageCondition[];
  userId: string | null;
}

export function HeaderButtons({ conditions, userId }: HeaderButtonsProps) {
  const isMobile = useIsMobile();
  
  // Get dashboard functionality
  const { 
    handleCheckIn: handleDashboardCheckIn, 
    isLoading: isChecking, 
    nextDeadline, 
    refreshConditions 
  } = useTriggerDashboard();

  console.log("HeaderButtons rendering with conditions:", conditions?.length || 0);
  console.log("HeaderButtons userId:", userId);
  
  // Find all panic messages from conditions - now including all panic messages
  // IMPORTANT: Changed to include all panic messages regardless of active state
  const panicMessages = conditions.filter(c => 
    c.condition_type === 'panic_trigger'
  );
  
  console.log("HeaderButtons found panicMessages:", panicMessages?.length || 0);

  // Get the first panic message as fallback for compatibility
  const panicMessage = panicMessages.length > 0 ? panicMessages[0] : null;

  // Find check-in related conditions - only count active conditions
  const hasCheckInConditions = conditions.some(c => 
    (c.condition_type === 'no_check_in' || c.condition_type === 'regular_check_in') && 
    c.active === true
  );
  
  console.log("HeaderButtons hasCheckInConditions:", hasCheckInConditions);

  // Use the custom hooks
  const { handleCheckIn } = useHeaderCheckIn(handleDashboardCheckIn, isChecking);
  const { isUrgent, isVeryUrgent } = useDeadlineMeter(nextDeadline);
  const { 
    panicMode, 
    isConfirming, 
    countDown, 
    triggerInProgress,
    handlePanicButtonClick,
    inCancelWindow,
    isSelectorOpen,
    setIsSelectorOpen,
    selectedMessageId,
    setSelectedMessageId,
    handlePanicMessageSelect,
    executePanicTrigger
  } = usePanicButton(userId, panicMessage, panicMessages);
  
  // Force refresh conditions when component mounts and when lastRefresh changes
  useEffect(() => {
    if (userId) {
      console.log("HeaderButtons refreshing conditions");
      refreshConditions();
    }
  }, [userId, refreshConditions]);
  
  // Create a wrapper function to handle direct trigger with messageId
  const handlePanicMessageDirectTrigger = () => {
    if (selectedMessageId) {
      console.log(`HeaderButtons: Directly triggering panic message: ${selectedMessageId}`);
      handlePanicMessageSelect(selectedMessageId);
      
      // Create a custom event to directly trigger the panic
      const event = new CustomEvent('panic-trigger-execute', { 
        detail: { messageId: selectedMessageId } 
      });
      window.dispatchEvent(event);
    }
  };
  
  // Determine button styles based on screen size
  const buttonSizeClass = isMobile ? "text-xs" : "";
  const buttonPaddingClass = isMobile ? "px-2 py-1" : "px-6 py-2";
  const iconSizeClass = isMobile ? "h-4 w-4" : "h-5 w-5";
  
  // Container class to always be visible on both mobile and desktop
  const containerClass = isMobile 
    ? "flex justify-center space-x-2 mt-0" 
    : "flex justify-center space-x-4";

  return (
    <>
      <div className={containerClass}>
        {/* Messages button - always visible */}
        <MessagesButton
          buttonPaddingClass={buttonPaddingClass}
          buttonSizeClass={buttonSizeClass}
          iconSizeClass={iconSizeClass}
          isMobile={isMobile}
        />
        
        {/* Check In Now button - only show when active check-in conditions exist */}
        {hasCheckInConditions && (
          <CheckInButton
            onClick={handleCheckIn}
            isDisabled={isChecking || panicMode}
            isMobile={isMobile}
            buttonPaddingClass={buttonPaddingClass}
            buttonSizeClass={buttonSizeClass}
            iconSizeClass={iconSizeClass}
          />
        )}
        
        {/* Emergency Panic Button - show when ANY panic messages exist */}
        {panicMessages.length > 0 && (
          <PanicButton
            onClick={handlePanicButtonClick}
            isDisabled={isChecking || (panicMode && !inCancelWindow) || (triggerInProgress && !inCancelWindow)}
            isMobile={isMobile}
            buttonPaddingClass={buttonPaddingClass}
            buttonSizeClass={buttonSizeClass}
            iconSizeClass={iconSizeClass}
            panicMode={panicMode}
            countDown={countDown}
            isConfirming={isConfirming}
          />
        )}
      </div>

      {/* Panic Message Selector - shown when there are multiple panic messages */}
      {panicMessages.length > 1 && (
        <PanicMessageSelector
          messages={panicMessages}
          isOpen={isSelectorOpen}
          onClose={() => setIsSelectorOpen(false)}
          onSelect={(messageId) => {
            setSelectedMessageId(messageId);
            handlePanicMessageDirectTrigger();
          }}
        />
      )}
    </>
  );
}
