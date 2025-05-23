
import { supabaseClient } from "../supabase-client.ts";
import { sendCreatorReminder } from "./reminder-sender.ts";
import { formatTimeUntilDeadline } from "./whatsapp-service.ts";

interface TestOptions {
  debug?: boolean;
  forceSend?: boolean;
  testMode?: boolean;
  source?: string;
  userId?: string | null;
}

/**
 * Test reminder delivery for a message by sending a test reminder
 */
export async function testReminderDelivery(messageId: string, options: TestOptions = {}) {
  const { debug = true, forceSend = true, source = "test", userId = null } = options;
  
  try {
    if (debug) {
      console.log(`[REMINDER-TESTER] Testing reminder delivery for message ${messageId}, options:`, options);
    }
    
    // Get the message and condition details
    const supabase = supabaseClient();
    
    // Get message details
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .select('id, title, user_id')
      .eq('id', messageId)
      .single();
    
    if (messageError) {
      console.error(`[REMINDER-TESTER] Error fetching message:`, messageError);
      return {
        success: false,
        error: `Error fetching message: ${messageError.message}`,
        results: []
      };
    }
    
    if (!message) {
      return {
        success: false,
        error: `Message not found: ${messageId}`,
        results: []
      };
    }
    
    // Get condition details
    const { data: condition, error: conditionError } = await supabase
      .from('message_conditions')
      .select('*')
      .eq('message_id', messageId)
      .single();
    
    if (conditionError) {
      console.error(`[REMINDER-TESTER] Error fetching condition:`, conditionError);
      return {
        success: false,
        error: `Error fetching condition: ${conditionError.message}`,
        results: []
      };
    }
    
    if (!condition) {
      return {
        success: false,
        error: `No condition found for message: ${messageId}`,
        results: []
      };
    }
    
    // CRITICAL FIX: Use the provided userId when available, otherwise use the message creator
    const targetUserId = userId || message.user_id;
    
    if (debug) {
      console.log(`[REMINDER-TESTER] Using user_id for reminder: ${targetUserId} (source: ${userId ? 'parameter' : 'message creator'})`);
    }
    
    // Generate a fake deadline 1 hour from now for testing purposes
    const testDeadline = new Date();
    testDeadline.setHours(testDeadline.getHours() + 1);
    
    // Set up time for a test reminder
    const hoursUntilDeadline = 1; // 1 hour for testing
    
    if (debug) {
      console.log(`[REMINDER-TESTER] Sending test reminder for user ${targetUserId} with title "${message.title}"`);
    }
    
    // Record the test attempt in the delivery log
    try {
      await supabase.from('reminder_delivery_log').insert({
        reminder_id: `test-${Date.now()}`,
        message_id: messageId,
        condition_id: condition.id,
        recipient: targetUserId,
        delivery_channel: 'test',
        delivery_status: 'processing',
        response_data: { 
          source,
          test_time: new Date().toISOString(),
          message_title: message.title,
          user_id: targetUserId
        }
      });
    } catch (logError) {
      console.warn(`[REMINDER-TESTER] Error logging test:`, logError);
      // Non-fatal, continue
    }
    
    // Send the actual test reminder
    const reminderResults = await sendCreatorReminder(
      messageId,
      condition.id,
      message.title,
      targetUserId,
      hoursUntilDeadline,
      testDeadline.toISOString(),
      debug
    );
    
    // Record the delivery results
    for (const result of reminderResults) {
      try {
        await supabase.from('reminder_delivery_log').insert({
          reminder_id: `test-result-${Date.now()}`,
          message_id: messageId,
          condition_id: condition.id,
          recipient: result.recipient,
          delivery_channel: result.channel,
          delivery_status: result.success ? 'delivered' : 'failed',
          response_data: { 
            source,
            test_time: new Date().toISOString(),
            message_title: message.title,
            user_id: targetUserId,
            error: result.error
          }
        });
      } catch (logError) {
        console.warn(`[REMINDER-TESTER] Error logging result:`, logError);
        // Non-fatal, continue
      }
    }
    
    if (debug) {
      console.log(`[REMINDER-TESTER] Test reminder results:`, reminderResults);
    }
    
    // Check if any reminders were sent successfully
    const anySuccess = reminderResults.some(result => result.success);
    
    // Return the results
    return {
      success: anySuccess,
      results: reminderResults,
      error: anySuccess ? undefined : "Failed to send test reminder to any channel"
    };
  } catch (error: any) {
    console.error(`[REMINDER-TESTER] Error in testReminderDelivery:`, error);
    
    return {
      success: false,
      error: error.message || "Unknown error testing reminder delivery",
      results: []
    };
  }
}

/**
 * Get the creator's user ID from a message
 */
async function getMessageCreatorId(messageId: string): Promise<string | null> {
  try {
    const supabase = supabaseClient();
    
    const { data, error } = await supabase
      .from('messages')
      .select('user_id')
      .eq('id', messageId)
      .single();
    
    if (error) {
      console.error(`[REMINDER-TESTER] Error fetching creator ID:`, error);
      return null;
    }
    
    return data?.user_id || null;
  } catch (error) {
    console.error(`[REMINDER-TESTER] Error in getMessageCreatorId:`, error);
    return null;
  }
}
