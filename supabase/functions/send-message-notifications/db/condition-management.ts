
import { supabaseClient } from "../supabase-client.ts";

/**
 * Update condition status (active/inactive)
 */
export async function updateConditionStatus(conditionId: string, isActive: boolean) {
  try {
    const supabase = supabaseClient();
    
    const { error } = await supabase
      .from("message_conditions")
      .update({
        active: isActive
      })
      .eq("id", conditionId);
    
    if (error) {
      console.error("Error updating condition status:", error);
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error("Error in updateConditionStatus:", error);
    throw error;
  }
}

/**
 * Get panic configuration from condition
 */
export async function getPanicConfig(conditionId: string) {
  try {
    const supabase = supabaseClient();
    
    const { data, error } = await supabase
      .from("message_conditions")
      .select("panic_config")
      .eq("id", conditionId)
      .single();
    
    if (error) {
      console.error("Error getting panic config:", error);
      throw error;
    }
    
    return data?.panic_config;
  } catch (error) {
    console.error("Error in getPanicConfig:", error);
    throw error;
  }
}
