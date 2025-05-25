
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
      <CardHeader className="bg-purple-50 border-b border-purple-100 mb-4">
        {/* Mobile-first layout: Stack vertically, then horizontal on md+ screens */}
        <div className="flex flex-col space-y-4 sm:space-y-3 md:flex-row md:items-center md:justify-between md:space-y-0">
          <CardTitle className={`text-xl sm:text-2xl font-semibold ${HOVER_TRANSITION}`}>
            View Message Details
          </CardTitle>
          
          {/* Mobile: Stack badge and button, Desktop: Horizontal layout */}
          <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-3">
            <StatusBadge status={isArmed ? "armed" : "disarmed"} size="md">
              {isArmed ? "Armed" : "Disarmed"}
            </StatusBadge>
            
            {isArmed ? (
              <Button 
                variant="outline" 
                onClick={handleDisarmMessage} 
                disabled={isActionLoading} 
                className="text-green-600 hover:bg-green-100 hover:text-green-700 min-h-[44px] px-4 py-2 text-sm" 
                size="sm"
              >
                <BellOff className={`h-4 w-4 mr-2 ${HOVER_TRANSITION}`} /> 
                <span className="sm:inline">Disarm</span>
              </Button>
            ) : (
              <Button 
                variant="outline" 
                onClick={handleArmMessage} 
                disabled={isActionLoading} 
                className="text-purple-600 hover:bg-purple-100 hover:text-purple-700 border-purple-200 min-h-[44px] px-4 py-2 text-sm" 
                size="sm"
              >
                <Bell className={`h-4 w-4 mr-2 ${HOVER_TRANSITION}`} /> 
                <span className="sm:inline">Arm</span>
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6 pb-3 py-0">
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
