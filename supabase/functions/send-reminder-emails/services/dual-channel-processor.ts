import { supabaseClient } from "../supabase-client.ts";
import { sendCheckInEmailToCreator } from "./email-sender.ts";
import { sendCheckInWhatsAppToCreator } from "./whatsapp-sender.ts";
import { reminderLogger } from "./reminder-logger.ts";

/**
 * FIXED: Dual-channel processor with proper final delivery verification
 */
export async function processDualChannelReminders(
  messageId?: string,
  debug: boolean = false,
  forceSend: boolean = false
): Promise<{ processedCount: number; successCount: number; failedCount: number; errors: string[] }> {
  try {
    const supabase = supabaseClient();
    
    console.log(`[DUAL-CHANNEL-PROCESSOR] FIXED processing for message: ${messageId || 'all'}`);
    
    // Clean up stuck reminders first
    await supabase
      .from('reminder_schedule')
      .update({ status: 'failed' })
      .eq('status', 'processing')
      .lt('scheduled_at', new Date(Date.now() - 10 * 60 * 1000).toISOString());
    
    // Build query for due reminders
    let query = supabase
      .from('reminder_schedule')
      .select(`
        id,
        message_id,
        condition_id,
        scheduled_at,
        reminder_type,
        delivery_priority,
        retry_count,
        messages (
          id,
          title,
          user_id,
          text_content,
          content,
          share_location,
          location_latitude,
          location_longitude,
          location_name,
          attachments
        ),
        message_conditions (
          id,
          condition_type,
          recipients,
          active,
          last_checked,
          hours_threshold,
          minutes_threshold
        )
      `)
      .eq('status', 'pending')
      .lte('scheduled_at', new Date().toISOString())
      .order('scheduled_at', { ascending: true });
    
    if (messageId) {
      query = query.eq('message_id', messageId);
    }
    
    const { data: dueReminders, error } = await query;
    
    if (error) {
      console.error("[DUAL-CHANNEL-PROCESSOR] Error fetching due reminders:", error);
      return { processedCount: 0, successCount: 0, failedCount: 1, errors: [error.message] };
    }
    
    console.log(`[DUAL-CHANNEL-PROCESSOR] Found ${dueReminders?.length || 0} due reminders`);
    
    if (!dueReminders || dueReminders.length === 0) {
      console.log("[DUAL-CHANNEL-PROCESSOR] No due reminders found");
      return { processedCount: 0, successCount: 0, failedCount: 0, errors: [] };
    }
    
    let processedCount = 0;
    let successCount = 0;
    let failedCount = 0;
    const errors: string[] = [];
    
    // Process each due reminder
    for (const reminder of dueReminders) {
      try {
        processedCount++;
        
        // Mark reminder as processing
        await supabase
          .from('reminder_schedule')
          .update({ 
            status: 'processing',
            last_attempt_at: new Date().toISOString(),
            retry_count: (reminder.retry_count || 0) + 1
          })
          .eq('id', reminder.id);
        
        const message = reminder.messages;
        const condition = reminder.message_conditions;
        
        if (!message || !condition) {
          console.error(`[DUAL-CHANNEL-PROCESSOR] Missing message or condition for reminder ${reminder.id}`);
          await supabase
            .from('reminder_schedule')
            .update({ status: 'failed' })
            .eq('id', reminder.id);
          failedCount++;
          continue;
        }
        
        console.log(`[DUAL-CHANNEL-PROCESSOR] Processing ${reminder.reminder_type} for message "${message.title}"`);
        
        if (reminder.reminder_type === 'final_delivery') {
          console.log(`[DUAL-CHANNEL-PROCESSOR] FINAL DELIVERY PROCESSING for message ${message.id}`);
          
          try {
            // CRITICAL FIX: Store initial delivery count before triggering
            const { count: initialDeliveryCount } = await supabase
              .from('delivered_messages')
              .select('*', { count: 'exact', head: true })
              .eq('message_id', message.id);
            
            console.log(`[DUAL-CHANNEL-PROCESSOR] Initial delivery count: ${initialDeliveryCount || 0}`);
            
            // STEP 1: Trigger message delivery to recipients
            console.log(`[DUAL-CHANNEL-PROCESSOR] Triggering recipient message delivery`);
            
            const deliveryResult = await supabase.functions.invoke('send-message-notifications', {
              body: {
                messageId: message.id,
                conditionId: condition.id,
                forceSend: true,
                isEmergency: false,
                debug: debug,
                source: 'final-delivery-processor',
                bypassDeduplication: true
              }
            });
            
            if (deliveryResult.error) {
              console.error(`[DUAL-CHANNEL-PROCESSOR] Delivery invocation failed:`, deliveryResult.error);
              throw new Error(`Message delivery invocation failed: ${deliveryResult.error.message}`);
            }
            
            console.log(`[DUAL-CHANNEL-PROCESSOR] Message delivery triggered successfully`);
            
            // STEP 2: CRITICAL FIX - Wait for and verify actual delivery
            console.log(`[DUAL-CHANNEL-PROCESSOR] Waiting for delivery verification...`);
            
            const deliveryVerified = await verifyRecipientDelivery(
              supabase, 
              message.id, 
              condition.recipients?.length || 0, 
              initialDeliveryCount || 0,
              debug
            );
            
            if (!deliveryVerified) {
              throw new Error('Recipients did not receive the message within timeout period');
            }
            
            // STEP 3: Only update reminder status AFTER delivery is verified
            await supabase
              .from('reminder_schedule')
              .update({ 
                status: 'completed',
                last_attempt_at: new Date().toISOString()
              })
              .eq('id', reminder.id);
            
            // STEP 4: Deactivate condition
            await supabase
              .from('message_conditions')
              .update({ 
                active: false,
                updated_at: new Date().toISOString()
              })
              .eq('id', condition.id);
            
            // STEP 5: Log success
            await reminderLogger.logDelivery(
              reminder.id,
              message.id,
              condition.id,
              'system',
              'final_delivery',
              1,
              'completed',
              {
                reminder_type: 'final_delivery',
                recipients_notified: true,
                condition_deactivated: true,
                processed_at: new Date().toISOString(),
                delivery_verified: true
              }
            );
            
            console.log(`[DUAL-CHANNEL-PROCESSOR] Final delivery completed and verified for message ${message.id}`);
            successCount++;
            
          } catch (finalDeliveryError) {
            console.error(`[DUAL-CHANNEL-PROCESSOR] Final delivery failed:`, finalDeliveryError);
            
            // CRITICAL: Keep reminder in processing state for retry if delivery failed
            const shouldRetry = (reminder.retry_count || 0) < 3;
            const newStatus = shouldRetry ? 'pending' : 'failed';
            
            await supabase
              .from('reminder_schedule')
              .update({ 
                status: newStatus,
                scheduled_at: shouldRetry ? new Date(Date.now() + 5 * 60 * 1000).toISOString() : reminder.scheduled_at
              })
              .eq('id', reminder.id);
            
            console.log(`[DUAL-CHANNEL-PROCESSOR] Reminder ${reminder.id} marked as ${newStatus} for ${shouldRetry ? 'retry' : 'permanent failure'}`);
            
            errors.push(`Final delivery failed for ${message.title}: ${finalDeliveryError.message}`);
            failedCount++;
          }
          
        } else {
          // Regular check-in reminder processing (unchanged)
          // ... keep existing code (check-in reminder processing logic)
          console.log(`[DUAL-CHANNEL-PROCESSOR] Processing check-in reminder for message ${message.id}`);
          
          // Get creator's profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('whatsapp_number, email, first_name, last_name')
            .eq('id', message.user_id)
            .single();
          
          if (!profile) {
            console.error(`[DUAL-CHANNEL-PROCESSOR] No profile found for user ${message.user_id}`);
            await supabase
              .from('reminder_schedule')
              .update({ status: 'failed' })
              .eq('id', reminder.id);
            failedCount++;
            continue;
          }
          
          // Calculate hours until deadline
          const now = new Date();
          const lastChecked = new Date(condition.last_checked);
          const hoursThreshold = condition.hours_threshold || 0;
          const minutesThreshold = condition.minutes_threshold || 0;
          
          const deadline = new Date(lastChecked);
          deadline.setHours(deadline.getHours() + hoursThreshold);
          deadline.setMinutes(deadline.getMinutes() + minutesThreshold);
          
          const hoursUntilDeadline = Math.max(0, (deadline.getTime() - now.getTime()) / (1000 * 60 * 60));
          
          // Send email reminder
          const emailResult = await sendCheckInEmailToCreator(
            profile.email,
            message.title,
            message.id,
            hoursUntilDeadline,
            profile.first_name || 'User'
          );
          
          let whatsappResult = { success: true };
          
          // Send WhatsApp reminder if available
          if (profile.whatsapp_number) {
            whatsappResult = await sendCheckInWhatsAppToCreator(
              profile.whatsapp_number,
              message.title,
              message.id,
              hoursUntilDeadline
            );
          }
          
          if (emailResult.success || whatsappResult.success) {
            await supabase
              .from('reminder_schedule')
              .update({ 
                status: 'completed',
                last_attempt_at: new Date().toISOString()
              })
              .eq('id', reminder.id);
            
            await reminderLogger.logDelivery(
              reminder.id,
              message.id,
              condition.id,
              profile.email,
              'check_in_reminder',
              1,
              'completed',
              {
                email_success: emailResult.success,
                whatsapp_success: whatsappResult.success,
                hours_until_deadline: hoursUntilDeadline
              }
            );
            
            successCount++;
          } else {
            throw new Error(`Both email and WhatsApp delivery failed`);
          }
        }
        
      } catch (error) {
        console.error(`[DUAL-CHANNEL-PROCESSOR] Error processing reminder ${reminder.id}:`, error);
        
        await supabase
          .from('reminder_schedule')
          .update({ status: 'failed' })
          .eq('id', reminder.id);
        
        errors.push(`Reminder ${reminder.id}: ${error.message}`);
        failedCount++;
      }
    }
    
    console.log(`[DUAL-CHANNEL-PROCESSOR] Processing complete: ${successCount} successful, ${failedCount} failed out of ${processedCount} total`);
    
    return {
      processedCount,
      successCount,
      failedCount,
      errors
    };
    
  } catch (error) {
    console.error("[DUAL-CHANNEL-PROCESSOR] Critical error:", error);
    return {
      processedCount: 0,
      successCount: 0,
      failedCount: 1,
      errors: [error.message]
    };
  }
}

