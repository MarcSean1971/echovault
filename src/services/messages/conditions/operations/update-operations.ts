
import { supabase } from "@/integrations/supabase/client";

/**
 * Update last_checked timestamp for multiple conditions
 * CRITICAL FIX: Only update last_checked, never touch active field
 */
export async function updateConditionsLastChecked(conditionIds: string[]): Promise<boolean> {
  try {
    console.log(`[UPDATE-OPERATIONS] CRITICAL: Updating ONLY last_checked for conditions: ${conditionIds}`);
    
    const now = new Date().toISOString();
    
    // CRITICAL FIX: Explicitly only update last_checked field
    const { error } = await supabase
      .from("message_conditions")
      .update({ last_checked: now })
      .in("id", conditionIds);
    
    if (error) {
      console.error("[UPDATE-OPERATIONS] Error updating last_checked:", error);
      throw error;
    }
    
    console.log("[UPDATE-OPERATIONS] CONFIRMED: Successfully updated ONLY last_checked timestamps, active field untouched");
    return true;
  } catch (error) {
    console.error("[UPDATE-OPERATIONS] Error in updateConditionsLastChecked:", error);
    throw error;
  }
}

/**
 * Update a condition in the database
 */
export async function updateConditionInDb(conditionId: string, updates: any): Promise<any> {
  try {
    console.log(`[UPDATE-OPERATIONS] Updating condition ${conditionId} with:`, updates);
    
    const { data, error } = await supabase
      .from("message_conditions")
      .update(updates)
      .eq("id", conditionId)
      .select()
      .single();
    
    if (error) {
      console.error("[UPDATE-OPERATIONS] Error updating condition:", error);
      throw error;
    }
    
    console.log("[UPDATE-OPERATIONS] Successfully updated condition");
    return data;
  } catch (error) {
    console.error("[UPDATE-OPERATIONS] Error in updateConditionInDb:", error);
    throw error;
  }
}
