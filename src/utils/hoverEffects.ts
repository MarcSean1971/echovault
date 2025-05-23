
/**
 * Standard hover transition classes for consistent UI effects across the application
 */
export const HOVER_TRANSITION = "transition-all duration-200 ease-in-out";

/**
 * Button hover effect classes for different variants
 */
export const BUTTON_HOVER_EFFECTS = {
  default: "hover:bg-opacity-90 hover:shadow-sm active:translate-y-0.5",
  primary: "hover:bg-primary/90 hover:shadow-md active:translate-y-0.5",
  secondary: "hover:bg-secondary/90 hover:shadow-sm active:translate-y-0.5",
  destructive: "hover:bg-destructive/90 hover:shadow-sm active:translate-y-0.5",
  outline: "hover:bg-accent hover:text-accent-foreground active:translate-y-0.5",
  ghost: "hover:bg-accent hover:text-accent-foreground active:translate-y-0.5",
  link: "hover:underline underline-offset-4",
};

/**
 * Icon hover effect classes for different types of icons
 */
export const ICON_HOVER_EFFECTS = {
  default: "hover:opacity-70 active:scale-95",
  muted: "hover:opacity-100 text-muted-foreground hover:text-foreground active:scale-95",
  primary: "hover:opacity-80 text-primary hover:text-primary/80 active:scale-95",
  destructive: "hover:opacity-80 text-destructive hover:text-destructive/80 active:scale-95",
  accent: "hover:opacity-80 text-accent-foreground hover:text-accent/80 active:scale-95",
  link: "hover:text-primary cursor-pointer",
  button: "hover:bg-muted rounded-md p-1 active:scale-95"
};

/**
 * Animation classes for confirmation feedback
 */
export const CONFIRMATION_ANIMATION = {
  pulse: "animate-pulse",
  shake: "animate-shake",
  highlight: "animate-highlight bg-green-100 dark:bg-green-900/20",
  fadeIn: "animate-fadeIn",
  fadeOut: "animate-fadeOut"
};
