
import { supabaseClient } from "../supabase-client.ts";
import { sendCheckInEmailToCreator } from "./email-sender.ts";
import { reminderLogger } from "./reminder-logger.ts";

/**
 * DISABLED: This email-only processor is now disabled to prevent conflicts
 * The enhanced dual-channel processor in reminder-processor.ts handles all reminders
 */
export async function processIndividualReminder(
  reminder: any,
  debug: boolean = false
): Promise<{ success: boolean; error?: string }> {
  console.log(`[EMAIL-PROCESSOR-DISABLED] Email-only processor is disabled. Reminder ${reminder.id} should be handled by dual-channel processor.`);
  
  // Return success without processing to avoid conflicts
  return { 
    success: true, 
    error: "Skipped - handled by dual-channel processor" 
  };
}

/**
 * DISABLED: Redirect to enhanced processor
 */
export async function resetAndCreateReminders(): Promise<{ resetCount: number; createdCount: number }> {
  console.log("[EMAIL-PROCESSOR-DISABLED] resetAndCreateReminders is disabled - handled by dual-channel processor");
  return { resetCount: 0, createdCount: 0 };
}

/**
 * DISABLED: Redirect to enhanced processor  
 */
export async function processDueReminders(
  messageId?: string,
  forceSend: boolean = false,
  debug: boolean = false
): Promise<{ processedCount: number; successCount: number; failedCount: number; errors: string[] }> {
  console.log(`[EMAIL-PROCESSOR-DISABLED] processDueReminders is disabled - use enhanced dual-channel processor instead`);
  
  return {
    processedCount: 0,
    successCount: 0,
    failedCount: 0,
    errors: ["Email-only processor disabled - use dual-channel processor"]
  };
}
