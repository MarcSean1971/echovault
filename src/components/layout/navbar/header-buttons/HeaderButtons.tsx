
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

  // Find panic message from conditions - look for both condition_type and trigger_type
  const panicMessage = conditions.find(c => 
    (c.condition_type === 'panic_trigger' || c.trigger_type === 'panic_trigger' || c.trigger_type === 'panic_button') && 
    c.active === true
  ) || null;

  // Find check-in related conditions - only count active conditions
  const hasCheckInConditions = conditions.some(c => 
    ((c.condition_type === 'no_check_in' || c.trigger_type === 'no_check_in') || 
    (c.condition_type === 'regular_check_in')) && 
    c.active === true
  );

  // Use the custom hooks
  const { handleCheckIn } = useHeaderCheckIn(handleDashboardCheckIn, isChecking);
  const { isUrgent, isVeryUrgent } = useDeadlineMeter(nextDeadline);
  const { 
    panicMode, 
    isConfirming, 
    countDown, 
    triggerInProgress,
    handlePanicButtonClick 
  } = usePanicButton(userId, panicMessage);
  
  // Force refresh conditions when component mounts and when lastRefresh changes
  useEffect(() => {
    if (userId) {
      console.log("HeaderButtons refreshing conditions");
      refreshConditions();
    }
  }, [userId, refreshConditions]);
  
  // Determine button styles based on screen size
  const buttonSizeClass = isMobile ? "text-xs" : "";
  const buttonPaddingClass = isMobile ? "px-2 py-1" : "px-6 py-2";
  const iconSizeClass = isMobile ? "h-4 w-4" : "h-5 w-5";
  
  // Container class to always be visible on both mobile and desktop
  const containerClass = isMobile 
    ? "flex justify-center space-x-2 mt-0" 
    : "flex justify-center space-x-4";

  return (
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
      
      {/* Emergency Panic Button - only shown when active panic message exists */}
      {panicMessage && (
        <PanicButton
          onClick={handlePanicButtonClick}
          isDisabled={isChecking || panicMode || triggerInProgress}
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
  );
}
