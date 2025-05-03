
import { useTriggerDashboard } from "@/hooks/useTriggerDashboard";
import { DashboardSummaryCards } from "./dashboard/DashboardSummaryCards";
import { MessageTriggersTable } from "./dashboard/MessageTriggersTable";

export function TriggerDashboard() {
  const {
    messages,
    conditions,
    nextDeadline,
    lastCheckIn,
    isLoading,
    handleCheckIn,
    userId,
    refreshConditions
  } = useTriggerDashboard();
  
  return (
    <div className="space-y-6">
      <DashboardSummaryCards
        nextDeadline={nextDeadline}
        lastCheckIn={lastCheckIn}
        conditions={conditions}
        onCheckIn={handleCheckIn}
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
