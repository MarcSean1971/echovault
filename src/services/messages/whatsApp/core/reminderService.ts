
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { reminderMonitor } from "@/services/messages/monitoring/reminderMonitor";

/**
 * Enhanced reminder service with comprehensive error handling and retry logic
 */
export async function triggerManualReminder(
  messageId: string, 
  forceSend: boolean = true, 
  testMode: boolean = false
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`Triggering enhanced manual reminder for message ${messageId}`);
    console.log(`Force send: ${forceSend}, Test mode: ${testMode}`);
    
    // Show initial toast notification
    toast({
      title: "🚨 Critical Reminder Test",
      description: "Testing critical reminder system - this is a safety-critical test...",
      duration: 5000,
    });
    
    // STEP 1: Force process any stuck reminders for this specific message
    try {
      console.log("Step 1: Forcing message-specific reminder processing...");
      await reminderMonitor.forceProcessMessageReminders(messageId);
    } catch (forceError) {
      console.error("Error in force process step:", forceError);
    }
    
    // STEP 2: Try multiple reminder trigger methods with aggressive retry
    const triggerMethods = [
      // Method 1: Enhanced reminder emails function
      async () => {
        console.log("Method 1: Enhanced reminder emails function");
        return await supabase.functions.invoke("send-reminder-emails", {
          body: {
            messageId,
            debug: true,
            forceSend: true,
            testMode,
            source: "critical-manual-trigger",
            bypassDeduplication: true,
            action: "process"
          }
        });
      },
      
      // Method 2: Direct message notifications function
      async () => {
        console.log("Method 2: Direct message notifications function");
        return await supabase.functions.invoke("send-message-notifications", {
          body: {
            messageId, 
            debug: true,
            forceSend: true,
            testMode,
            source: "critical-backup-trigger",
            bypassDeduplication: true,
            emergencyMode: true
          }
        });
      },
      
      // Method 3: Force create new reminder schedule entry
      async () => {
        console.log("Method 3: Force create immediate reminder");
        
        // Get the condition for this message
        const { data: conditions } = await supabase
          .from('message_conditions')
          .select('*')
          .eq('message_id', messageId)
          .eq('active', true)
          .limit(1);
        
        if (conditions && conditions.length > 0) {
          const condition = conditions[0];
          
          // Create immediate reminder
          const { error: insertError } = await supabase
            .from('reminder_schedule')
            .insert({
              message_id: messageId,
              condition_id: condition.id,
              scheduled_at: new Date().toISOString(), // Immediate
              reminder_type: 'reminder',
              status: 'pending',
              delivery_priority: 'critical',
              retry_strategy: 'aggressive'
            });
          
          if (insertError) throw insertError;
          
          // Trigger processing immediately
          return await supabase.functions.invoke("send-reminder-emails", {
            body: {
              messageId,
              debug: true,
              forceSend: true,
              source: "force-created-reminder"
            }
          });
        }
        
        throw new Error("No active conditions found for message");
      }
    ];
    
    let lastError = null;
    let successfulMethod = null;
    
    // Try each method in sequence
    for (let i = 0; i < triggerMethods.length; i++) {
      try {
        console.log(`Attempting trigger method ${i + 1}/3...`);
        const result = await triggerMethods[i]();
        
        if (!result.error) {
          successfulMethod = i + 1;
          console.log(`Method ${i + 1} succeeded!`);
          break;
        } else {
          lastError = result.error;
          console.error(`Method ${i + 1} failed:`, result.error);
        }
      } catch (methodError: any) {
        lastError = methodError;
        console.error(`Method ${i + 1} threw exception:`, methodError);
      }
      
      // Brief delay between methods
      if (i < triggerMethods.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    if (successfulMethod) {
      // SUCCESS: At least one method worked
      toast({
        title: "✅ Critical Reminder Sent",
        description: `Reminder successfully triggered using method ${successfulMethod}. Check your email and WhatsApp!`,
        duration: 8000,
      });
      
      // Log success to delivery log
      try {
        await supabase.from('reminder_delivery_log').insert({
          reminder_id: `manual-success-${Date.now()}`,
          message_id: messageId,
          condition_id: null,
          recipient: 'system',
          delivery_channel: 'manual-trigger',
          delivery_status: 'sent',
          response_data: {
            successful_method: successfulMethod,
            timestamp: new Date().toISOString(),
            test_mode: testMode,
            source: 'enhanced_manual_trigger'
          }
        });
      } catch (logError) {
        console.warn("Failed to log success:", logError);
      }
      
      return { success: true };
    } else {
      // FAILURE: All methods failed
      console.error("All reminder trigger methods failed. Last error:", lastError);
      
      toast({
        title: "🚨 CRITICAL FAILURE",
        description: `All reminder methods failed! This is a safety issue - check system immediately!`,
        variant: "destructive",
        duration: 10000,
      });
      
      // Log failure
      try {
        await supabase.from('reminder_delivery_log').insert({
          reminder_id: `manual-failure-${Date.now()}`,
          message_id: messageId,
          condition_id: null,
          recipient: 'system',
          delivery_channel: 'manual-trigger',
          delivery_status: 'failed',
          error_message: lastError?.message || 'All methods failed',
          response_data: {
            failed_methods: triggerMethods.length,
            last_error: lastError?.message,
            timestamp: new Date().toISOString(),
            test_mode: testMode,
            source: 'enhanced_manual_trigger'
          }
        });
      } catch (logError) {
        console.warn("Failed to log failure:", logError);
      }
      
      return { 
        success: false, 
        error: lastError?.message || "All trigger methods failed - critical system issue!" 
      };
    }
    
  } catch (error: any) {
    console.error("Critical exception in triggerManualReminder:", error);
    
    toast({
      title: "🚨 SYSTEM ERROR",
      description: `Critical system error: ${error.message}`,
      variant: "destructive",
      duration: 10000,
    });
    
    return { 
      success: false, 
      error: error.message || "Critical system exception occurred" 
    };
  }
}

