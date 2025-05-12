
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { MessageDeliverySettings } from "../MessageDeliverySettings";
import { DesktopTimerAlert } from "../DesktopTimerAlert";
import { Clock, Lock, Shield, MessageSquare, Mic, Video } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useIsMobile } from "@/hooks/use-mobile";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";
import { getMessageIcon } from "@/utils/messageFormatUtils";

interface StatusDeliverySectionProps {
  condition: any | null;
  isArmed: boolean;
  formatDate: (dateString: string) => string;
  renderConditionType: () => string;
  message: any;
  deadline?: Date | null;
  lastCheckIn?: string | null;
  checkInCode?: string | null;
}

export function StatusDeliverySection({
  condition,
  isArmed,
  formatDate,
  renderConditionType,
  message,
  deadline,
  lastCheckIn,
  checkInCode
}: StatusDeliverySectionProps) {
  const isMobile = useIsMobile();
  
  return (
    <Card className="overflow-hidden">
      <CardContent className={`${isMobile ? 'p-4' : 'p-6'} space-y-6`}>
        <div className="flex items-start justify-between">
          <h2 className="text-lg font-medium">Status & Delivery</h2>
          <div className={`px-2 py-1 text-xs rounded-full ${isArmed ? 'bg-destructive/10 text-destructive' : 'bg-green-100 text-green-700'}`}>
            {isArmed ? "Armed" : "Disarmed"}
          </div>
        </div>
        
        {/* Countdown Timer - only displayed when message is armed with deadline */}
        {isArmed && deadline && (
          <div className="mb-2">
            <DesktopTimerAlert deadline={deadline} isArmed={isArmed} />
          </div>
        )}
        
        <div className={`grid grid-cols-1 ${isMobile ? 'gap-6' : 'md:grid-cols-2 gap-6'}`}>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center">
              <Shield className={`h-4 w-4 mr-1.5 ${HOVER_TRANSITION}`} />
              Message Information
            </h3>
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-3 gap-1">
                <span className="font-medium">Created:</span>
                <span className="col-span-2">{formatDate(message.created_at)}</span>
              </div>
              
              {message.updated_at !== message.created_at && (
                <div className="grid grid-cols-3 gap-1">
                  <span className="font-medium">Last updated:</span>
                  <span className="col-span-2">{formatDate(message.updated_at)}</span>
                </div>
              )}
              
              {/* Message type with icon */}
              <div className="grid grid-cols-3 gap-1">
                <span className="font-medium">Format:</span>
                <span className="col-span-2 flex items-center">
                  {React.cloneElement(getMessageIcon(message.message_type), { className: `h-4 w-4 mr-1.5 ${HOVER_TRANSITION}` })}
                  {message.message_type.charAt(0).toUpperCase() + message.message_type.slice(1)} 
                </span>
              </div>
              
              {/* PIN code if available */}
              {condition?.pin_code && (
                <div className="grid grid-cols-3 gap-1">
                  <span className="font-medium">PIN code:</span>
                  <span className="col-span-2 flex items-center">
                    <Lock className={`h-4 w-4 mr-1.5 ${HOVER_TRANSITION}`} />
                    <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">{condition.pin_code}</code>
                  </span>
                </div>
              )}
            </div>
            
            {/* Check-In Information - Now separated with a separator */}
            {(lastCheckIn || checkInCode || condition?.condition_type?.includes('check_in')) && (
              <>
                <Separator className="my-3" />
                <h3 className="text-sm font-medium text-muted-foreground mb-3 mt-3 flex items-center">
                  <Clock className={`h-4 w-4 mr-1.5 ${HOVER_TRANSITION}`} />
                  Check-In Information
                </h3>
                <div className="space-y-3 text-sm">
                  {lastCheckIn && (
                    <div className="grid grid-cols-3 gap-1">
                      <span className="font-medium">Last check-in:</span>
                      <span className="col-span-2">
                        {formatDistanceToNow(new Date(lastCheckIn), { addSuffix: true })}
                      </span>
                    </div>
                  )}
                  
                  {checkInCode && (
                    <div className="grid grid-cols-3 gap-1">
                      <span className="font-medium">Check-in code:</span>
                      <span className="col-span-2 font-mono bg-muted px-1.5 py-0.5 rounded text-xs">
                        {checkInCode}
                      </span>
                    </div>
                  )}
                  
                  {condition?.condition_type?.includes('check_in') && (
                    <div className="grid grid-cols-3 gap-1">
                      <span className="font-medium">Check-in via:</span>
                      <span className="col-span-2">App, WhatsApp</span>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
          
          <div className={isMobile ? 'mt-2' : ''}>
            {condition && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center">
                  <Clock className={`h-4 w-4 mr-1.5 ${HOVER_TRANSITION}`} />
                  Delivery Settings
                </h3>
                <MessageDeliverySettings 
                  condition={condition}
                  formatDate={formatDate}
                  renderConditionType={renderConditionType}
                  showInTabs={true}
                />
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
