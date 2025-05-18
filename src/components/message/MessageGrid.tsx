
import React, { useEffect, useState, useMemo } from "react";
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
  const [initialRenderComplete, setInitialRenderComplete] = useState(false);
  const [loadMoreCount, setLoadMoreCount] = useState(15); // Initial batch size

  // Implement efficient virtualized rendering with progressive loading
  const messageChunks = useMemo(() => {
    // First chunk is what we show immediately (visible viewport)
    const initialChunk = messages.slice(0, 6); 
    
    // Second chunk is loaded shortly after
    const secondChunk = messages.slice(6, loadMoreCount);
    
    // Remaining messages
    const remainingMessages = messages.slice(loadMoreCount);
    
    return {
      initialChunk,
      secondChunk,
      remainingMessages,
      totalRemaining: remainingMessages.length
    };
  }, [messages, loadMoreCount]);

  // Handle initial loading of visible messages with staggered rendering
  useEffect(() => {
    if (!messages || messages.length === 0 || isLoading) {
      setVisibleMessages([]);
      setInitialRenderComplete(false);
      return;
    }
    
    // First render the initial chunk immediately (fills typical first viewport)
    setVisibleMessages(messageChunks.initialChunk);
    
    // Then render the second batch after a small delay
    if (messageChunks.secondChunk.length > 0) {
      const timer = setTimeout(() => {
        setVisibleMessages([...messageChunks.initialChunk, ...messageChunks.secondChunk]);
        setInitialRenderComplete(true);
      }, 50);
      return () => clearTimeout(timer);
    } else {
      setInitialRenderComplete(true);
    }
  }, [messageChunks.initialChunk, messageChunks.secondChunk, messages, isLoading]);
  
  // Handle loading more messages when button is clicked
  const handleLoadMore = () => {
    const newCount = Math.min(loadMoreCount + 15, messages.length);
    setLoadMoreCount(newCount);
    setVisibleMessages(messages.slice(0, newCount));
  };
  
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
    <div className="space-y-6">
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
      
      {/* "Load More" button if there are remaining messages */}
      {initialRenderComplete && messageChunks.totalRemaining > 0 && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            onClick={handleLoadMore}
            className="text-muted-foreground"
          >
            Load {Math.min(messageChunks.totalRemaining, 15)} more messages
          </Button>
        </div>
      )}
    </div>
  );
}
