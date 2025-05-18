
/**
 * Format time in seconds to MM:SS format
 */
export function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * Transition class used for smooth animations
 */
export const HOVER_TRANSITION = "transition-all duration-200 ease-in-out";

/**
 * Button hover effects for different button variants
 */
export const BUTTON_HOVER_EFFECTS = {
  default: "hover:shadow-md hover:scale-[1.02] active:scale-[0.99]",
  outline: "hover:bg-accent hover:text-accent-foreground hover:border-accent-foreground",
  primary: "hover:bg-primary/90 hover:shadow-lg",
  secondary: "hover:bg-secondary/90",
  ghost: "hover:bg-muted",
  destructive: "hover:bg-destructive/90",
  link: "hover:underline"
};

/**
 * Icon hover effects for different icon types
 */
export const ICON_HOVER_EFFECTS = {
  default: "transition-all duration-200 hover:scale-110",
  muted: "transition-all duration-200 hover:text-foreground",
  primary: "transition-all duration-200 hover:scale-110 hover:text-primary",
  secondary: "transition-all duration-200 hover:text-secondary",
  destructive: "transition-all duration-200 hover:text-destructive"
};

/**
 * Animation classes for confirmation/feedback effects
 */
export const CONFIRMATION_ANIMATION = {
  pulse: "animate-pulse",
  shake: "animate-[shake_0.5s_ease-in-out]",
  highlight: "animate-[highlight_1s_ease-in-out]"
};

