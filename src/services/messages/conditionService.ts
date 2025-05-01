
import { getAuthClient } from "@/lib/supabaseClient";
import { MessageCondition, Recipient, TriggerType } from "@/types/message";

export async function createMessageCondition(
  messageId: string,
  conditionType: TriggerType,
  options: {
    hoursThreshold?: number;
    triggerDate?: string;
    recurringPattern?: {
      type: 'daily' | 'weekly' | 'monthly' | 'yearly';
      interval: number;
      day?: number;
      month?: number;
    } | null;
    confirmationRequired?: number;
    unlockDelayHours?: number;
    expiryHours?: number;
    pinCode?: string;
    recipients: Recipient[]
  }
): Promise<MessageCondition> {
  try {
    const client = await getAuthClient();
    
    const { data, error } = await client
      .from('message_conditions')
      .insert({
        message_id: messageId,
        condition_type: conditionType,
        hours_threshold: options.hoursThreshold,
        trigger_date: options.triggerDate,
        recurring_pattern: options.recurringPattern,
        confirmation_required: options.confirmationRequired,
        unlock_delay_hours: options.unlockDelayHours,
        expiry_hours: options.expiryHours,
        pin_code: options.pinCode,
        recipients: options.recipients,
        active: true
      })
      .select();

    if (error) throw error;
    
    return data[0] as MessageCondition;
  } catch (error) {
    console.error("Error creating message condition:", error);
    throw error;
  }
}

export async function updateMessageCondition(
  id: string,
  updates: Partial<MessageCondition>
): Promise<MessageCondition> {
  try {
    const client = await getAuthClient();
    
    const { data, error } = await client
      .from('message_conditions')
      .update(updates)
      .eq('id', id)
      .select();

    if (error) throw error;
    
    return data[0] as MessageCondition;
  } catch (error) {
    console.error("Error updating message condition:", error);
    throw error;
  }
}

export async function fetchMessageConditions(messageId: string): Promise<MessageCondition[]> {
  try {
    const client = await getAuthClient();
    
    const { data, error } = await client
      .from('message_conditions')
      .select('*')
      .eq('message_id', messageId);

    if (error) throw error;
    
    return data as MessageCondition[];
  } catch (error) {
    console.error("Error fetching message conditions:", error);
    throw error;
  }
}

export async function performCheckIn(userId: string, method: 'app' | 'email' | 'sms' | 'biometric', deviceInfo?: string, location?: { latitude: number; longitude: number }): Promise<void> {
  try {
    const client = await getAuthClient();
    
    // Update the last_checked timestamp for all of the user's active conditions
    const { error: updateError } = await client
      .from('message_conditions')
      .update({ last_checked: new Date().toISOString() })
      .eq('active', true)
      .in('condition_type', ['no_check_in', 'regular_check_in']);
      
    if (updateError) throw updateError;
    
    // Record the check-in in the check_ins table
    const { error: insertError } = await client
      .from('check_ins')
      .insert({
        user_id: userId,
        method,
        device_info: deviceInfo,
        location
      });
      
    if (insertError) throw insertError;
    
  } catch (error) {
    console.error("Error performing check-in:", error);
    throw error;
  }
}

export async function getNextCheckInDeadline(userId: string): Promise<{ deadline: Date | null; messageId: string | null }> {
  try {
    const client = await getAuthClient();
    
    // Get active conditions that require check-ins
    const { data, error } = await client
      .from('message_conditions')
      .select('*')
      .eq('active', true)
      .in('condition_type', ['no_check_in', 'regular_check_in']);
      
    if (error) throw error;
    
    if (!data || data.length === 0) {
      return { deadline: null, messageId: null };
    }
    
    // Calculate the deadline for each condition and find the earliest
    const now = new Date();
    let earliestDeadline: Date | null = null;
    let earliestMessageId: string | null = null;
    
    data.forEach((condition: MessageCondition) => {
      const lastChecked = new Date(condition.last_checked);
      
      if (condition.condition_type === 'no_check_in' && condition.hours_threshold) {
        const deadline = new Date(lastChecked);
        deadline.setHours(deadline.getHours() + condition.hours_threshold);
        
        if (!earliestDeadline || deadline < earliestDeadline) {
          earliestDeadline = deadline;
          earliestMessageId = condition.message_id;
        }
      }
      else if (condition.condition_type === 'regular_check_in' && condition.hours_threshold) {
        const deadline = new Date(lastChecked);
        deadline.setHours(deadline.getHours() + condition.hours_threshold);
        
        if (!earliestDeadline || deadline < earliestDeadline) {
          earliestDeadline = deadline;
          earliestMessageId = condition.message_id;
        }
      }
    });
    
    return { deadline: earliestDeadline, messageId: earliestMessageId };
  } catch (error) {
    console.error("Error getting next check-in deadline:", error);
    throw error;
  }
}

export async function triggerManualPanic(userId: string, messageId: string): Promise<void> {
  try {
    const client = await getAuthClient();
    
    // Find any panic trigger conditions for this message
    const { data, error } = await client
      .from('message_conditions')
      .select('*')
      .eq('message_id', messageId)
      .eq('condition_type', 'panic_trigger')
      .eq('active', true);
      
    if (error) throw error;
    
    if (!data || data.length === 0) {
      throw new Error("No panic trigger condition found for this message");
    }
    
    // Create a record of the manual trigger
    const { error: insertError } = await client
      .from('message_triggers')
      .insert({
        user_id: userId,
        message_id: messageId,
        trigger_method: 'app_button',
        message_condition_id: data[0].id
      });
      
    if (insertError) throw insertError;
    
    // TODO: In a production system, this would queue actual message delivery
    console.log(`Panic trigger activated for message ${messageId}`);
    
  } catch (error) {
    console.error("Error triggering manual panic:", error);
    throw error;
  }
}
