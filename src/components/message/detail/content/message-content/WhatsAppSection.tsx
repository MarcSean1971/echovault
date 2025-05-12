
import React from "react";
import { WhatsAppIntegration } from "../WhatsAppIntegration";
import { Separator } from "@/components/ui/separator";

interface WhatsAppSectionProps {
  messageId: string;
  panicConfig?: {
    methods?: string[];
    trigger_keyword?: string;
  };
}

export function WhatsAppSection({ 
  messageId, 
  panicConfig 
}: WhatsAppSectionProps) {
  return (
    <>
      <Separator className="my-4" />
      <WhatsAppIntegration 
        messageId={messageId}
        panicConfig={panicConfig}
      />
    </>
  );
}
