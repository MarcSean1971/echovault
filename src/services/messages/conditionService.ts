import { supabase } from "@/integrations/supabase/client";
import { MessageCondition, TriggerType } from "@/types/message";
import { Recipient } from "@/types/recipient";

// Cache for conditions to reduce database calls
const conditionsCache = new Map<string, { data: MessageCondition[]; timestamp: number }>();
const CACHE_DURATION = 30000; // 30 seconds

export async function fetchMessageConditions(userId: string): Promise<MessageCondition[]> {
  // Check cache first
  const cached = conditionsCache.get(userId);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log("[conditionService] Returning cached conditions for user:", userId);
    return cached.data;
  }

  try {
    console.log("[conditionService] Fetching fresh conditions for user:", userId);
    
    // CRITICAL SECURITY FIX: Only fetch conditions for messages owned by the current user
    const { data, error } = await supabase
      .from('message_conditions')
      .select(`
        *,
        messages!inner(
          id,
          user_id,
          title
        )
      `)
      .eq('messages.user_id', userId); // CRITICAL: Filter by user_id through messages table
    
    if (error) {
      console.error("[conditionService] Error fetching conditions:", error);
      throw error;
    }
    
    console.log(`[conditionService] Retrieved ${data?.length || 0} conditions for user ${userId}`);
    
    const conditions = data || [];
    
    // Update cache
    conditionsCache.set(userId, {
      data: conditions,
      timestamp: Date.now()
    });
    
    return conditions;
  } catch (error) {
    console.error("[conditionService] Error in fetchMessageConditions:", error);
    throw error;
  }
}

export async function getConditionByMessageId(messageId: string): Promise<MessageCondition | null> {
  try {
    // Get current user to ensure they can only access conditions for their own messages
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("User not authenticated");
    }
    
    const { data, error } = await supabase
      .from('message_conditions')
      .select(`
        *,
        messages!inner(
          id,
          user_id
        )
      `)
      .eq('message_id', messageId)
      .eq('messages.user_id', user.id) // CRITICAL: Ensure user owns the message
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        // No matching condition found
        return null;
      }
      console.error("Error fetching condition by message ID:", error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error("Error in getConditionByMessageId:", error);
    throw error;
  }
}

export function invalidateConditionsCache(userId: string) {
  console.log("[conditionService] Invalidating cache for user:", userId);
  conditionsCache.delete(userId);
}

export async function createMessageCondition(
  messageId: string,
  conditionType: TriggerType,
  options: {
    hoursThreshold?: number;
    minutesThreshold?: number;
    triggerDate?: string;
    recurringPattern?: any;
    pinCode?: string;
    unlockDelayHours?: number;
    expiryHours?: number;
    reminderHours?: number;
    panicTriggerConfig?: any;
    checkInCode?: string;
    recipients: Recipient[];
  }
): Promise<MessageCondition> {
  try {
    // Get current user to ensure they can only create conditions for their own messages
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("User not authenticated");
    }
    
    // Verify the user owns the message
    const { data: messageData, error: messageError } = await supabase
      .from('messages')
      .select('user_id')
      .eq('id', messageId)
      .eq('user_id', user.id) // CRITICAL: Ensure user owns the message
      .single();
      
    if (messageError || !messageData) {
      throw new Error("Message not found or access denied");
    }
    
    const conditionData: any = {
      message_id: messageId,
      condition_type: conditionType,
      hours_threshold: options.hoursThreshold || 24,
      minutes_threshold: options.minutesThreshold || 0,
      recipients: options.recipients,
      active: true,
      last_checked: new Date().toISOString()
    };

    // Add conditional fields based on condition type
    if (options.triggerDate) {
      conditionData.trigger_date = options.triggerDate;
    }
    
    if (options.recurringPattern) {
      conditionData.recurring_pattern = options.recurringPattern;
    }
    
    if (options.pinCode) {
      conditionData.pin_code = options.pinCode;
    }
    
    if (options.unlockDelayHours) {
      conditionData.unlock_delay_hours = options.unlockDelayHours;
    }
    
    if (options.expiryHours) {
      conditionData.expiry_hours = options.expiryHours;
    }
    
    if (options.reminderHours) {
      conditionData.reminder_hours = [options.reminderHours];
    }
    
    if (options.panicTriggerConfig) {
      conditionData.panic_config = options.panicTriggerConfig;
    }
    
    if (options.checkInCode) {
      conditionData.check_in_code = options.checkInCode;
    }

    const { data, error } = await supabase
      .from('message_conditions')
      .insert(conditionData)
      .select()
      .single();

    if (error) {
      console.error("Error creating message condition:", error);
      throw error;
    }
    
    // Invalidate cache for this user
    invalidateConditionsCache(user.id);

    return data;
  } catch (error) {
    console.error("Error in createMessageCondition:", error);
    throw error;
  }
}

export async function updateMessageCondition(
  conditionId: string,
  updates: Partial<MessageCondition>
): Promise<MessageCondition> {
  try {
    // Get current user to ensure they can only update conditions for their own messages
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("User not authenticated");
    }
    
    const { data, error } = await supabase
      .from('message_conditions')
      .update(updates)
      .eq('id', conditionId)
      .select(`
        *,
        messages!inner(
          user_id
        )
      `)
      .eq('messages.user_id', user.id) // CRITICAL: Ensure user owns the message
      .single();

    if (error) {
      console.error("Error updating message condition:", error);
      throw error;
    }
    
    // Invalidate cache for this user
    invalidateConditionsCache(user.id);

    return data;
  } catch (error) {
    console.error("Error in updateMessageCondition:", error);
    throw error;
  }
}

export async function deleteMessageCondition(conditionId: string): Promise<boolean> {
  try {
    // Get current user to ensure they can only delete conditions for their own messages
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("User not authenticated");
    }
    
    // First verify the user owns the message this condition belongs to
    const { data: conditionData, error: fetchError } = await supabase
      .from('message_conditions')
      .select(`
        id,
        messages!inner(
          user_id
        )
      `)
      .eq('id', conditionId)
      .eq('messages.user_id', user.id) // CRITICAL: Ensure user owns the message
      .single();
      
    if (fetchError || !conditionData) {
      throw new Error("Condition not found or access denied");
    }
    
    const { error } = await supabase
      .from('message_conditions')
      .delete()
      .eq('id', conditionId);

    if (error) {
      console.error("Error deleting message condition:", error);
      throw error;
    }
    
    // Invalidate cache for this user
    invalidateConditionsCache(user.id);

    return true;
  } catch (error) {
    console.error("Error in deleteMessageCondition:", error);
    throw error;
  }
}
