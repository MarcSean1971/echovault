
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { performUserCheckIn } from "@/services/messages/conditions/checkInService";

/**
 * Send a WhatsApp check-in message
 */
export async function sendWhatsAppCheckIn(
  phone: string,
  userId: string,
  checkInCode?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!phone) {
      console.warn("No phone number provided for WhatsApp check-in");
      return { success: false, error: "No phone number provided" };
    }
    
    console.log(`Performing WhatsApp check-in for user ${userId}`);
    
    // Format phone number to ensure proper format (remove whatsapp: prefix if it exists)
    const formattedPhone = phone.replace("whatsapp:", "");
    const cleanPhone = formattedPhone.startsWith('+') ? 
      formattedPhone : 
      `+${formattedPhone.replace(/\D/g, '')}`;
      
    // Update all user conditions (using our new function)
    const checkInResult = await performUserCheckIn(userId);
    
    if (!checkInResult) {
      console.error("Failed to update user conditions for WhatsApp check-in");
      return { success: false, error: "Failed to update user conditions" };
    }
    
    // Call the WhatsApp check-in function through Supabase Edge Function
    const { data, error } = await supabase.functions.invoke("perform-whatsapp-check-in", {
      body: {
        phone: cleanPhone,
        userId: userId,
        checkInCode: checkInCode,
        actionAlreadyPerformed: true // Indicate we already performed the check-in update
      }
    });
    
    if (error) {
      console.error("Error performing WhatsApp check-in:", error);
      return { success: false, error: error.message };
    }
    
    toast({
      title: "Check-In Successful",
      description: "Your check-in has been recorded via WhatsApp",
    });
    
    return { success: true };
  } catch (error: any) {
    console.error("Error in sendWhatsAppCheckIn:", error);
    toast({
      title: "Check-In Failed",
      description: error.message || "Unknown error occurred",
      variant: "destructive",
    });
    return { success: false, error: error.message || "Unknown error" };
  }
}
