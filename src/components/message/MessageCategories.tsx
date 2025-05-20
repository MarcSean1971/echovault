
import React from "react";
import { Message } from "@/types/message";
import { MessageGrid } from "@/components/message/MessageGrid";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";
import { AlertTriangle, ToggleRight } from "lucide-react";

interface MessageCategoriesProps {
  panicMessages: Message[];
  regularMessages: Message[];
  isLoading: boolean;
  onDelete: (id: string) => void;
  reminderData: Record<string, {
    messageId: string;
    nextReminder: Date | null;
    formattedNextReminder: string | null;
    hasSchedule: boolean;
    upcomingReminders: string[];
  }>;
}

export function MessageCategories({ 
  panicMessages, 
  regularMessages, 
  isLoading, 
  onDelete, 
  reminderData 
}: MessageCategoriesProps) {
  return (
    <>
      {/* Display panic messages first if any exist */}
      {panicMessages.length > 0 && (
        <div className="mb-8 animate-fade-in rounded-lg">
          <h2 className="text-xl font-semibold mb-4 bg-gradient-to-r from-primary to-primary/70 text-transparent bg-clip-text flex items-center">
            <AlertTriangle className={`w-5 h-5 mr-2 text-primary ${HOVER_TRANSITION}`} />
            Emergency Panic Messages
          </h2>
          <MessageGrid 
            messages={panicMessages} 
            isLoading={isLoading} 
            onDelete={onDelete}
            reminderData={reminderData}
          />
        </div>
      )}
      
      {/* Display regular messages (Trigger Switch) - Updated text here */}
      <div className={panicMessages.length > 0 ? "mt-6 animate-fade-in" : "animate-fade-in"}>
        {panicMessages.length > 0 && (
          <h2 className="text-xl font-semibold mb-4 bg-gradient-to-r from-primary to-primary/70 text-transparent bg-clip-text flex items-center">
            <ToggleRight className={`w-5 h-5 mr-2 text-primary ${HOVER_TRANSITION}`} />
            Trigger Switch Messages
          </h2>
        )}
        <MessageGrid 
          messages={regularMessages} 
          isLoading={isLoading} 
          onDelete={onDelete}
          reminderData={reminderData}
        />
      </div>
    </>
  );
}
