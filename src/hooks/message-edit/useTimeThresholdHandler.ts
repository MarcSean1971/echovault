
export function useTimeThresholdHandler() {
  const processTimeThreshold = (hoursThreshold: number, minutesThreshold: number) => {
    // For database storage, when hours is 0, we no longer need to artificially inflate it
    // We can now store a 0 for hours when there are minutes
    return hoursThreshold;
  };

  return {
    processTimeThreshold
  };
}
