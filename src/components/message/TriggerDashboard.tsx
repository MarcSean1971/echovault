
import { useTriggerDashboard } from "@/hooks/useTriggerDashboard";
import { DashboardSummaryCards } from "./dashboard/DashboardSummaryCards";
import { MessageTriggersTable } from "./dashboard/MessageTriggersTable";
import { fetchMessageConditions } from "@/services/messages/conditionService"; 

export function TriggerDashboard() {
  const {
    messages,
    conditions,
    setConditions,
    nextDeadline,
    lastCheckIn,
    isLoading,
    handleCheckIn,
    userId
  } = useTriggerDashboard();

  // Function to refresh conditions after actions
  const refreshConditions = async () => {
    if (!userId) return;
    try {
      const updatedConditions = await fetchMessageConditions(userId);
      setConditions(updatedConditions);
    } catch (error) {
      console.error("Failed to refresh conditions:", error);
    }
  };
  
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
