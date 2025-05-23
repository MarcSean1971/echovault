
import { supabaseClient } from "./supabase-client.ts";
import { processReminder } from "./reminder-service.ts";

/**
 * Test reminder delivery for a specific message
 * Useful for manual testing of the reminder system
 * 
 * @param messageId Message ID to test reminder delivery for
 * @param options Testing options
 * @returns Test results
 */
export async function testReminderDelivery(
  messageId: string,
  options: {
    debug?: boolean;
    forceSend?: boolean;
    testMode?: boolean;
    source?: string;
    userId?: string | null;
  } = {}
): Promise<{ success: boolean; results: any[] }> {
  const { debug = false, forceSend = true, testMode = true, source = "api-test", userId = null } = options;
  const supabase = supabaseClient();
  
  try {
    if (debug) {
      console.log(`[TEST] Testing reminder delivery for message ${messageId}`);
      console.log(`[TEST] Options: ${JSON.stringify({ debug, forceSend, testMode, source, userId })}`);
    }
    
    // Get message and condition data
    const { data: messageData, error: messageError } = await supabase
      .from('messages')
      .select('*')
      .eq('id', messageId)
      .single();
    
    if (messageError) {
      console.error("[TEST] Error fetching message:", messageError);
      return { success: false, results: [{ error: "Message not found" }] };
    }
    
    // Get the condition for this message
    const { data: conditionData, error: conditionError } = await supabase
      .from('message_conditions')
      .select('*')
      .eq('message_id', messageId)
      .single();
    
    if (conditionError) {
      console.error("[TEST] Error fetching condition:", conditionError);
      return { success: false, results: [{ error: "Condition not found" }] };
    }
    
    // For a test delivery, we'll create a temporary reminder record
    const testReminderId = `test-${Date.now()}`;
    
    // Create a test reminder in the database for tracking
    const { data: reminderData, error: reminderError } = await supabase
      .from('reminder_schedule')
      .insert({
        message_id: messageId,
        condition_id: conditionData.id,
        scheduled_at: new Date().toISOString(),
        status: 'processing',
        reminder_type: 'test_delivery',
        delivery_priority: 'high'
      })
      .select()
      .single();
    
    if (reminderError) {
      console.error("[TEST] Error creating test reminder:", reminderError);
      return { success: false, results: [{ error: "Failed to create test reminder" }] };
    }
    
    // Process the reminder with force send enabled
    const result = await processReminder(reminderData, true);
    
    if (debug) {
      console.log(`[TEST] Test delivery result:`, result);
    }
    
    // Important: If not using a database record for the test, we still need to track this
    // for both the creator and message owner
    try {
      if (userId) {
        // Log a manual test delivery attempt for this specific user
        await supabase
          .from('reminder_delivery_log')
          .insert({
            reminder_id: `manual-test-${testReminderId}`,
            message_id: messageId,
            condition_id: conditionData.id,
            recipient: userId,
            delivery_channel: 'test',
            delivery_status: result.success ? 'delivered' : 'failed',
            response_data: {
              source,
              test_mode: testMode,
              results: result.results || []
            }
          });
      }
    } catch (logError) {
      console.warn("[TEST] Error logging test delivery:", logError);
      // Non-blocking error
    }
    
    return {
      success: result.success,
      results: result.results || []
    };
  } catch (error: any) {
    console.error("[TEST] Error in testReminderDelivery:", error);
    return {
      success: false,
      results: [{ error: error.message || "Unknown error in test delivery" }]
    };
  }
}
