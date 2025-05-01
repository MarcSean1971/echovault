
import { supabase } from "@/integrations/supabase/client";
import { MessageCondition, Recipient } from "@/types/message";

export async function createMessageCondition(
  messageId: string,
  conditionType: 'no_check_in' | 'regular_check_in',
  hoursThreshold: number,
  recipients: Recipient[]
): Promise<MessageCondition> {
  try {
    const { data, error } = await supabase
      .from('message_conditions')
      .insert({
        message_id: messageId,
        condition_type: conditionType,
        hours_threshold: hoursThreshold,
        recipients: recipients,
        active: true,
        last_checked: new Date().toISOString()
      })
      .select();

    if (error) throw error;

    return data[0] as unknown as MessageCondition;
  } catch (error) {
    console.error("Error creating message condition:", error);
    throw error;
  }
}

export async function fetchMessageCondition(messageId: string): Promise<MessageCondition | null> {
  try {
    const { data, error } = await supabase
      .from('message_conditions')
      .select('*')
      .eq('message_id', messageId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned" error
      throw error;
    }

    if (!data) {
      return null;
    }

    return data as unknown as MessageCondition;
  } catch (error) {
    console.error("Error fetching message condition:", error);
    throw error;
  }
}

export async function updateMessageCondition(
  id: string,
  updates: Partial<Omit<MessageCondition, 'id' | 'created_at' | 'updated_at'>>
): Promise<MessageCondition> {
  try {
    const { data, error } = await supabase
      .from('message_conditions')
      .update(updates)
      .eq('id', id)
      .select();

    if (error) throw error;

    return data[0] as unknown as MessageCondition;
  } catch (error) {
    console.error("Error updating message condition:", error);
    throw error;
  }
}