/**
 * CRITICAL FIX: Verify that recipients actually received the message
 */
async function verifyRecipientDelivery(
  supabase: any,
  messageId: string,
  expectedRecipientCount: number,
  initialDeliveryCount: number,
  debug: boolean = false
): Promise<boolean> {
  const maxWaitTime = 30000; // 30 seconds timeout
  const checkInterval = 2000; // Check every 2 seconds
  const startTime = Date.now();
  
  console.log(`[DELIVERY-VERIFICATION] Starting verification for message ${messageId}`);
  console.log(`[DELIVERY-VERIFICATION] Expected recipients: ${expectedRecipientCount}, Initial deliveries: ${initialDeliveryCount}`);
  
  while (Date.now() - startTime < maxWaitTime) {
    try {
      // Check current delivery count
      const { count: currentDeliveryCount, error } = await supabase
        .from('delivered_messages')
        .select('*', { count: 'exact', head: true })
        .eq('message_id', messageId);
      
      if (error) {
        console.error(`[DELIVERY-VERIFICATION] Error checking deliveries:`, error);
        await new Promise(resolve => setTimeout(resolve, checkInterval));
        continue;
      }
      
      const newDeliveries = (currentDeliveryCount || 0) - initialDeliveryCount;
      
      if (debug) {
        console.log(`[DELIVERY-VERIFICATION] Current deliveries: ${currentDeliveryCount || 0}, New deliveries: ${newDeliveries}`);
      }
      
      // Success: We have new deliveries that match expected recipients
      if (newDeliveries >= expectedRecipientCount) {
        console.log(`[DELIVERY-VERIFICATION] SUCCESS: ${newDeliveries} recipients received the message`);
        return true;
      }
      
      // Wait before next check
      await new Promise(resolve => setTimeout(resolve, checkInterval));
      
    } catch (error) {
      console.error(`[DELIVERY-VERIFICATION] Error during verification:`, error);
      await new Promise(resolve => setTimeout(resolve, checkInterval));
    }
  }
  
  // Timeout reached
  console.error(`[DELIVERY-VERIFICATION] TIMEOUT: Recipients did not receive message ${messageId} within ${maxWaitTime}ms`);
  return false;
}

