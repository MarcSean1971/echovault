
import React from "react";
import { Message } from "@/types/message";
import { MessageGrid } from "@/components/message/MessageGrid";

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
          <h2 className="text-xl font-semibold mb-4 text-red-500 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 mr-2">
              <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z" clipRule="evenodd" />
            </svg>
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
      
      {/* Display regular messages (deadman's switch) */}
      <div className={panicMessages.length > 0 ? "mt-6 animate-fade-in" : "animate-fade-in"}>
        {panicMessages.length > 0 && (
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 mr-2">
              <path d="M12 .75a8.25 8.25 0 00-4.135 15.39c.686.398 1.115 1.008 1.134 1.623a.75.75 0 00.577.706c.352.083.71.148 1.074.195.323.041.6-.218.6-.544v-4.661a6.75 6.75 0 1113.5 0v4.661c0 .326.277.585.6.544.364-.047.722-.112 1.074-.195a.75.75 0 00.577-.706c.02-.615.448-1.225 1.134-1.623A8.25 8.25 0 0012 .75z" />
              <path fillRule="evenodd" d="M9.75 15.75a.75.75 0 01.75-.75h3a.75.75 0 010 1.5h-3a.75.75 0 01-.75-.75z" clipRule="evenodd" />
            </svg>
            Deadman's Switch Messages
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
