
import React from "react";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";

interface MessageCardWrapperProps {
  isArmed: boolean;
  messageId: string;
  children: {
    header: React.ReactNode;
    content: React.ReactNode;
    footer: React.ReactNode;
  };
}

export function MessageCardWrapper({
  isArmed,
  messageId,
  children
}: MessageCardWrapperProps) {
  // Determine card color based on status - Enhanced shading
  const getCardClasses = () => {
    if (isArmed) {
      return 'border-destructive/70 bg-gradient-to-br from-red-100 to-white shadow-sm shadow-red-100/50';
    } else {
      // Enhanced green shading for unarmed messages
      return 'border-green-400 bg-gradient-to-br from-green-100 to-white shadow-sm shadow-green-100/50';
    }
  };

  return (
    <Card 
      key={messageId} 
      className={`overflow-hidden group transition-all duration-300 ${HOVER_TRANSITION} hover:shadow-md ${getCardClasses()}`}
    >
      <CardHeader className={`pb-3 ${isArmed ? 'bg-red-100/30' : 'bg-green-100/30'}`}>
        {children.header}
      </CardHeader>
      <CardContent>
        {children.content}
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-4 bg-gradient-to-t from-muted/20 to-transparent">
        {children.footer}
      </CardFooter>
    </Card>
  );
}
