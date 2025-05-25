
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

export function useWhatsAppSubscription() {
  const [isLoading, setIsLoading] = useState(false);

  const subscribeToWhatsApp = async () => {
    setIsLoading(true);
    
    try {
      // Get current user profile
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please log in to subscribe to WhatsApp notifications.",
          variant: "destructive",
        });
        return;
      }

      // Fetch user profile data
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('first_name, last_name, whatsapp_number, backup_email, email')
        .eq('id', user.id)
        .single();

      if (profileError || !profile) {
        toast({
          title: "Profile required",
          description: "Please complete your profile before subscribing to notifications.",
          variant: "destructive",
        });
        return;
      }

      if (!profile.first_name || !profile.whatsapp_number) {
        toast({
          title: "Missing information",
          description: "Please fill in your name and WhatsApp number in your profile.",
          variant: "destructive",
        });
        return;
      }

      // Send contact card via the new edge function
      const { data, error } = await supabase.functions.invoke("send-whatsapp-contact", {
        body: {
          userProfile: {
            ...profile,
            email: user.email // Include the auth email as well
          }
        }
      });
      
      if (error) {
        console.error('Error sending contact card:', error);
        toast({
          title: "Error",
          description: "Failed to send your contact information. Please try again.",
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "Contact card sent!",
        description: "Your contact information has been shared. You'll be added to the notification list shortly.",
      });
      
    } catch (error) {
      console.error('Error in WhatsApp subscription:', error);
      toast({
        title: "Error",
        description: "Failed to send contact information. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    subscribeToWhatsApp,
    isLoading
  };
}
