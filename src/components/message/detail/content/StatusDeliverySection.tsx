
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/ui/status-badge";
import { MessageDeliverySettings } from "../MessageDeliverySettings";

interface StatusDeliverySectionProps {
  condition: any | null;
  isArmed: boolean;
  formatDate: (dateString: string) => string;
  renderConditionType: () => string;
  message: any;
}

export function StatusDeliverySection({
  condition,
  isArmed,
  formatDate,
  renderConditionType,
  message
}: StatusDeliverySectionProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6 space-y-6">
        <div className="flex items-start justify-between">
          <h2 className="text-lg font-medium">Status & Delivery</h2>
          <StatusBadge status={isArmed ? "armed" : "disarmed"} size="default">
            {isArmed ? "Armed" : "Disarmed"}
          </StatusBadge>
        </div>
        
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
