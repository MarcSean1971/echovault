
import { useState, useEffect } from "react";
import { MessageCondition } from "@/types/message";
import { useIsMobile } from "@/hooks/use-mobile";
import { MessagesButton } from "./MessagesButton";
import { CheckInButton } from "./CheckInButton";
import { PanicButton } from "./PanicButton";
import { useHeaderCheckIn } from "@/hooks/useHeaderCheckIn";
import { usePanicButtonHeader } from "@/hooks/usePanicButtonHeader";
import { PanicMessageSelector } from "@/components/check-in/panic-button/PanicMessageSelector";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";

interface HeaderButtonsProps {
  conditions: MessageCondition[];
  userId: string | null;
  // New props for optimized rendering
  showCheckInButton?: boolean;
  showPanicButton?: boolean;
}

export function HeaderButtons({ 
  conditions, 
  userId, 
  showCheckInButton = false, 
  showPanicButton = false 
}: HeaderButtonsProps) {
  const isMobile = useIsMobile();
  
  // Simplified check-in functionality
  const { handleCheckIn, isChecking } = useHeaderCheckIn();
  
  // Use our lightweight panic button hook
  const { 
    panicMode, 
    isConfirming, 
    countDown, 
    triggerInProgress,
    handlePanicButtonClick,
    isSelectorOpen,
    setIsSelectorOpen,
    selectedMessageId,
    setSelectedMessageId,
    handlePanicMessageSelect,
    inCancelWindow
  } = usePanicButtonHeader(userId);
  
  // Filter the panic messages for the selector
  const panicMessages = conditions.filter(c => c.condition_type === 'panic_trigger' && c.active === true);
  const hasPanicMessages = panicMessages.length > 0;
  const hasMultipleMessages = panicMessages.length > 1;
  
  // When panic button is clicked and there are multiple messages, show selector
  useEffect(() => {
    if (isConfirming && hasMultipleMessages) {
      setIsSelectorOpen(true);
    }
  }, [isConfirming, hasMultipleMessages, setIsSelectorOpen]);
  
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
        {showCheckInButton && (
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
        {showPanicButton && (
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
      {hasMultipleMessages && isSelectorOpen && (
        <PanicMessageSelector
          messages={panicMessages}
          isOpen={isSelectorOpen}
          onClose={() => setIsSelectorOpen(false)}
          onSelect={handlePanicMessageSelect}
        />
      )}
    </>
  );
}
