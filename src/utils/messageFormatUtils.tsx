import React from 'react';
import { MessageSquare, File, Video, Mic } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';

/**
 * Returns the appropriate icon component based on message type
 */
export const getMessageIcon = (type: string) => {
  switch (type) {
    case 'text':
      return <MessageSquare className="h-5 w-5" />;
    case 'voice':
      return <Mic className="h-5 w-5" />;
    case 'video':
      return <Video className="h-5 w-5" />;
    default:
      return <MessageSquare className="h-5 w-5" />;
  }
};

/**
 * Formats a date string into a human-readable format
 */
export const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
};

/**
 * Formats a date string into a concise format (e.g., "May 13, 2:30 PM")
 */
export const formatShortDate = (dateString: string | null): string => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
};

/**
 * Returns a relative time format (e.g., "2 hours ago")
 */
export const formatRelativeTime = (dateString: string | null): string => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    return formatDistanceToNow(date, { addSuffix: true });
  } catch (error) {
    console.error("Error formatting relative time:", error);
    return '';
  }
};

/**
 * Extracts transcription from JSON content for voice/video messages
 */
export const extractTranscription = (
  messageType: string,
  content: string | null
): string | null => {
  if (messageType !== 'text' && content) {
    try {
      const contentObj = JSON.parse(content);
      if (contentObj.transcription) {
        return contentObj.transcription;
      }
    } catch (e) {
      // Not JSON or no transcription field, use content as is
      return content;
    }
  }
  return null;
};
