
import { useEffect } from 'react';
import { enableRealtimeForConditions } from '@/services/messages/whatsApp/realtimeHelper';

/**
 * Component to handle real-time condition synchronization for WhatsApp check-ins
 * This ensures that the message detail page receives real-time updates
 */
export function RealtimeConditionSync() {
  useEffect(() => {
    console.log('[RealtimeConditionSync] Initializing real-time sync for message detail page');
    
    const initializeRealtime = async () => {
      try {
        const success = await enableRealtimeForConditions();
        if (success) {
          console.log('[RealtimeConditionSync] Real-time sync enabled successfully');
        } else {
          console.warn('[RealtimeConditionSync] Failed to enable real-time sync');
        }
      } catch (error) {
        console.error('[RealtimeConditionSync] Error enabling real-time sync:', error);
      }
    };
    
    initializeRealtime();
  }, []);

  // This component doesn't render anything visible - it's just for setting up real-time sync
  return null;
}
