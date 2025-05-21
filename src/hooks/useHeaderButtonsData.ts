
import { useState, useEffect, useRef } from "react";
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
 * Now properly listens to conditions-updated events
 */
export function useHeaderButtonsData(): HeaderButtonsData {
  const { userId } = useAuth();
  const [hasCheckInConditions, setHasCheckInConditions] = useState<boolean>(false);
  const [hasPanicMessages, setHasPanicMessages] = useState<boolean>(false);
  const [panicMessages, setPanicMessages] = useState<MessageCondition[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const loadingRef = useRef<boolean>(false);
  
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
  
  // Function to load header data from database with debouncing
  const loadHeaderData = async (force: boolean = false) => {
    // Skip if no userId (not logged in)
    if (!userId) {
      setIsLoading(false);
      return;
    }
    
    // Prevent concurrent loads
    if (loadingRef.current && !force) {
      return;
    }
    
    try {
      setIsLoading(true);
      loadingRef.current = true;
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
      loadingRef.current = false;
    }
  };

  // Then load fresh data from database without blocking UI
  useEffect(() => {
    // Initial data load when component mounts or userId changes
    loadHeaderData();
    
    // Using a debounce for conditions-updated events to prevent multiple rapid updates
    let debounceTimer: number | null = null;
    
    // Listen for all relevant events that should trigger a refresh
    const handleConditionsUpdated = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log("Header buttons detected conditions-updated event:", customEvent.detail);
      
      // Clear previous timeout if it exists
      if (debounceTimer) {
        window.clearTimeout(debounceTimer);
        debounceTimer = null;
      }
      
      // Set a new timeout
      debounceTimer = window.setTimeout(() => {
        // Invalidate cache
        try {
          localStorage.removeItem(CACHE_KEY);
        } catch (error) {
          console.error("Error clearing cache:", error);
        }
        
        // Reload header data
        loadHeaderData(true);
      }, 300);
    };
    
    // Add event listener for condition updates
    window.addEventListener('conditions-updated', handleConditionsUpdated);
    
    // Clean up event listener and timeout on unmount
    return () => {
      window.removeEventListener('conditions-updated', handleConditionsUpdated);
      if (debounceTimer) {
        window.clearTimeout(debounceTimer);
      }
    };
  }, [userId]);

  return {
    hasCheckInConditions,
    hasPanicMessages,
    panicMessages,
    isLoading,
    userId
  };
}
