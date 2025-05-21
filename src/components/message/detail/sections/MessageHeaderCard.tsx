
import React from "react";
import { Message } from "@/types/message";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCardHeader } from "../MessageCardHeader";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";

interface MessageHeaderCardProps {
  message: Message;
  isArmed: boolean;
  isActionLoading: boolean;
  handleDisarmMessage: () => Promise<void>;
  handleArmMessage: () => Promise<Date | null>;
}

export function MessageHeaderCard({
  message,
  isArmed,
  isActionLoading,
  handleDisarmMessage,
  handleArmMessage
}: MessageHeaderCardProps) {
  return (
    <Card className="overflow-hidden border border-border/50 shadow-sm">
      <CardHeader className="bg-purple-50 border-b border-purple-100">
        <CardTitle className={`text-2xl font-semibold text-purple-900 ${HOVER_TRANSITION}`}>
          View Message Details
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <MessageHeader
          message={message}
          isArmed={isArmed}
          isActionLoading={isActionLoading}
          handleDisarmMessage={handleDisarmMessage}
          handleArmMessage={handleArmMessage}
        />
      </CardContent>
    </Card>
  );
}
