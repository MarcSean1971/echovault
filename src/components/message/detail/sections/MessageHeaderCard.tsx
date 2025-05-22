
import React from "react";
import { Message } from "@/types/message";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageHeader } from "@/components/message/detail/MessageHeader";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";
import { StatusBadge } from "@/components/ui/status-badge";
import { Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";

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
    <Card className="overflow-hidden border border-border/50 shadow-sm rounded-b-none">
      <CardHeader className="bg-purple-50 border-b border-purple-100 flex flex-row items-center justify-between">
        <CardTitle className={`text-2xl font-semibold ${HOVER_TRANSITION}`}>
          View Message Details
        </CardTitle>
        
        <div className="flex items-center gap-2">
          <StatusBadge status={isArmed ? "armed" : "disarmed"} size="md">
            {isArmed ? "Armed" : "Disarmed"}
          </StatusBadge>
          
          {isArmed ? (
            <Button
              variant="outline"
              onClick={handleDisarmMessage}
              disabled={isActionLoading}
              className="text-green-600 hover:bg-green-100 hover:text-green-700"
              size="sm"
            >
              <BellOff className={`h-4 w-4 mr-2 ${HOVER_TRANSITION}`} /> Disarm
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={handleArmMessage}
              disabled={isActionLoading}
              className="text-purple-600 hover:bg-purple-100 hover:text-purple-700 border-purple-200"
              size="sm"
            >
              <Bell className={`h-4 w-4 mr-2 ${HOVER_TRANSITION}`} /> Arm
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-6 pb-3">
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
