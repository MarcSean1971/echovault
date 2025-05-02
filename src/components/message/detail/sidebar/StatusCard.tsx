
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarDays, Info } from "lucide-react";
import { Message } from "@/types/message";

interface StatusCardProps {
  isArmed: boolean;
  messageType?: string;
  conditionType: string;
  createdAt: string;
  isActionLoading: boolean;
  onDisarm?: () => Promise<void>;
  onArm?: () => Promise<void>;
  message?: Message;
}

export function StatusCard({
  isArmed,
  messageType,
  conditionType,
  createdAt,
  isActionLoading,
  onDisarm,
  onArm,
  message
}: StatusCardProps) {
  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-medium">Status</h3>
          <div className={`w-3 h-3 rounded-full ${isArmed ? 'bg-destructive' : 'bg-green-500'}`}></div>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center text-sm">
            <CalendarDays className="h-4 w-4 mr-2 text-muted-foreground" />
            <span className="font-medium mr-1">Created:</span> 
            {createdAt}
          </div>
          
          {message && message.updated_at !== message.created_at && (
            <div className="flex items-center text-sm">
              <CalendarDays className="h-4 w-4 mr-2 text-muted-foreground" />
              <span className="font-medium mr-1">Updated:</span> 
              {message.updated_at}
            </div>
          )}
          
          <div className="flex items-center text-sm">
            <Info className="h-4 w-4 mr-2 text-muted-foreground" />
            <span className="font-medium mr-1">Type:</span> 
            {conditionType}
          </div>
        </div>
        
        {(onArm || onDisarm) && (
          <>
            <div className="h-px bg-border w-full"></div>
            {isArmed ? (
              <Button
                variant="outline"
                onClick={onDisarm}
                disabled={isActionLoading}
                className="w-full text-green-600 border-green-600 hover:bg-green-50 hover:text-green-700 hover:border-green-700"
              >
                Disarm Message
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={onArm}
                disabled={isActionLoading}
                className="w-full text-destructive border-destructive hover:bg-destructive/10 hover:text-destructive hover:border-destructive/80"
              >
                Arm Message
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
