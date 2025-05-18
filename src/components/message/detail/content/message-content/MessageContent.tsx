
import React, { useEffect, useState } from "react";
import { Message } from "@/types/message";
import { Separator } from "@/components/ui/separator";
import { MessageAttachments } from "../../MessageAttachments";
import { TextContentSection } from "./TextContentSection";
import { VideoContentSection } from "./VideoContentSection";
import { LocationSection } from "./LocationSection";
import { WhatsAppSection } from "./WhatsAppSection";
import { useMessageContentTypes } from "./useMessageContentTypes";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HOVER_TRANSITION, BUTTON_HOVER_EFFECTS } from "@/utils/hoverEffects";

export interface MessageContentProps {
  message: Message;
  deliveryId?: string | null;
  recipientEmail?: string | null;
  conditionType?: string;
}

export function MessageContent({ 
  message,
  deliveryId,
  recipientEmail,
  conditionType
}: MessageContentProps) {
  const {
    hasVideoContent,
    hasTextContent,
    additionalText,
    transcription,
    isDeadmansSwitch,
    isMessageDetailPage
  } = useMessageContentTypes(message, conditionType);
  
  // State for active tab
  const [activeTab, setActiveTab] = useState<string>("text");
  
  // Determine if this is a panic trigger message with WhatsApp configuration
  const isPanicTrigger = message.message_type === "panic_trigger";
  const hasPanicConfig = message.panic_config || message.panic_trigger_config;

  // Check if message has location data
  const hasLocationData = message.share_location && 
                         message.location_latitude && 
                         message.location_longitude;

  // Determine which content to show - we'll make sure to only show one text component
  const shouldShowTextContent = message.message_type === "text";
  
  // For deadman's switch with content but not text message type
  const shouldShowDeadmansContent = isDeadmansSwitch && 
                               message.content && 
                               message.message_type !== "text" &&
                               !hasVideoContent;
  
  // For other message types with text but no video
  const shouldShowOtherTextContent = hasTextContent && 
                                !message.message_type.includes("text") && 
                                !message.message_type.includes("video") && 
                                !hasVideoContent && 
                                message.content &&
                                !shouldShowTextContent &&  // Make sure we don't duplicate
                                !shouldShowDeadmansContent; // Make sure we don't duplicate

  // Should show the video tab?
  const showVideoTab = message.message_type === "video" || 
    (!message.message_type.includes("text") && hasVideoContent);
  
  // Start loading video content in the background when page loads
  useEffect(() => {
    if (showVideoTab && activeTab === "text") {
      console.log("Starting to load video content in the background");
      // The VideoContentSection component handles the actual loading
      // This effect just ensures we're triggering it early
    }
  }, [showVideoTab, activeTab]);

  return (
    <div className="space-y-6">
      {/* Only show tabs if we have video content */}
      {showVideoTab ? (
        <Tabs defaultValue="text" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className={`${HOVER_TRANSITION}`}>
            <TabsTrigger value="text" className={HOVER_TRANSITION}>Text Content</TabsTrigger>
            <TabsTrigger value="video" className={HOVER_TRANSITION}>Video Content</TabsTrigger>
          </TabsList>
          
          {/* Text Content Tab */}
          <TabsContent value="text">
            {/* Text content sections */}
            {shouldShowTextContent && (
              <TextContentSection message={message} content={message.content} />
            )}
            
            {shouldShowDeadmansContent && (
              <TextContentSection message={message} content={message.content} />
            )}
            
            {shouldShowOtherTextContent && (
              <TextContentSection message={message} content={message.content} />
            )}
            
            {/* Attachments section - always in text tab before location */}
            {message.attachments && message.attachments.length > 0 && (
              <div>
                <Separator className="my-4" />
                <h3 className="text-lg font-medium mb-3">Attachments</h3>
                <MessageAttachments 
                  message={message}
                  deliveryId={deliveryId}
                  recipientEmail={recipientEmail}
                />
              </div>
            )}
            
            {/* Location display section - always in text tab after attachments */}
            {hasLocationData && (
              <LocationSection 
                latitude={message.location_latitude!}
                longitude={message.location_longitude!}
                locationName={message.location_name}
              />
            )}
            
            {/* WhatsApp Integration for panic triggers - always in text tab */}
            {isPanicTrigger && hasPanicConfig && (
              <WhatsAppSection 
                messageId={message.id}
                panicConfig={message.panic_config || message.panic_trigger_config}
              />
            )}
          </TabsContent>
          
          {/* Video Content Tab */}
          <TabsContent value="video">
            <VideoContentSection 
              message={message} 
              additionalText={additionalText} 
              transcription={transcription} 
            />
          </TabsContent>
        </Tabs>
      ) : (
        /* No video content, so no tabs needed - just show text content directly */
        <div className="space-y-6">
          {/* Text content sections */}
          {shouldShowTextContent && (
            <TextContentSection message={message} content={message.content} />
          )}
          
          {shouldShowDeadmansContent && (
            <TextContentSection message={message} content={message.content} />
          )}
          
          {shouldShowOtherTextContent && (
            <TextContentSection message={message} content={message.content} />
          )}
          
          {/* Attachments section */}
          {message.attachments && message.attachments.length > 0 && (
            <div>
              <Separator className="my-4" />
              <h3 className="text-lg font-medium mb-3">Attachments</h3>
              <MessageAttachments 
                message={message}
                deliveryId={deliveryId}
                recipientEmail={recipientEmail}
              />
            </div>
          )}
          
          {/* Location display section */}
          {hasLocationData && (
            <LocationSection 
              latitude={message.location_latitude!}
              longitude={message.location_longitude!}
              locationName={message.location_name}
            />
          )}
          
          {/* WhatsApp Integration for panic triggers */}
          {isPanicTrigger && hasPanicConfig && (
            <WhatsAppSection 
              messageId={message.id}
              panicConfig={message.panic_config || message.panic_trigger_config}
            />
          )}
        </div>
      )}
    </div>
  );
}
