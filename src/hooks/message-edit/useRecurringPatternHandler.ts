
export function useRecurringPatternHandler() {
  const processRecurringPattern = (deliveryOption: string, recurringPattern: any) => {
    // Log delivery option and recurring pattern for debugging
    console.log("Delivery option:", deliveryOption);
    console.log("Recurring pattern before processing:", recurringPattern);
    
    // Ensure recurring pattern is null if "once" delivery is selected
    let finalRecurringPattern = recurringPattern;
    if (deliveryOption === "once") {
      console.log("Once-off delivery selected, clearing recurring pattern");
      finalRecurringPattern = null;
    } else if (deliveryOption === "recurring" && !finalRecurringPattern) {
      // If recurring is selected but no pattern, create a default one
      finalRecurringPattern = { type: "daily", interval: 1 };
      console.log("Created default recurring pattern:", finalRecurringPattern);
    }
    
    console.log("Final recurring pattern to save:", finalRecurringPattern);
    return finalRecurringPattern;
  };

  return {
    processRecurringPattern
  };
}
