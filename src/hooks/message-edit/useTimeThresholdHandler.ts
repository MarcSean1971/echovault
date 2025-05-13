
export function useTimeThresholdHandler() {
  const processTimeThreshold = (hoursThreshold: number, minutesThreshold: number) => {
    let finalHoursThreshold = hoursThreshold;
    
    if (finalHoursThreshold === 0 && minutesThreshold > 0) {
      console.log("Converting minutes to hours to satisfy database constraint");
      // Convert minutes to hours with one decimal point precision
      finalHoursThreshold = parseFloat((minutesThreshold / 60).toFixed(1));
      
      // If it's still 0 after rounding, set it to the minimum valid value (0.1)
      if (finalHoursThreshold < 0.1) {
        finalHoursThreshold = 0.1;
      }
      
      console.log(`Converted ${minutesThreshold} minutes to ${finalHoursThreshold} hours`);
    }
    
    return finalHoursThreshold;
  };

  return {
    processTimeThreshold
  };
}
