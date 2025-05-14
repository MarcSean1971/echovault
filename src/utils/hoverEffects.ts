
/**
 * Utility file for consistent hover effects throughout the application
 */

/**
 * Transition classes for smooth hover effects
 */
export const HOVER_TRANSITION = "transition-all duration-200 ease-in-out";

/**
 * Button hover effects for different states
 */
export const BUTTON_HOVER_EFFECTS = {
  default: "hover:bg-primary/90 hover:shadow-md active:scale-95",
  destructive: "hover:bg-destructive/90 hover:shadow-md active:scale-95",
  outline: "hover:bg-accent hover:text-accent-foreground active:scale-95",
  secondary: "hover:bg-secondary/80 active:scale-95",
  ghost: "hover:bg-accent hover:text-accent-foreground active:scale-95",
  link: "hover:underline underline-offset-4",
};

/**
 * Icon hover effects for different states
 * Used for consistent hover effects on icons
 */
export const ICON_HOVER_EFFECTS = {
  default: "hover:scale-110 cursor-pointer",
  muted: "hover:text-foreground hover:scale-110 cursor-pointer",
  primary: "hover:text-primary hover:scale-110 cursor-pointer",
  accent: "hover:text-accent-foreground hover:scale-110 cursor-pointer",
  destructive: "hover:text-destructive hover:scale-110 cursor-pointer",
  success: "hover:text-green-700 hover:scale-110 cursor-pointer", // Added success
  info: "hover:text-blue-700 hover:scale-110 cursor-pointer", // Added info
  warning: "hover:text-amber-700 hover:scale-110 cursor-pointer", // Added warning
};

/**
 * Card hover effects
 */
export const CARD_HOVER_EFFECTS = {
  default: "hover:shadow-md hover:border-primary/20",
  subtle: "hover:shadow-sm hover:bg-accent/50",
  interactive: "hover:shadow-md hover:bg-accent/50 hover:scale-[1.01] cursor-pointer",
};

/**
 * Animation classes for confirmation/feedback animations
 */
export const CONFIRMATION_ANIMATION = {
  pulse: "animate-pulse",
  shake: "animate-[shake_0.5s_ease-in-out]",
  highlight: "animate-[highlight_1s_ease-in-out] bg-green-100 dark:bg-green-900/30"
};
