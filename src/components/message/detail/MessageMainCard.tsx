
import React from "react";
import { Card } from "@/components/ui/card";
import { Message } from "@/types/message";

interface MessageMainCardProps {
  children: React.ReactNode;
}

export function MessageMainCard({ children }: MessageMainCardProps) {
  return (
    <Card className="overflow-hidden">
      {children}
    </Card>
  );
}