/**
 * Generate missing reminder schedules for armed conditions
 */
export async function generateMissingReminders(debug: boolean = false): Promise<number> {
  try {
    const supabase = supabaseClient();
    
    // Find armed conditions without pending reminders
    const { data: armedConditions } = await supabase
      .from('message_conditions')
      .select(`
        id,
        message_id,
        condition_type,
        last_checked,
        hours_threshold,
        minutes_threshold,
        reminder_hours
      `)
      .eq('active', true)
      .in('condition_type', ['no_check_in', 'recurring_check_in', 'inactivity_to_date']);
    
    if (!armedConditions) return 0;
    
    let generatedCount = 0;
    
    for (const condition of armedConditions) {
      // Check if this condition already has pending reminders
      const { data: existingReminders } = await supabase
        .from('reminder_schedule')
        .select('id')
        .eq('condition_id', condition.id)
        .eq('status', 'pending')
        .limit(1);
      
      if (existingReminders && existingReminders.length > 0) {
        continue; // Skip if reminders already exist
      }
      
      // Generate new reminder schedule
      if (debug) {
        console.log(`[DUAL-CHANNEL-PROCESSOR] Generating reminders for condition ${condition.id}`);
      }
      
      // Calculate deadline
      const lastChecked = new Date(condition.last_checked);
      const deadline = new Date(lastChecked);
      deadline.setHours(deadline.getHours() + (condition.hours_threshold || 0));
      deadline.setMinutes(deadline.getMinutes() + (condition.minutes_threshold || 0));
      
      // Generate reminder entries
      const reminderHours = condition.reminder_hours || [24 * 60]; // Default to 24 hours
      const reminderEntries = [];
      
      for (const minutes of reminderHours) {
        const scheduledAt = new Date(deadline.getTime() - (minutes * 60 * 1000));
        
        if (scheduledAt > new Date()) { // Only schedule future reminders
          reminderEntries.push({
            message_id: condition.message_id,
            condition_id: condition.id,
            scheduled_at: scheduledAt.toISOString(),
            reminder_type: 'reminder',
            status: 'pending',
            delivery_priority: minutes < 60 ? 'high' : 'normal'
          });
        }
      }
      
      // Add final delivery reminder
      if (deadline > new Date()) {
        reminderEntries.push({
          message_id: condition.message_id,
          condition_id: condition.id,
          scheduled_at: deadline.toISOString(),
          reminder_type: 'final_delivery',
          status: 'pending',
          delivery_priority: 'critical'
        });
      }
      
      if (reminderEntries.length > 0) {
        await supabase
          .from('reminder_schedule')
          .insert(reminderEntries);
        
        generatedCount += reminderEntries.length;
      }
    }
    
    if (debug) {
      console.log(`[DUAL-CHANNEL-PROCESSOR] Generated ${generatedCount} missing reminders`);
    }
    
    return generatedCount;
  } catch (error) {
    console.error("[DUAL-CHANNEL-PROCESSOR] Error generating missing reminders:", error);
    return 0;
  }
}
