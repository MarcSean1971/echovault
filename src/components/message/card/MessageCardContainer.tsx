
import React, { memo } from "react";
import { Message } from "@/types/message";
import { MessageCardInner } from "./MessageCardInner";

interface MessageCardContainerProps {
  message: Message;
  onDelete: (id: string) => void;
  reminderInfo?: {
    messageId: string;
    nextReminder: Date | null;
    formattedNextReminder: string | null;
    hasSchedule: boolean;
    upcomingReminders: string[];
  };
}

// FIXED: Much less restrictive memo function that prioritizes check-in data updates
export const MessageCardContainer = memo(MessageCardInner, (prevProps, nextProps) => {
  // Always re-render if message IDs are different
  if (prevProps.message.id !== nextProps.message.id) return false;
  
  // Always re-render if message content has changed
  if (prevProps.message.updated_at !== nextProps.message.updated_at) return false;
  
  // Check if reminder info has changed substantially
  const prevReminder = prevProps.reminderInfo?.formattedNextReminder;
  const nextReminder = nextProps.reminderInfo?.formattedNextReminder;
  
  // Re-render if reminders have changed
  if (prevReminder !== nextReminder) return false;
  
  // Check if reminder count has changed
  if ((prevProps.reminderInfo?.upcomingReminders?.length || 0) !== 
      (nextProps.reminderInfo?.upcomingReminders?.length || 0)) return false;

  // CRITICAL FIX: Always re-render to ensure check-in updates are shown
  // The component will handle its own optimization through internal memoization
  // This ensures that when WhatsApp check-ins occur, the UI updates immediately
  return false; // Always allow re-render for immediate check-in updates
});