/**
 * Test the entire reminder pipeline for a message
 */
export async function testReminderPipeline(messageId: string): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`Testing complete reminder pipeline for message ${messageId}`);
    
    toast({
      title: "🧪 Testing Reminder Pipeline",
      description: "Running comprehensive reminder system test...",
      duration: 5000,
    });
    
    // Step 1: Check if message exists and has conditions
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .select(`
        *,
        message_conditions(*)
      `)
      .eq('id', messageId)
      .single();
    
    if (messageError || !message) {
      throw new Error(`Message not found: ${messageError?.message}`);
    }
    
    if (!message.message_conditions || message.message_conditions.length === 0) {
      throw new Error("No conditions found for this message");
    }
    
    // Step 2: Check reminder schedule
    const { data: reminders, error: reminderError } = await supabase
      .from('reminder_schedule')
      .select('*')
      .eq('message_id', messageId)
      .eq('status', 'pending');
    
    if (reminderError) {
      console.error("Error checking reminders:", reminderError);
    }
    
    console.log(`Found ${reminders?.length || 0} pending reminders for message`);
    
    // Step 3: Test email service connectivity
    try {
      await supabase.functions.invoke("send-test-email", {
        body: { test: true, debug: true }
      });
      console.log("Email service connectivity test passed");
    } catch (emailError) {
      console.warn("Email service test failed:", emailError);
    }
    
    // Step 4: Run the actual reminder trigger
    const triggerResult = await triggerManualReminder(messageId, true, true);
    
    if (triggerResult.success) {
      toast({
        title: "✅ Pipeline Test Successful",
        description: "Complete reminder pipeline test passed!",
        duration: 8000,
      });
      return { success: true };
    } else {
      throw new Error(triggerResult.error || "Pipeline test failed");
    }
    
  } catch (error: any) {
    console.error("Error in testReminderPipeline:", error);
    
    toast({
      title: "❌ Pipeline Test Failed",
      description: `Pipeline test failed: ${error.message}`,
      variant: "destructive",
      duration: 8000,
    });
    
    return { success: false, error: error.message };
  }
}
