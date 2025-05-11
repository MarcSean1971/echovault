
/**
 * Utilities for handling countdown timers
 */

/**
 * Start a countdown and get functions to control it
 */
export const startCountdown = (
  initialSeconds: number,
  onTick: (secondsLeft: number) => void,
  onComplete: () => void
) => {
  let secondsLeft = initialSeconds;
  onTick(secondsLeft);
  
  // Create interval for countdown display
  const interval = setInterval(() => {
    secondsLeft -= 1;
    onTick(secondsLeft);
    
    if (secondsLeft <= 0) {
      clearInterval(interval);
      onComplete();
    }
  }, 1000);
  
  return {
    stop: () => {
      clearInterval(interval);
    },
    getTimeLeft: () => secondsLeft
  };
};
