
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

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
      
    // Call the WhatsApp check-in function through Supabase Edge Function
    const { data, error } = await supabase.functions.invoke("perform-whatsapp-check-in", {
      body: {
        phone: cleanPhone,
        userId: userId,
        checkInCode: checkInCode
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
