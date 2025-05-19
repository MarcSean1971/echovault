
import React from "react";
import { Separator } from "@/components/ui/separator";
import { Shield, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";

interface MessageInfoSectionProps {
  message: any;
  formatDate: (dateString: string) => string;
  lastDelivered?: string | null;
  viewCount?: number | null;
  lastCheckIn?: string | null;
  checkInCode?: string | null;
  condition?: any;
}

export function MessageInfoSection({
  message,
  formatDate,
  lastDelivered,
  viewCount,
  lastCheckIn,
  checkInCode,
  condition
}: MessageInfoSectionProps) {
  return (
    <div>
      <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center">
        <Shield className={`h-4 w-4 mr-1.5 ${HOVER_TRANSITION}`} />
        Message Information
      </h3>
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
        {viewCount !== undefined && viewCount !== null && viewCount > 0 && (
          <div className="grid grid-cols-3 gap-1">
            <span className="font-medium">View count:</span>
            <span className="col-span-2">{viewCount}</span>
          </div>
        )}
      </div>
      
      {/* Check-In Information */}
      {(lastCheckIn || checkInCode || condition?.condition_type?.includes('check_in')) && (
        <>
          <Separator className="my-2" />
          <h3 className="text-sm font-medium text-muted-foreground mb-2 mt-2 flex items-center">
            <Clock className={`h-4 w-4 mr-1.5 ${HOVER_TRANSITION}`} />
            Check-In Information
          </h3>
          <div className="space-y-2 text-sm">
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
    </div>
  );
}
