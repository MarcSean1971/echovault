
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Clock, AlertCircle } from "lucide-react";
import { formatDate } from "@/utils/messageHelpers";
import { MessageCondition } from "@/types/message";

interface AutoDeliveryStatusProps {
  condition: MessageCondition | null | any;
  isArmed: boolean;
  isDelivered: boolean | undefined;
  lastDelivered: string | null | undefined;
}

export function AutoDeliveryStatus({
  condition,
  isArmed,
  isDelivered,
  lastDelivered
}: AutoDeliveryStatusProps) {
  if (!condition) return null;
  
  return (
    <Card className="bg-slate-50 border-slate-200">
      <CardContent className="p-4 flex flex-col">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">Delivery Status</h3>
          {isDelivered ? (
            <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
              <Check className="h-3.5 w-3.5 mr-1" />
              Delivered
            </Badge>
          ) : isArmed ? (
            <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200">
              <Clock className="h-3.5 w-3.5 mr-1" />
              Armed
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200">
              <AlertCircle className="h-3.5 w-3.5 mr-1" />
              Not Armed
            </Badge>
          )}
        </div>
        
        {isDelivered && lastDelivered && (
          <p className="text-sm text-muted-foreground mt-2">
            Delivered on {formatDate(lastDelivered)}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
