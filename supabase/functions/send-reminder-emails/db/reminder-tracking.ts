
import { supabaseClient } from "../supabase-client.ts";

/**
 * Update the next reminder time for a condition
 * 
 * @param conditionId Condition ID to update
 * @param nextReminderTime ISO string of the next reminder time
 * @returns Success status
 */
export async function updateNextReminderTime(conditionId: string, nextReminderTime: string): Promise<boolean> {
  try {
    const supabase = supabaseClient();
    
    const { error } = await supabase
      .from('message_conditions')
      .update({ 
        next_reminder_at: nextReminderTime,
        updated_at: new Date().toISOString()
      })
      .eq('id', conditionId);
    
    if (error) {
      console.error(`Error updating next reminder time for condition ${conditionId}:`, error);
      return false;
    }
    
    return true;
  } catch (error: any) {
    console.error(`Error in updateNextReminderTime:`, error);
    return false;
  }
}
