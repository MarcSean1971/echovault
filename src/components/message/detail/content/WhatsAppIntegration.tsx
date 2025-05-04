
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Smartphone, Clock, AlertTriangle } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { sendTestWhatsAppMessage } from "@/services/messages/notificationService";
import { HOVER_TRANSITION, ICON_HOVER_EFFECTS } from "@/utils/hoverEffects";
import { supabase } from "@/integrations/supabase/client";

interface WhatsAppIntegrationProps {
  messageId: string;
  panicConfig?: {
    methods?: string[];
    trigger_keyword?: string;
  };
}

export function WhatsAppIntegration({ messageId, panicConfig }: WhatsAppIntegrationProps) {
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);
  const [isSendingTemplate, setIsSendingTemplate] = useState(false);
  const [checkInCode, setCheckInCode] = useState<string | null>(null);
  
  useEffect(() => {
    // Fetch custom check-in code if it exists
    const fetchCheckInCode = async () => {
      if (!messageId) return;
      
      try {
        const { data, error } = await supabase
          .from("message_conditions")
          .select("check_in_code")
          .eq("message_id", messageId)
          .single();
          
        if (error) throw error;
        
        if (data && data.check_in_code) {
          setCheckInCode(data.check_in_code);
        }
      } catch (error) {
        console.error("Error fetching check-in code:", error);
      }
    };
    
    fetchCheckInCode();
  }, [messageId]);
  
  const handleSendTestWhatsApp = async () => {
    if (!messageId) return;
    
    try {
      setIsSendingWhatsApp(true);
      await sendTestWhatsAppMessage(messageId);
      toast({
        title: "WhatsApp Test Sent",
        description: "A test WhatsApp message has been sent to the first recipient with a phone number."
      });
    } catch (error) {
      console.error("Error sending test WhatsApp:", error);
      toast({
        title: "Error",
        description: "Failed to send test WhatsApp message",
        variant: "destructive"
      });
    } finally {
      setIsSendingWhatsApp(false);
    }
  };
  
  // Add function to test the WhatsApp template
  const handleTestTemplate = async () => {
    if (!messageId) return;
    
    try {
      setIsSendingTemplate(true);
      
      // Get the first recipient with a phone number
      const { data: condition, error: conditionError } = await supabase
        .from("message_conditions")
        .select("recipients")
        .eq("message_id", messageId)
        .single();
      
      if (conditionError) throw conditionError;
      
      const recipients = condition?.recipients || [];
      const recipient = recipients.find((r: any) => r.phone);
      
      if (!recipient || !recipient.phone) {
        toast({
          title: "No WhatsApp Number",
          description: "Please add a recipient with a phone number to test the template.",
          variant: "destructive"
        });
        return;
      }
      
      // Get message data for location information
      const { data: message, error: messageError } = await supabase
        .from("messages")
        .select("title, share_location, location_latitude, location_longitude, location_name")
        .eq("id", messageId)
        .single();
        
      if (messageError) throw messageError;
      
      // Get the user's profile for sender information
      const { data: profile, error: profileError } = await supabase.auth.getUser();
      
      if (profileError) throw profileError;
      
      const userId = profile?.user?.id;
      
      if (!userId) throw new Error("User not authenticated");
      
      const { data: userData, error: userDataError } = await supabase
        .from("profiles")
        .select("first_name, last_name")
        .eq("id", userId)
        .single();
        
      if (userDataError) throw userDataError;
      
      // Format location information
      let locationInfo = "Test location";
      let mapUrl = "https://maps.example.com";
      
      if (message?.share_location && message?.location_latitude && message?.location_longitude) {
        locationInfo = message.location_name || `${message.location_latitude}, ${message.location_longitude}`;
        mapUrl = `https://maps.google.com/?q=${message.location_latitude},${message.location_longitude}`;
      }
      
      // Format sender name
      const senderName = `${userData?.first_name || ""} ${userData?.last_name || ""}`.trim() || "You";
      
      // Use the template ID
      const templateId = "test_emergency_alert_hx4386568436c1f993dd47146448194dd8";
      
      // Prepare template parameters
      const templateParams = [
        senderName,            // Parameter 1: Sender name
        recipient.name,        // Parameter 2: Recipient name
        locationInfo,          // Parameter 3: Location
        mapUrl                 // Parameter 4: Map URL
      ];
      
      // Call the WhatsApp notification function with template
      const { data, error } = await supabase.functions.invoke("send-whatsapp-notification", {
        body: {
          to: recipient.phone,
          useTemplate: true,
          templateId: templateId,
          templateParams: templateParams,
          messageId: messageId,
          recipientName: recipient.name,
          isEmergency: true
        }
      });
      
      if (error) throw error;
      
      toast({
        title: "Template Test Sent",
        description: "A test WhatsApp template message has been sent to " + recipient.name,
      });
      
    } catch (error: any) {
      console.error("Error sending template test:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send template test",
        variant: "destructive"
      });
    } finally {
      setIsSendingTemplate(false);
    }
  };
  
  return (
    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium flex items-center">
            <Smartphone className={`h-4 w-4 mr-2 ${ICON_HOVER_EFFECTS.default}`} />
            WhatsApp Integration
          </h3>
          <p className="text-sm text-gray-600">
            Test the WhatsApp notification for this message
          </p>
        </div>
        <div className="space-x-2">
          <Button 
            variant="outline"
            size="sm"
            disabled={isSendingWhatsApp}
            onClick={handleSendTestWhatsApp}
            className={`flex items-center ${HOVER_TRANSITION}`}
          >
            <Smartphone className={`h-3 w-3 mr-1 ${ICON_HOVER_EFFECTS.default}`} />
            {isSendingWhatsApp ? "Sending..." : "Test Message"}
          </Button>
          <Button 
            variant="outline"
            size="sm"
            disabled={isSendingTemplate}
            onClick={handleTestTemplate}
            className={`flex items-center ${HOVER_TRANSITION}`}
          >
            <AlertTriangle className={`h-3 w-3 mr-1 ${ICON_HOVER_EFFECTS.default}`} />
            {isSendingTemplate ? "Sending..." : "Test Template"}
          </Button>
        </div>
      </div>
      
      {panicConfig?.trigger_keyword && (
        <div className="mt-2 text-xs text-gray-600">
          <span className="font-medium">Trigger keyword:</span> "{panicConfig.trigger_keyword}"
        </div>
      )}
      
      <div className="mt-3 border-t border-blue-100 pt-2">
        <div className="flex items-center">
          <Clock className={`h-4 w-4 mr-2 ${ICON_HOVER_EFFECTS.default}`} />
          <h4 className="text-sm font-medium">WhatsApp Check-In</h4>
        </div>
        <p className="text-xs text-gray-600 mt-1">
          You can check in via WhatsApp by sending 
          {checkInCode ? (
            <> "<span className="font-medium">{checkInCode}</span>", </>
          ) : null}
          "CHECKIN" or "CODE" to the WhatsApp number.
        </p>
      </div>
    </div>
  );
}
