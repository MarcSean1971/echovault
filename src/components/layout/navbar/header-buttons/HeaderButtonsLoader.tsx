
import { useState, useEffect } from "react";
import { useHeaderButtonsData } from "@/hooks/useHeaderButtonsData";
import { HeaderButtons } from "./HeaderButtons";
import { Skeleton } from "@/components/ui/skeleton";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";

export function HeaderButtonsLoader() {
  const { hasCheckInConditions, hasPanicMessages, isLoading, userId } = useHeaderButtonsData();
  // We'll use simplified conditions for rendering the buttons
  const [showHeaderButtons, setShowHeaderButtons] = useState(false);
  
  useEffect(() => {
    // Only show the full component when we have valid data and userId
    if (!isLoading && userId) {
      setShowHeaderButtons(true);
    }
  }, [isLoading, userId]);

  // While loading, show skeleton buttons
  if (!showHeaderButtons) {
    return (
      <div className="flex space-x-2 sm:space-x-4">
        <Skeleton className={`h-9 md:h-10 w-24 md:w-28 rounded-md ${HOVER_TRANSITION} bg-gray-200/70`} />
        {hasCheckInConditions && (
          <Skeleton className={`h-9 md:h-10 w-24 md:w-32 rounded-md ${HOVER_TRANSITION} bg-gray-200/70`} />
        )}
        {hasPanicMessages && (
          <Skeleton className={`h-9 md:h-10 w-24 md:w-32 rounded-md ${HOVER_TRANSITION} bg-gray-200/70`} />
        )}
      </div>
    );
  }

  // Pass minimal flag conditions to the actual buttons component
  // This way, HeaderButtons doesn't need to do expensive data loading
  return (
    <HeaderButtons
      conditions={[]}  // Empty array - we're not actually using the full conditions
      userId={userId}
      showCheckInButton={hasCheckInConditions}
      showPanicButton={hasPanicMessages}
    />
  );
}
