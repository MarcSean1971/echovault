
import React from "react";
import { Message } from "@/types/message";
import { MessageCardContainer } from "./card/MessageCardContainer";

interface MessageCardProps {
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

export const MessageCard = MessageCardContainer;
