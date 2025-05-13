
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { MessageDeliverySettings } from "../MessageDeliverySettings";
import { DesktopTimerAlert } from "../DesktopTimerAlert";
import { Clock, Lock, Shield, MessageSquare, Mic, Video, Mail, Bell } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useIsMobile } from "@/hooks/use-mobile";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";
import { getMessageIcon } from "@/utils/messageFormatUtils";
import { useNextReminders } from "@/hooks/useNextReminders";
import { parseReminderMinutes } from "@/utils/reminderUtils";
import { Badge } from "@/components/ui/badge";

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
  
  // Parse reminder minutes from the condition
  const reminderMinutes = parseReminderMinutes(condition?.reminder_hours);
  
  // Get upcoming reminder information
  const { upcomingReminders, hasReminders } = useNextReminders(
    deadline,
    reminderMinutes,
    refreshTrigger
  );
  
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
              
              {/* Add Last Sent Information */}
              {lastDelivered && (
                <div className="grid grid-cols-3 gap-1">
                  <span className="font-medium">Last sent:</span>
                  <span className="col-span-2">
                    {formatDate(lastDelivered)} · {formatDistanceToNow(new Date(lastDelivered), { addSuffix: true })}
                  </span>
                </div>
              )}
              
              {/* Viewed Count Information */}
              {viewCount && viewCount > 0 && (
                <div className="grid grid-cols-3 gap-1">
                  <span className="font-medium">View count:</span>
                  <span className="col-span-2">{viewCount}</span>
                </div>
              )}
            </div>
            
            {/* Check-In Information - Now with consistent styling */}
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
                      <span className="col-span-2">
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
            
            {/* Reminder Information */}
            {isArmed && (
              <>
                <Separator className="my-3" />
                <h3 className="text-sm font-medium text-muted-foreground mb-3 mt-3 flex items-center">
                  <Bell className={`h-4 w-4 mr-1.5 ${HOVER_TRANSITION}`} />
                  Reminder Information
                </h3>
                <div className="space-y-3 text-sm">
                  {hasReminders ? (
                    <>
                      <div className="grid grid-cols-3 gap-1">
                        <span className="font-medium">Status:</span>
                        <span className="col-span-2">
                          {upcomingReminders.length > 0 
                            ? `${upcomingReminders.length} upcoming reminder${upcomingReminders.length !== 1 ? 's' : ''}` 
                            : "All reminders sent"}
                        </span>
                      </div>
                      {upcomingReminders.length > 0 && (
                        <div className="grid grid-cols-3 gap-1">
                          <span className="font-medium">Next reminders:</span>
                          <div className="col-span-2 flex flex-wrap gap-1">
                            {upcomingReminders.map((reminder, index) => (
                              <Badge 
                                key={index} 
                                variant="outline" 
                                className="bg-amber-50 border-amber-200 text-amber-700"
                              >
                                {reminder.formattedText}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="grid grid-cols-3 gap-1">
                      <span className="font-medium">Status:</span>
                      <span className="col-span-2 text-muted-foreground italic">No reminders configured</span>
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
