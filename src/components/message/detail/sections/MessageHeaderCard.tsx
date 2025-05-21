
import React from "react";
import { Message } from "@/types/message";
import { Card, CardContent } from "@/components/ui/card";
import { MessageHeader } from "../MessageHeader";

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
