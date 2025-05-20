
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/use-toast";
import { useTriggerDashboard } from "@/hooks/useTriggerDashboard";
import { DashboardSummaryCards } from "@/components/message/dashboard/DashboardSummaryCards";
import { CheckInCard } from "@/components/check-in/CheckInCard";
import { PanicButtonCard } from "@/components/check-in/PanicButtonCard";
import { SystemStatusCard } from "@/components/check-in/SystemStatusCard";

export default function CheckIn() {
  const { userId } = useAuth();
  const [isChecking, setIsChecking] = useState(false);
  const [panicMode, setPanicMode] = useState(false);

  const {
    conditions,
    nextDeadline,
    lastCheckIn,
    isLoading,
    handleCheckIn
  } = useTriggerDashboard();

  // Find panic trigger messages
  const panicMessages = conditions.filter(c => 
    c.condition_type === 'panic_trigger' && c.active === true
  );
  
  // Get the first available panic message or null if none exist
  const panicMessage = panicMessages.length > 0 ? panicMessages[0] : null;

  const onCheckIn = async () => {
    setIsChecking(true);
    try {
      await handleCheckIn();
      toast({
        title: "Check-In Successful",
        description: "Your Trigger Switch has been reset."
      });
    } catch (error: any) {
      console.error("Check-in failed:", error);
      toast({
        title: "Check-In Failed",
        description: error.message || "Unable to complete check-in",
        variant: "destructive"
      });
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Trigger Switch Control</h1>
      </div>

      {/* Display summary cards from DashboardSummaryCards component */}
      <div className="mb-8">
        <DashboardSummaryCards 
          nextDeadline={nextDeadline} 
          lastCheckIn={lastCheckIn}
          conditions={conditions}
          onCheckIn={onCheckIn}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Check-In Card */}
        <CheckInCard 
          onCheckIn={onCheckIn} 
          isChecking={isChecking} 
          panicMode={panicMode} 
          isLoading={isLoading} 
        />

        {/* Panic Button Card - now with all panic messages */}
        <PanicButtonCard 
          userId={userId} 
          panicMessage={panicMessage}
          panicMessages={panicMessages}
          isChecking={isChecking} 
          isLoading={isLoading} 
        />
      </div>

      {/* Status Information */}
      <div className="mt-6">
        <SystemStatusCard 
          lastCheckIn={lastCheckIn} 
          nextDeadline={nextDeadline} 
          conditions={conditions} 
          isLoading={isLoading} 
        />
      </div>
    </div>
  );
}
