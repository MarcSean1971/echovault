
/**
 * Hook for handling time threshold conversion 
 * Provides a clean way to process hours and minutes thresholds
 */
export function useTimeThresholdHandler() {
  /**
   * Process time threshold values for database storage
   * @param hoursThreshold Hours component of the threshold
   * @param minutesThreshold Minutes component of the threshold
   * @returns The processed hours value for the database
   */
  const processTimeThreshold = (hoursThreshold: number, minutesThreshold: number) => {
    // Simply return the hours value - we don't need special handling anymore
    // as we now store minutes explicitly in the minutes_threshold column
    return hoursThreshold;
  };

  return {
    processTimeThreshold
  };
}
