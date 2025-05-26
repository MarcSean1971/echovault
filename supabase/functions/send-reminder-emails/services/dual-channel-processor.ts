
import { supabaseClient } from "../supabase-client.ts";
import { sendCheckInEmailToCreator } from "./email-sender.ts";
import { sendCheckInWhatsAppToCreator } from "./whatsapp-sender.ts";
import { reminderLogger } from "./reminder-logger.ts";

/**
 * ENHANCED: Dual-channel processor with FIXED final delivery handling
 * Now properly triggers recipient message delivery when final deadline is reached
 */
export async function processDualChannelReminders(
  messageId?: string,
  debug: boolean = false,
  forceSend: boolean = false
): Promise<{ processedCount: number; successCount: number; failedCount: number; errors: string[] }> {
  try {
    const supabase = supabaseClient();
    
    console.log(`[DUAL-CHANNEL-PROCESSOR] Starting FIXED reminder processing for message: ${messageId || 'all'}`);
    
    // Clean up stuck reminders first
    console.log("[DUAL-CHANNEL-PROCESSOR] Cleaning up stuck reminders...");
    await supabase
      .from('reminder_schedule')
      .update({ status: 'failed' })
      .eq('status', 'processing')
      .lt('scheduled_at', new Date(Date.now() - 10 * 60 * 1000).toISOString()); // 10 minutes ago
    
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
      // Check for missing reminders for armed conditions
      console.log("[DUAL-CHANNEL-PROCESSOR] Checking for missing reminders...");
      
      let armedQuery = supabase
        .from('message_conditions')
        .select(`
          id,
          message_id,
          condition_type,
          last_checked,
          hours_threshold,
          minutes_threshold,
          active,
          messages (
            id,
            title,
            user_id
          )
        `)
        .eq('active', true)
        .in('condition_type', ['no_check_in', 'recurring_check_in', 'inactivity_to_date']);
      
      if (messageId) {
        armedQuery = armedQuery.eq('message_id', messageId);
      }
      
      const { data: armedConditions } = await armedQuery;
      
      console.log(`[DUAL-CHANNEL-PROCESSOR] Found ${armedConditions?.length || 0} armed conditions`);
      
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
        
        // CRITICAL FIX: Handle final delivery reminders differently
        if (reminder.reminder_type === 'final_delivery') {
          console.log(`[DUAL-CHANNEL-PROCESSOR] FINAL DELIVERY PROCESSING for message ${message.id}`);
          
          try {
            // STEP 1: Send check-in reminder to creator (for notification)
            console.log(`[DUAL-CHANNEL-PROCESSOR] Sending final notification to creator for message ${message.id}`);
            
            // Get creator's profile for WhatsApp
            const { data: profile } = await supabase
              .from('profiles')
              .select('whatsapp_number, email, first_name, last_name')
              .eq('id', message.user_id)
              .single();
            
            // Send creator notification email
            const emailResult = await sendCheckInEmailToCreator(
              profile?.email || 'unknown@example.com',
              message.title,
              message.id,
              0, // 0 hours until deadline (already reached)
              profile?.first_name || 'User'
            );
            
            // Send creator notification WhatsApp if available
            if (profile?.whatsapp_number) {
              await sendCheckInWhatsAppToCreator(
                profile.whatsapp_number,
                message.title,
                message.id,
                0 // 0 hours until deadline
              );
            }
            
            // STEP 2: CRITICAL FIX - Trigger actual message delivery to recipients
            console.log(`[DUAL-CHANNEL-PROCESSOR] Triggering recipient message delivery for message ${message.id}`);
            
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
              console.error(`[DUAL-CHANNEL-PROCESSOR] Error triggering message delivery:`, deliveryResult.error);
              throw new Error(`Message delivery failed: ${deliveryResult.error.message}`);
            }
            
            console.log(`[DUAL-CHANNEL-PROCESSOR] Message delivery triggered successfully for message ${message.id}`);
            
            // STEP 3: Update condition status to inactive (message has been delivered)
            await supabase
              .from('message_conditions')
              .update({ 
                active: false,
                updated_at: new Date().toISOString()
              })
              .eq('id', condition.id);
            
            // STEP 4: Mark reminder as completed
            await supabase
              .from('reminder_schedule')
              .update({ 
                status: 'completed',
                last_attempt_at: new Date().toISOString()
              })
              .eq('id', reminder.id);
            
            // STEP 5: Log the delivery
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
                creator_notified: true,
                recipients_notified: true,
                condition_deactivated: true,
                processed_at: new Date().toISOString()
              }
            );
            
            // STEP 6: CRITICAL - Emit comprehensive frontend events for immediate UI refresh
            const deliveryEvent = {
              event_type: 'message-delivery-complete',
              messageId: message.id,
              conditionId: condition.id,
              action: 'delivery-complete',
              reminderType: 'final_delivery',
              source: 'dual-channel-processor',
              timestamp: new Date().toISOString(),
              finalDelivery: true
            };
            
            // Log the event to trigger frontend refresh
            await supabase.from('reminder_delivery_log').insert({
              reminder_id: reminder.id,
              message_id: message.id,
              condition_id: condition.id,
              recipient: 'frontend-event',
              delivery_channel: 'event-emission',
              delivery_status: 'completed',
              response_data: deliveryEvent
            });
            
            console.log(`[DUAL-CHANNEL-PROCESSOR] Final delivery completed successfully for message ${message.id}`);
            successCount++;
            
          } catch (finalDeliveryError) {
            console.error(`[DUAL-CHANNEL-PROCESSOR] Final delivery failed for message ${message.id}:`, finalDeliveryError);
            
            // Mark reminder as failed
            await supabase
              .from('reminder_schedule')
              .update({ status: 'failed' })
              .eq('id', reminder.id);
            
            errors.push(`Final delivery failed for ${message.title}: ${finalDeliveryError.message}`);
            failedCount++;
          }
          
        } else {
          // REGULAR CHECK-IN REMINDER PROCESSING
          console.log(`[DUAL-CHANNEL-PROCESSOR] Processing regular check-in reminder for message ${message.id}`);
          
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
            // Mark reminder as completed
            await supabase
              .from('reminder_schedule')
              .update({ 
                status: 'completed',
                last_attempt_at: new Date().toISOString()
              })
              .eq('id', reminder.id);
            
            // Log the delivery
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
            console.log(`[DUAL-CHANNEL-PROCESSOR] Check-in reminder sent successfully for message ${message.id}`);
          } else {
            throw new Error(`Both email and WhatsApp delivery failed`);
          }
        }
        
      } catch (error) {
        console.error(`[DUAL-CHANNEL-PROCESSOR] Error processing reminder ${reminder.id}:`, error);
        
        // Mark reminder as failed
        await supabase
          .from('reminder_schedule')
          .update({ status: 'failed' })
          .eq('id', reminder.id);
        
        errors.push(`Reminder ${reminder.id}: ${error.message}`);
        failedCount++;
      }
    }
    
    console.log(`Processing complete: ${successCount} successful, ${failedCount} failed out of ${processedCount} total`);
    
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
