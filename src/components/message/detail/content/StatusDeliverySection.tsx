
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { MessageDeliverySettings } from "../MessageDeliverySettings";
import { DesktopTimerAlert } from "../DesktopTimerAlert";
import { Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

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
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6 space-y-6">
        <div className="flex items-start justify-between">
          <h2 className="text-lg font-medium">Status & Delivery</h2>
        </div>
        
        {/* Countdown Timer - only displayed when message is armed with deadline */}
        {isArmed && deadline && (
          <div className="mb-2">
            <DesktopTimerAlert deadline={deadline} isArmed={isArmed} />
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Message Information</h3>
            <div className="space-y-2 text-sm">
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
              
              <div className="grid grid-cols-3 gap-1">
                <span className="font-medium">Type:</span>
                <span className="col-span-2">{message.message_type}</span>
              </div>
              
              {/* Check-In Information */}
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
                  <span className="col-span-2 font-mono">{checkInCode}</span>
                </div>
              )}
              
              {condition?.condition_type?.includes('check_in') && (
                <div className="grid grid-cols-3 gap-1">
                  <span className="font-medium">Check-in via:</span>
                  <span className="col-span-2">App, WhatsApp</span>
                </div>
              )}
            </div>
          </div>
          
          <div>
            {condition && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Delivery Settings</h3>
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
