
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

/**
 * Emergency recovery service to fix stuck notifications and trigger overdue deliveries
 */
export class EmergencyRecoveryService {
  /**
   * Fix all stuck reminders and trigger overdue deliveries immediately
   */
  static async fixStuckNotifications(): Promise<{ success: boolean; details?: any; error?: string }> {
    try {
      console.log("[EMERGENCY-RECOVERY] Starting emergency fix for stuck notifications");
      
      // Call the fix-stuck action on the reminder emails function
      const { data, error } = await supabase.functions.invoke("send-reminder-emails", {
        body: {
          action: "fix-stuck",
          debug: true,
          forceSend: true,
          source: "emergency-recovery"
        }
      });
      
      if (error) {
        console.error("[EMERGENCY-RECOVERY] Error calling fix-stuck:", error);
        throw error;
      }
      
      console.log("[EMERGENCY-RECOVERY] Fix result:", data);
      
      // Show user feedback
      if (data?.resetCount > 0 || data?.triggeredCount > 0) {
        toast({
          title: "System Recovery Complete",
          description: `Fixed ${data.resetCount || 0} stuck reminders and triggered ${data.triggeredCount || 0} overdue deliveries`,
          duration: 8000,
        });
      } else {
        toast({
          title: "System Check Complete",
          description: "No stuck reminders found - system is operating normally",
          duration: 5000,
        });
      }
      
      // Trigger UI refresh
      window.dispatchEvent(new CustomEvent('conditions-updated', { 
        detail: { 
          action: 'emergency-recovery',
          source: 'emergency-fix',
          timestamp: new Date().toISOString()
        }
      }));
      
      return { 
        success: true, 
        details: {
          resetCount: data?.resetCount || 0,
          triggeredCount: data?.triggeredCount || 0
        }
      };
      
    } catch (error: any) {
      console.error("[EMERGENCY-RECOVERY] Emergency fix failed:", error);
      
      toast({
        title: "Emergency Recovery Failed",
        description: error.message || "Failed to fix stuck notifications",
        variant: "destructive",
        duration: 8000,
      });
      
      return { 
        success: false, 
        error: error.message || "Emergency recovery failed" 
      };
    }
  }
  
  /**
   * Force trigger a specific message delivery immediately
   */
  static async forceDeliverMessage(messageId: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`[EMERGENCY-RECOVERY] Force delivering message ${messageId}`);
      
      const { data, error } = await supabase.functions.invoke("send-message-notifications", {
        body: {
          messageId: messageId,
          debug: true,
          forceSend: true,
          isEmergency: true,
          source: "emergency-force-delivery"
        }
      });
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Emergency Delivery Triggered",
        description: `Message ${messageId} has been force delivered`,
        duration: 5000,
      });
      
      return { success: true };
      
    } catch (error: any) {
      console.error(`[EMERGENCY-RECOVERY] Failed to force deliver message ${messageId}:`, error);
      
      toast({
        title: "Force Delivery Failed",
        description: error.message || "Failed to force deliver message",
        variant: "destructive",
        duration: 8000,
      });
      
      return { success: false, error: error.message };
    }
  }
}
