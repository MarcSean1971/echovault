
import { supabaseClient } from "../supabase-client.ts";

/**
 * Centralized logging service for reminder operations
 */
export class ReminderLogger {
  private supabase = supabaseClient();

  async logReminderDelivery(
    reminderId: string,
    messageId: string,
    conditionId: string,
    recipient: string,
    channel: string,
    status: 'sent' | 'failed',
    responseData?: any,
    errorMessage?: string
  ): Promise<void> {
    try {
      await this.supabase.from('reminder_delivery_log').insert({
        reminder_id: reminderId,
        message_id: messageId,
        condition_id: conditionId,
        recipient: recipient,
        delivery_channel: channel,
        delivery_status: status,
        response_data: responseData || {},
        error_message: errorMessage
      });
    } catch (error) {
      console.error("[REMINDER-LOGGER] Error logging delivery:", error);
      // Don't fail the entire process for logging errors
    }
  }

  async logSystemEvent(
    eventType: string,
    messageId?: string,
    conditionId?: string,
    data?: any
  ): Promise<void> {
    try {
      await this.supabase.from('reminder_delivery_log').insert({
        reminder_id: `system-${eventType}-${Date.now()}`,
        message_id: messageId || null,
        condition_id: conditionId || null,
        recipient: 'system',
        delivery_channel: 'system',
        delivery_status: 'completed',
        response_data: {
          event_type: eventType,
          timestamp: new Date().toISOString(),
          ...data
        }
      });
    } catch (error) {
      console.error("[REMINDER-LOGGER] Error logging system event:", error);
    }
  }
}

export const reminderLogger = new ReminderLogger();
