
/**
 * Standard hover/transition effect classes for consistency across the application
 */
export const HOVER_TRANSITION = "transition-all duration-200 hover:opacity-90 active:scale-95";

/**
 * Button-specific hover effect
 */
export const BUTTON_HOVER = "hover:bg-opacity-90 active:translate-y-0.5 transition-all duration-200";

/**
 * Icon hover effect
 */
export const ICON_HOVER = "hover:scale-110 transition-transform duration-150";

/**
 * Button hover effect variants for different button types
 */
export const BUTTON_HOVER_EFFECTS = {
  default: "hover:bg-opacity-90 active:translate-y-0.5 transition-all duration-200",
  outline: "hover:bg-accent hover:text-accent-foreground active:translate-y-0.5 transition-all duration-200",
  ghost: "hover:bg-accent hover:text-accent-foreground active:translate-y-0.5 transition-all duration-200",
  link: "hover:underline active:translate-y-0.5 transition-all duration-200",
  destructive: "hover:bg-destructive/90 active:translate-y-0.5 transition-all duration-200",
  primary: "hover:bg-primary/90 active:translate-y-0.5 transition-all duration-200",
  secondary: "hover:bg-secondary/90 active:translate-y-0.5 transition-all duration-200"
};

/**
 * Icon hover effect variants for different icon types
 */
export const ICON_HOVER_EFFECTS = {
  default: "hover:scale-110 transition-transform duration-150",
  muted: "hover:scale-110 hover:text-foreground transition-all duration-150",
  primary: "hover:scale-110 hover:text-primary transition-all duration-150",
  accent: "hover:scale-110 hover:text-accent transition-all duration-150",
  destructive: "hover:scale-110 hover:text-destructive transition-all duration-150"
};

/**
 * Animation effects for confirmation actions
 */
export const CONFIRMATION_ANIMATION = {
  pulse: "animate-pulse",
  shake: "animate-[shake_0.5s_ease-in-out]",
  highlight: "animate-[highlight_1s_ease-in-out]"
};
