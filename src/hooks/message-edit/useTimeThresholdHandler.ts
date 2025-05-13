
export function useTimeThresholdHandler() {
  const processTimeThreshold = (hoursThreshold: number, minutesThreshold: number) => {
    let finalHoursThreshold = hoursThreshold;
    
    if (finalHoursThreshold === 0 && minutesThreshold > 0) {
      console.log("Converting minutes to hours to satisfy database constraint");
      // Convert minutes to hours with one decimal point precision for display
      const rawHoursValue = parseFloat((minutesThreshold / 60).toFixed(1));
      
      // For database storage, we need an integer (minutes are stored separately)
      // Using Math.ceil to ensure we don't round down to 0 which would violate constraints
      finalHoursThreshold = Math.ceil(rawHoursValue);
      
      console.log(`Converted ${minutesThreshold} minutes to ${rawHoursValue} hours (stored as ${finalHoursThreshold})`);
    }
    
    return finalHoursThreshold;
  };

  return {
    processTimeThreshold
  };
}
