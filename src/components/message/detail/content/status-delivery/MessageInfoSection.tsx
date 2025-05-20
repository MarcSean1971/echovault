
import React from "react";
import { Shield, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";
import { AccordionSection } from "@/components/message/detail/AccordionSection";

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
    <>
      <AccordionSection
        title={
          <div className="flex items-center">
            <Shield className={`h-4 w-4 mr-1.5 ${HOVER_TRANSITION}`} />
            Message Information
          </div>
        }
        defaultOpen={false}
      >
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
      </AccordionSection>
      
      {/* Check-In Information */}
      {(lastCheckIn || checkInCode || condition?.condition_type?.includes('check_in')) && (
        <AccordionSection
          title={
            <div className="flex items-center">
              <Clock className={`h-4 w-4 mr-1.5 ${HOVER_TRANSITION}`} />
              Check-In Information
            </div>
          }
          defaultOpen={false}
          value="check-in"
        >
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
        </AccordionSection>
      )}
    </>
  );
}
