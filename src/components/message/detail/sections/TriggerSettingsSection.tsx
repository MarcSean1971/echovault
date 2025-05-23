import React from "react";
import { Message } from "@/types/message";
import { Settings } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { StatusDeliverySection } from "../content/status-delivery/StatusDeliverySection";
import { Skeleton } from "@/components/ui/skeleton";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";
interface TriggerSettingsSectionProps {
  message: Message;
  condition: any | null;
  formatDate: (dateString: string) => string;
  renderConditionType: () => string;
  isArmed: boolean;
  refreshTrigger?: number;
  deadline: Date | null;
  lastCheckIn?: string | null;
  checkInCode?: string | null;
  lastDelivered?: string | null;
  isDelivered?: boolean;
  viewCount?: number | null;
  isLoadingDelivery?: boolean;
}
export function TriggerSettingsSection({
  message,
  condition,
  formatDate,
  renderConditionType,
  isArmed,
  refreshTrigger,
  deadline,
  lastCheckIn,
  checkInCode,
  lastDelivered,
  isDelivered,
  viewCount,
  isLoadingDelivery
}: TriggerSettingsSectionProps) {
  const renderSectionHeader = (icon: React.ReactNode, title: string) => <div className="flex items-center space-x-2 mb-4 pb-2 border-b">
      {icon}
      <h2 className="text-lg font-medium">{title}</h2>
    </div>;
  return <Card className="overflow-hidden border border-border/50 shadow-sm">
      <CardContent className="p-6 py-0">
        {renderSectionHeader(<Settings className={`h-5 w-5 text-muted-foreground ${HOVER_TRANSITION}`} />, "Trigger Settings")}
        {!condition ? <div className="space-y-4">
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-16 w-full" />
          </div> : <StatusDeliverySection message={message} condition={condition} formatDate={formatDate} renderConditionType={renderConditionType} isArmed={isArmed} refreshTrigger={refreshTrigger} deadline={deadline} lastCheckIn={lastCheckIn} checkInCode={checkInCode} lastDelivered={lastDelivered} isDelivered={isDelivered} viewCount={viewCount} isLoadingDelivery={isLoadingDelivery} />}
      </CardContent>
    </Card>;
}