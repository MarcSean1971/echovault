
/**
 * Utilities for fetching reminder data from the database
 * Optimized to use our new indexes and with improved caching
 */
import { supabase } from "@/integrations/supabase/client";

// Simple cache for reminder data to reduce unnecessary fetches
const reminderCache: {
  [key: string]: {
    data: Record<string, Array<{ 
      scheduledAt: Date, 
      reminderType: string,
      priority?: string 
    }>>,
    timestamp: number
  }
} = {};

// Cache TTL - 30 seconds
const CACHE_TTL = 30 * 1000;

/**
 * Fetches upcoming reminders for multiple messages in a single batch query
 * This is an optimized version that eliminates N+1 query problems and uses caching
 */
export async function getUpcomingRemindersForMultipleMessages(
  messageIds: string[]
): Promise<Record<string, Array<{ 
  scheduledAt: Date, 
  reminderType: string,
  priority?: string
}>>> {
  // Return early if no message IDs provided
  if (!messageIds || messageIds.length === 0) {
    return {};
  }
  
  // Generate cache key based on sorted message IDs
  const cacheKey = [...messageIds].sort().join('|');
  
  // Check cache first
  const now = Date.now();
  const cachedData = reminderCache[cacheKey];
  if (cachedData && (now - cachedData.timestamp < CACHE_TTL)) {
    console.log(`[REMINDER-FETCHER] Using cached reminder data for ${messageIds.length} messages`);
    return cachedData.data;
  }
  
  try {
    console.log(`[REMINDER-FETCHER] Fetching reminders for ${messageIds.length} messages in batch`);
    
    // Query reminders for all message IDs in a single request
    // Use our new index on message_id+status for better performance
    const { data, error } = await supabase
      .from('reminder_schedule')
      .select('*')
      .in('message_id', messageIds)
      .eq('status', 'pending') // This uses our new compound index
      .order('scheduled_at', { ascending: true });
    
    if (error) {
      console.error('[REMINDER-FETCHER] Error fetching batch reminders:', error);
      throw error;
    }
    
    // Group reminders by message ID
    const remindersByMessage: Record<string, Array<{
      scheduledAt: Date,
      reminderType: string,
      priority?: string
    }>> = {};
    
    // Initialize empty arrays for all message IDs
    messageIds.forEach(id => {
      remindersByMessage[id] = [];
    });
    
    // Process and group reminders
    if (data && data.length > 0) {
      data.forEach(reminder => {
        const messageId = reminder.message_id;
        
        try {
          // Convert to the expected format with proper Date object
          const scheduledAt = new Date(reminder.scheduled_at);
          
          // Only add valid dates
          if (!isNaN(scheduledAt.getTime())) {
            const formattedReminder = {
              scheduledAt,
              reminderType: reminder.reminder_type,
              priority: reminder.delivery_priority
            };
            
            // Add to the appropriate message's array
            if (remindersByMessage[messageId]) {
              remindersByMessage[messageId].push(formattedReminder);
            }
          }
        } catch (e) {
          console.error('[REMINDER-FETCHER] Error processing reminder date:', e);
          // Skip this reminder if the date is invalid
        }
      });
      
      // Sort each message's reminders by scheduled_at
      Object.keys(remindersByMessage).forEach(messageId => {
        remindersByMessage[messageId].sort(
          (a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime()
        );
      });
    }
    
    console.log(`[REMINDER-FETCHER] Found reminders for ${
      Object.keys(remindersByMessage).filter(id => 
        remindersByMessage[id].length > 0
      ).length
    } out of ${messageIds.length} messages`);
    
    // Update the cache
    reminderCache[cacheKey] = {
      data: remindersByMessage,
      timestamp: now
    };
    
    return remindersByMessage;
  } catch (error) {
    console.error('[REMINDER-FETCHER] Error in getUpcomingRemindersForMultipleMessages:', error);
    // Return empty object on error
    return {};
  }
}

/**
 * Invalidate the reminder cache for specific message IDs or all messages
 */
export function invalidateReminderCache(messageIds?: string[]) {
  if (messageIds && messageIds.length > 0) {
    // Generate all possible cache keys containing these message IDs and invalidate them
    Object.keys(reminderCache).forEach(key => {
      const keyMessageIds = key.split('|');
      if (messageIds.some(id => keyMessageIds.includes(id))) {
        delete reminderCache[key];
      }
    });
    console.log(`[REMINDER-FETCHER] Invalidated reminder cache for specific messages`);
  } else {
    // Clear the entire cache
    Object.keys(reminderCache).forEach(key => {
      delete reminderCache[key];
    });
    console.log(`[REMINDER-FETCHER] Invalidated all reminder cache entries`);
  }
}

// Listen for conditions-updated events to invalidate cache
if (typeof window !== 'undefined') {
  window.addEventListener('conditions-updated', (event) => {
    if (event instanceof CustomEvent) {
      const detail = event.detail || {};
      if (detail.messageId) {
        invalidateReminderCache([detail.messageId]);
      } else {
        invalidateReminderCache();
      }
    }
  });
}
