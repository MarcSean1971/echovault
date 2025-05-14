
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";
import { DesktopTimerAlert } from "../../DesktopTimerAlert";
import { MessageInfoSection } from "./MessageInfoSection";
import { ReminderSection } from "./ReminderSection";
import { DeliverySettingsSection } from "./DeliverySettingsSection";

interface StatusDeliverySectionProps {
  condition: any | null;
  isArmed: boolean;
  formatDate: (dateString: string) => string;
  renderConditionType: () => string;
  message: any;
  deadline?: Date | null;
  lastCheckIn?: string | null;
  checkInCode?: string | null;
  lastDelivered?: string | null;
  isDelivered?: boolean;
  viewCount?: number | null;
  isLoadingDelivery?: boolean;
  refreshTrigger?: number;
}

export function StatusDeliverySection({
  condition,
  isArmed,
  formatDate,
  renderConditionType,
  message,
  deadline,
  lastCheckIn,
  checkInCode,
  lastDelivered,
  isDelivered,
  viewCount,
  isLoadingDelivery,
  refreshTrigger
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
        
        {/* Countdown Timer - now passing refreshTrigger prop */}
        {isArmed && deadline && (
          <div className="mb-2">
            <DesktopTimerAlert deadline={deadline} isArmed={isArmed} refreshTrigger={refreshTrigger} />
          </div>
        )}
        
        <div className={`grid grid-cols-1 ${isMobile ? 'gap-6' : 'md:grid-cols-2 gap-6'}`}>
          <div>
            {/* Message Information Section */}
            <MessageInfoSection
              message={message}
              formatDate={formatDate}
              lastDelivered={lastDelivered}
              viewCount={viewCount}
              lastCheckIn={lastCheckIn}
              checkInCode={checkInCode}
              condition={condition}
            />
            
            {/* Reminder Information */}
            <ReminderSection
              condition={condition}
              deadline={deadline}
              isArmed={isArmed}
              refreshTrigger={refreshTrigger}
            />
          </div>
          
          <div className={isMobile ? 'mt-2' : ''}>
            {/* Delivery Settings */}
            <DeliverySettingsSection
              condition={condition}
              formatDate={formatDate}
              renderConditionType={renderConditionType}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
