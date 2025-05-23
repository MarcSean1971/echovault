
import { supabase } from "@/integrations/supabase/client";

/**
 * Enable Realtime functionality for WhatsApp check-ins
 * This is necessary to update the UI when a check-in is received via WhatsApp
 */
export async function enableRealtimeForConditions(): Promise<boolean> {
  try {
    console.log("[RealtimeHelper] Enabling Realtime for message_conditions table");
    
    // First check if the table is already in the publication
    const { data: publicationTables, error: checkError } = await supabase
      .from('_realtime')
      .select('tables')
      .single();
      
    if (checkError) {
      console.error("[RealtimeHelper] Error checking Realtime status:", checkError);
      
      // Since we can't directly access the publication information, let's just try to enable it
      await supabase.rpc('supabase_realtime', {
        table_name: 'message_conditions',
        action: 'enable'
      });
    } else if (publicationTables && !publicationTables.includes('message_conditions')) {
      // Enable Realtime for the message_conditions table
      await supabase.rpc('supabase_realtime', {
        table_name: 'message_conditions',
        action: 'enable'
      });
    }
    
    console.log("[RealtimeHelper] Realtime enabled successfully for message_conditions table");
    return true;
  } catch (error) {
    console.error("[RealtimeHelper] Error enabling Realtime:", error);
    return false;
  }
}
