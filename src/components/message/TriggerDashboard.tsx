
import { useTriggerDashboard } from "@/hooks/useTriggerDashboard";
import { DashboardSummaryCards } from "./dashboard/DashboardSummaryCards";
import { MessageTriggersTable } from "./dashboard/MessageTriggersTable";
import { useEffect, useState } from "react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Wifi, WifiOff, RefreshCw } from "lucide-react";
import { checkSupabaseConnectivity } from "@/lib/supabaseClient";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";

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
  
  const [networkStatus, setNetworkStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  const [lastNetworkCheck, setLastNetworkCheck] = useState<Date | null>(null);
  
  // Create a wrapper function that ignores the boolean result
  const handleCheckInWrapper = async () => {
    if (networkStatus === 'offline') {
      // Check network before attempting check-in
      await checkNetwork();
      if (networkStatus === 'offline') return;
    }
    
    await handleCheckIn();
    // Don't return anything (void)
  };
  
  // Add network status check
  const checkNetwork = async () => {
    setNetworkStatus('checking');
    
    // First check browser's online status
    const isOnline = navigator.onLine;
    if (!isOnline) {
      setNetworkStatus('offline');
      return;
    }
    
    // Then verify actual connectivity to Supabase
    try {
      const isConnected = await checkSupabaseConnectivity();
      setNetworkStatus(isConnected ? 'online' : 'offline');
    } catch (error) {
      console.error("Error checking connectivity:", error);
      setNetworkStatus('offline');
    }
    
    setLastNetworkCheck(new Date());
  };
  
  // Check network status on mount and when online/offline events fire
  useEffect(() => {
    // Initial check
    checkNetwork();
    
    // Set up event listeners for online/offline events
    const handleOnline = () => {
      console.log("Browser reports online status");
      checkNetwork();
    };
    
    const handleOffline = () => {
      console.log("Browser reports offline status");
      setNetworkStatus('offline');
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Set up periodic check every 30 seconds when offline
    let intervalId: number | null = null;
    if (networkStatus === 'offline') {
      intervalId = window.setInterval(checkNetwork, 30000);
    }
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (intervalId !== null) clearInterval(intervalId);
    };
  }, [networkStatus]);
  
  // Render network status alert if offline
  const renderNetworkAlert = () => {
    if (networkStatus === 'offline') {
      return (
        <Alert variant="destructive" className="mb-4">
          <WifiOff className="h-4 w-4" />
          <AlertTitle>Connection Issue</AlertTitle>
          <AlertDescription>
            <p className="mb-2">Unable to connect to the server. Your network connection may be offline.</p>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={checkNetwork}
              className={`${HOVER_TRANSITION} flex items-center gap-2`}
            >
              <RefreshCw className="h-4 w-4 mr-1" /> Check Connection
            </Button>
          </AlertDescription>
        </Alert>
      );
    } else if (networkStatus === 'online') {
      // Success message that fades after a few seconds
      return (
        <div className="mb-4">
          <div className="flex items-center text-sm text-green-600 gap-1.5">
            <Wifi className="h-4 w-4" />
            <span>Connected</span>
          </div>
        </div>
      );
    }
    
    return null;
  };
  
  return (
    <div className="space-y-6">
      {renderNetworkAlert()}
      
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
