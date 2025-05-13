
/**
 * Standard transition effects for hover interactions
 * Apply to elements that should have consistent hover behavior
 */
export const HOVER_TRANSITION = "transition-all duration-200 ease-in-out";

/**
 * Hover effect configurations for different button variants
 */
export const BUTTON_HOVER_EFFECTS = {
  default: "hover:shadow-md hover:translate-y-[-2px]",
  outline: "hover:bg-accent hover:text-accent-foreground hover:border-primary",
  primary: "hover:bg-primary/90",
  secondary: "hover:bg-secondary/80",
  destructive: "hover:bg-destructive/90",
  ghost: "hover:bg-accent hover:text-accent-foreground",
  link: "hover:underline"
};

/**
 * Hover effect configurations for different icon types
 */
export const ICON_HOVER_EFFECTS = {
  default: "transition-all duration-200 ease-in-out hover:scale-110",
  muted: "transition-all duration-200 ease-in-out text-muted-foreground hover:text-foreground",
  primary: "transition-all duration-200 ease-in-out text-primary hover:text-primary-dark",
  accent: "transition-all duration-200 ease-in-out text-accent-foreground hover:text-accent-foreground/80",
  destructive: "transition-all duration-200 ease-in-out text-destructive hover:text-destructive/80"
};

/**
 * Animation classes for confirmation/feedback animations
 */
export const CONFIRMATION_ANIMATION = {
  pulse: "animate-pulse",
  shake: "animate-shake",
  highlight: "animate-highlight bg-green-100 dark:bg-green-900/30"
};
