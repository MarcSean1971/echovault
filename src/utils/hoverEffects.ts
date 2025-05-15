
// Define standard hover transition styles
export const HOVER_TRANSITION = "transition-all duration-200 ease-in-out hover:scale-105";

/**
 * Button hover effects for different button variants
 */
export const BUTTON_HOVER_EFFECTS = {
  default: "hover:shadow-md active:scale-95",
  primary: "hover:opacity-90 hover:shadow-md active:scale-95",
  outline: "hover:bg-muted/40 hover:border-primary/50 active:scale-95",
  ghost: "hover:bg-muted/30 active:scale-95",
  link: "hover:underline",
  secondary: "hover:bg-secondary/80 active:scale-95",
  destructive: "hover:bg-destructive/90 active:scale-95"
};

/**
 * Icon hover effects for different icon types
 */
export const ICON_HOVER_EFFECTS = {
  default: "hover:scale-110 transition-transform duration-200",
  muted: "hover:text-foreground/80 transition-colors duration-200",
  primary: "hover:text-primary transition-colors duration-200",
  secondary: "hover:text-secondary transition-colors duration-200",
  accent: "hover:text-accent transition-colors duration-200"
};

/**
 * Animation classes for confirmation actions
 */
export const CONFIRMATION_ANIMATION = {
  pulse: "animate-pulse",
  shake: "animate-[shake_0.5s_ease-in-out]",
  highlight: "animate-[highlight_1s_ease-in-out]",
  bounce: "animate-[bounce_0.5s_ease-in-out]"
};
