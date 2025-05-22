
import { supabase } from "@/integrations/supabase/client";

/**
 * Get sender information for email notifications
 */
export async function getSenderInfo() {
  try {
    // Get the user's profile for sender information
    const { data: profile } = await supabase.auth.getUser();
    
    const userId = profile?.user?.id;
    
    if (!userId) throw new Error("User not authenticated");
    
    const { data: userData, error: userDataError } = await supabase
      .from("profiles")
      .select("first_name, last_name")
      .eq("id", userId)
      .single();
      
    if (userDataError) throw userDataError;
    
    // Format sender name
    const senderName = `${userData?.first_name || ""} ${userData?.last_name || ""}`.trim() || "You";
    
    return { senderName, userId };
  } catch (error: any) {
    console.error("Error getting sender info:", error);
    return { senderName: "You", userId: null };
  }
}
