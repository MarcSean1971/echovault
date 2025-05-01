
import { getAuthClient } from "@/lib/supabaseClient";
import { MessageCondition, Recipient } from "@/types/message";

export async function createMessageCondition(
  messageId: string,
  conditionType: 'no_check_in' | 'regular_check_in',
  hoursThreshold: number,
  recipients: Recipient[]
): Promise<MessageCondition> {
  try {
    const client = await getAuthClient();
    
    const { data, error } = await client
      .from('message_conditions')
      .insert({
        message_id: messageId,
        condition_type: conditionType,
        hours_threshold: hoursThreshold,
        recipients: recipients,
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
