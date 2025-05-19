
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
  // Determine card color based on status
  const getCardClasses = () => {
    if (isArmed) {
      return 'border-destructive/50 bg-gradient-to-br from-red-50 to-white';
    } else {
      // Ensure unarmed messages have a green border
      return 'border-green-300 bg-gradient-to-br from-green-50 to-white';
    }
  };

  return (
    <Card 
      key={messageId} 
      className={`overflow-hidden group transition-all duration-300 ${HOVER_TRANSITION} hover:shadow-md ${getCardClasses()}`}
    >
      <CardHeader className={`pb-3 ${isArmed ? 'bg-red-50/20' : 'bg-green-50/20'}`}>
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
