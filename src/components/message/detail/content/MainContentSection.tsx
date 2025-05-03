
import { MessageHeader } from "../MessageHeader";
import { MessageContent } from "../MessageContent";
import { MessageAttachments } from "../MessageAttachments";
import { MessageDeliverySettings } from "../MessageDeliverySettings";
import { Separator } from "@/components/ui/separator";
import { WhatsAppIntegration } from "./WhatsAppIntegration";
import { Message } from "@/types/message";
import { Card } from "@/components/ui/card";
import { MapPin } from "lucide-react";

interface MainContentSectionProps {
  message: Message;
  isArmed: boolean;
  isActionLoading: boolean;
  condition: any;
  formatDate: (dateString: string) => string;
  renderConditionType: () => string;
  handleDisarmMessage: () => Promise<void>;
  handleArmMessage: () => Promise<void>;
}

export function MainContentSection({
  message,
  isArmed,
  isActionLoading,
  condition,
  formatDate,
  renderConditionType,
  handleDisarmMessage,
  handleArmMessage
}: MainContentSectionProps) {
  // Check if this is a WhatsApp-enabled panic trigger
  const isPanicTrigger = condition?.condition_type === 'panic_trigger';
  const isWhatsAppPanicTrigger = isPanicTrigger && 
                               (condition?.panic_config?.methods?.includes('whatsapp'));
  
  // Check if location is available
  const hasLocation = message.share_location && 
                    message.location_latitude != null && 
                    message.location_longitude != null;

  return (
    <Card className="overflow-hidden">
      <div className="p-6">
        <MessageHeader 
          message={message} 
          isArmed={isArmed}
          isActionLoading={isActionLoading}
          handleDisarmMessage={handleDisarmMessage}
          handleArmMessage={handleArmMessage}
        />
        
        {/* Message Content Section */}
        <div className="mt-6">
          <h2 className="text-lg font-medium mb-4">Message</h2>
          <MessageContent 
            message={message} 
            isArmed={isArmed} 
          />
          
          {message.attachments && message.attachments.length > 0 && (
            <MessageAttachments message={message} />
          )}
          
          {/* Display location if available */}
          {hasLocation && (
            <div className="mt-6">
              <h3 className="text-md font-medium mb-2 flex items-center">
                <MapPin className="h-5 w-5 mr-1" />
                Location
              </h3>
              <div className="border rounded-lg p-4 space-y-2">
                <p className="font-medium">{message.location_name || "Location attached"}</p>
                <p className="text-sm text-muted-foreground">
                  Latitude: {message.location_latitude?.toFixed(6)}, 
                  Longitude: {message.location_longitude?.toFixed(6)}
                </p>
                
                {/* Static map image using Mapbox */}
                <div className="relative w-full h-48 mt-2 overflow-hidden rounded-lg border">
                  <img 
                    src={`https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/pin-s+f00(${message.location_longitude},${message.location_latitude})/${message.location_longitude},${message.location_latitude},13,0/500x300?access_token=${import.meta.env.VITE_MAPBOX_PUBLIC_TOKEN}`} 
                    alt="Message location map"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Separator between content and delivery settings */}
        <Separator className="my-6" />
        
        {/* Delivery Settings Section */}
        <div className="mt-6">
          <h2 className="text-lg font-medium mb-4">Delivery</h2>
          <MessageDeliverySettings 
            condition={condition}
            formatDate={formatDate}
            renderConditionType={renderConditionType} 
          />
        </div>
        
        {/* Add WhatsApp Test Button for WhatsApp panic triggers */}
        {isWhatsAppPanicTrigger && (
          <WhatsAppIntegration 
            messageId={message.id} 
            panicConfig={condition?.panic_config} 
          />
        )}
      </div>
    </Card>
  );
}
