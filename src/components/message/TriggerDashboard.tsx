
import { useTriggerDashboard } from "@/hooks/useTriggerDashboard";
import { DashboardSummaryCards } from "./dashboard/DashboardSummaryCards";
import { MessageTriggersTable } from "./dashboard/MessageTriggersTable";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";

export function TriggerDashboard() {
  const {
    messages,
    conditions,
    nextDeadline,
    lastCheckIn,
    isLoading,
    loadError,
    handleCheckIn,
    userId,
    refreshConditions
  } = useTriggerDashboard();
  
  // Create a wrapper function that ignores the boolean result
  const handleCheckInWrapper = async () => {
    await handleCheckIn();
    // Don't return anything (void)
  };
  
  // Show error state with retry option
  if (loadError) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertCircle className={`h-4 w-4 ${HOVER_TRANSITION}`} />
          <AlertTitle>Error loading trigger system data</AlertTitle>
          <AlertDescription>{loadError}</AlertDescription>
          <Button 
            className={`mt-4 ${HOVER_TRANSITION}`} 
            onClick={() => refreshConditions()}
            variant="outline"
          >
            Retry
          </Button>
        </Alert>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <DashboardSummaryCards
        nextDeadline={nextDeadline}
        lastCheckIn={lastCheckIn}
        conditions={conditions}
        onCheckIn={handleCheckInWrapper}
      />
      
      <MessageTriggersTable
        conditions={conditions}
        messages={messages}
        isLoading={isLoading}
        userId={userId}
        onRefreshConditions={refreshConditions}
      />
    </div>
  );
}
