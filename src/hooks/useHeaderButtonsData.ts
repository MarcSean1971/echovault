
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { MessageCondition } from "@/types/message";
import { mapDbConditionToMessageCondition } from "@/services/messages/conditions/helpers/map-helpers";

// Define minimal types for header button data
type HeaderButtonsData = {
  hasCheckInConditions: boolean;
  hasPanicMessages: boolean;
  panicMessages: MessageCondition[];
  isLoading: boolean;
  userId: string | null;
}

// Cache key for local storage
const CACHE_KEY = 'header_buttons_data';
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes in milliseconds

/**
 * Lightweight hook specifically for header buttons data
 * Uses optimistic UI and minimal data loading
 */
export function useHeaderButtonsData(): HeaderButtonsData {
  const { userId } = useAuth();
  const [hasCheckInConditions, setHasCheckInConditions] = useState<boolean>(false);
  const [hasPanicMessages, setHasPanicMessages] = useState<boolean>(false);
  const [panicMessages, setPanicMessages] = useState<MessageCondition[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Try to load from cache immediately for instant UI
  useEffect(() => {
    // Fast path: Try to use cached data first
    try {
      const cachedData = localStorage.getItem(CACHE_KEY);
      if (cachedData) {
        const { data, timestamp } = JSON.parse(cachedData);
        // Only use cache if it's recent (within 5 minutes)
        if (Date.now() - timestamp < CACHE_EXPIRY) {
          setHasCheckInConditions(data.hasCheckInConditions);
          setHasPanicMessages(data.hasPanicMessages);
          if (data.panicMessages) {
            setPanicMessages(data.panicMessages);
          }
          setIsLoading(false);
          console.log("Used cached header buttons data");
        }
      }
    } catch (error) {
      // Silently fail if localStorage isn't available
      console.error("Error reading from cache:", error);
    }
  }, []);
  
  // Then load fresh data from database without blocking UI
  useEffect(() => {
    // Skip if no userId (not logged in)
    if (!userId) {
      setIsLoading(false);
      return;
    }
    
    const loadHeaderData = async () => {
      try {
        console.log("Loading header buttons data for user:", userId);

        // Make a single efficient database query that just counts conditions by type
        const { data, error } = await supabase
          .from('message_conditions')
          .select(`
            id,
            message_id,
            condition_type,
            active,
            hours_threshold,
            created_at,
            updated_at,
            recipients,
            recurring_pattern,
            panic_config
          `)
          .eq('active', true)
          .in('condition_type', ['no_check_in', 'recurring_check_in', 'inactivity_to_date', 'panic_trigger'])
          .order('id'); // Ordering by id for consistent results
          
        if (error) {
          console.error("Error fetching header data:", error);
          return;
        }
        
        // Process the lightweight response
        const checkInConditions = data.filter(c => 
          (c.condition_type === 'no_check_in' || 
           c.condition_type === 'recurring_check_in' || 
           c.condition_type === 'inactivity_to_date') && 
          c.active === true
        );
        
        // Use the proper mapping function for panic message conditions
        const panicMessageConditions = data
          .filter(c => c.condition_type === 'panic_trigger' && c.active === true)
          .map(c => mapDbConditionToMessageCondition(c));
        
        // Update state
        setHasCheckInConditions(checkInConditions.length > 0);
        setHasPanicMessages(panicMessageConditions.length > 0);
        setPanicMessages(panicMessageConditions);
        
        // Cache the results
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify({
            data: {
              hasCheckInConditions: checkInConditions.length > 0,
              hasPanicMessages: panicMessageConditions.length > 0,
              panicMessages: panicMessageConditions
            },
            timestamp: Date.now()
          }));
        } catch (error) {
          // Silently fail if localStorage isn't available
          console.error("Error writing to cache:", error);
        }
      } catch (error) {
        console.error("Error in header data loading:", error);
      } finally {
        setIsLoading(false);
      }
    };

    // Start loading data
    loadHeaderData();
  }, [userId]);

  return {
    hasCheckInConditions,
    hasPanicMessages,
    panicMessages,
    isLoading,
    userId
  };
}
