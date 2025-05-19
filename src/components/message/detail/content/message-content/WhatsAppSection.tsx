
import React from "react";
import { WhatsAppIntegration } from "../WhatsAppIntegration";
import { Separator } from "@/components/ui/separator";
import { Message } from "@/types/message";

interface WhatsAppSectionProps {
  messageId?: string;
  message?: Message;
  deliveryId?: string | null;
  recipientEmail?: string | null;
  panicConfig?: {
    methods?: string[];
    trigger_keyword?: string;
  };
}

export function WhatsAppSection({ 
  messageId, 
  message,
  deliveryId,
  recipientEmail,
  panicConfig 
}: WhatsAppSectionProps) {
  // Use message.id if message is provided, otherwise use messageId prop
  const resolvedMessageId = message?.id || messageId;

  // Skip rendering if no messageId is available
  if (!resolvedMessageId) return null;
  
  // Use panic_config from message if available, otherwise use panicConfig prop
  const resolvedPanicConfig = message?.panic_config || panicConfig;
  
  return (
    <>
      <Separator className="my-4" />
      <WhatsAppIntegration 
        messageId={resolvedMessageId}
        panicConfig={resolvedPanicConfig}
      />
    </>
  );
}
