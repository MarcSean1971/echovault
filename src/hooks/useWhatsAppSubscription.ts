
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

export function useWhatsAppSubscription() {
  const [isLoading, setIsLoading] = useState(false);

  const getAppWhatsAppNumber = async (): Promise<string | null> => {
    try {
      // Try to get the app's WhatsApp number from edge function or environment
      const { data, error } = await supabase.functions.invoke('get-app-config', {
        body: { key: 'TWILIO_WHATSAPP_NUMBER' }
      });
      
      if (error) {
        console.warn('Could not fetch app WhatsApp number:', error);
        return null;
      }
      
      return data?.value || null;
    } catch (error) {
      console.warn('Error fetching app WhatsApp number:', error);
      return null;
    }
  };

  const subscribeToWhatsApp = async () => {
    setIsLoading(true);
    
    try {
      const appWhatsAppNumber = await getAppWhatsAppNumber();
      
      if (!appWhatsAppNumber) {
        toast({
          title: "Service unavailable",
          description: "WhatsApp subscription is currently unavailable. Please try again later.",
          variant: "destructive",
        });
        return;
      }

      // Clean the phone number (remove whatsapp: prefix if present)
      const cleanNumber = appWhatsAppNumber.replace('whatsapp:', '').trim();
      
      // Create the subscription message
      const message = encodeURIComponent(
        "Hi! I'd like to subscribe to emergency notifications and check-in reminders from your safety app. Please add me to your notification list."
      );
      
      // Create WhatsApp URL
      const whatsappUrl = `https://wa.me/${cleanNumber.replace(/[^\d]/g, '')}?text=${message}`;
      
      // Open WhatsApp
      window.open(whatsappUrl, '_blank');
      
      toast({
        title: "Opening WhatsApp",
        description: "Complete your subscription by sending the pre-filled message.",
      });
      
    } catch (error) {
      console.error('Error opening WhatsApp subscription:', error);
      toast({
        title: "Error",
        description: "Failed to open WhatsApp. Please try again.",
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
