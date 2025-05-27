
import { supabaseClient } from "./supabase-client.ts";

export async function sendCheckInReminderToCreator(
  creatorUserId: string,
  messageTitle: string,
  messageId: string
): Promise<boolean> {
  try {
    console.log(`Sending check-in reminder to creator ${creatorUserId} for message "${messageTitle}"`);
    
    const supabase = supabaseClient();
    
    // Get creator's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email, first_name, whatsapp_number')
      .eq('id', creatorUserId)
      .single();
    
    if (profileError || !profile?.email) {
      console.error("Creator profile not found:", profileError);
      return false;
    }
    
    // Send email reminder using existing email service
    const { error: emailError } = await supabase.functions.invoke('send-reminder-emails', {
      body: {
        messageId: messageId,
        debug: true,
        forceSend: true,
        source: "simple_checkin_reminder"
      }
    });
    
    if (emailError) {
      console.error("Error sending check-in reminder email:", emailError);
      return false;
    }
    
    console.log(`Check-in reminder sent successfully to ${profile.email}`);
    return true;
    
  } catch (error: any) {
    console.error("Error in sendCheckInReminderToCreator:", error);
    return false;
  }
}
