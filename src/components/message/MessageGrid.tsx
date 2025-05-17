
import React, { useEffect, useState } from "react";
import { Message } from "@/types/message";
import { MessageCard } from "./MessageCard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { FileText, PlusCircle } from "lucide-react";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";
import { Spinner } from "@/components/ui/spinner";

interface MessageGridProps {
  messages: Message[];
  isLoading: boolean;
  onDelete: (id: string) => void;
  reminderData?: Record<string, {
    messageId: string;
    nextReminder: Date | null;
    formattedNextReminder: string | null;
    hasSchedule: boolean;
    upcomingReminders: string[];
  }>;
}

export function MessageGrid({ messages, isLoading, onDelete, reminderData = {} }: MessageGridProps) {
  const navigate = useNavigate();
  
  // State for virtualized rendering
  const [visibleMessages, setVisibleMessages] = useState<Message[]>([]);

  // Implement basic virtualization - only render visible items and a few extra
  useEffect(() => {
    // Simple implementation - show all messages initially, but with delayed rendering
    // for better perceived performance
    if (messages.length > 0) {
      // First render only first 3 messages immediately
      setVisibleMessages(messages.slice(0, 3));
      
      // Then render the rest after a small delay
      if (messages.length > 3) {
        const timer = setTimeout(() => {
          setVisibleMessages(messages);
        }, 100);
        return () => clearTimeout(timer);
      }
    } else {
      setVisibleMessages([]);
    }
  }, [messages]);
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Spinner size="lg" className="text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Loading your messages...</p>
      </div>
    );
  }
  
  if (messages.length === 0) {
    return (
      <Card className="text-center py-16 bg-gradient-to-b from-muted/30 to-background border border-border/50 shadow-sm rounded-lg">
        <CardContent className="flex flex-col items-center">
          <div className="mb-6 p-6 rounded-full bg-primary/5 text-primary">
            <FileText className={`h-12 w-12 ${HOVER_TRANSITION}`} />
          </div>
          <h3 className="text-xl font-medium mb-2">No messages yet</h3>
          <p className="mb-6 text-muted-foreground">Create your first message to get started</p>
          <Button 
            onClick={() => navigate("/create-message")}
            className={`${HOVER_TRANSITION} gap-2`}
            size="lg"
          >
            <PlusCircle className="h-5 w-5" />
            Create Your First Message
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
      {visibleMessages.map((message, index) => {
        // Get reminder data for this message
        const messageReminderData = reminderData[message.id];
        
        return (
          <div
            key={message.id}
            className="animate-fade-in"
            style={{ animationDelay: `${Math.min(index * 0.05, 0.5)}s` }}
          >
            <MessageCard 
              message={message} 
              onDelete={onDelete}
              reminderInfo={messageReminderData}
            />
          </div>
        );
      })}
    </div>
  );
}
