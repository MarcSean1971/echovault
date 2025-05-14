
/**
 * Common transition class for consistent hover animations
 */
export const HOVER_TRANSITION = "transition-all duration-200 ease-in-out";

/**
 * Common button hover effect classes
 */
export const BUTTON_HOVER_EFFECTS = {
  default: "hover:bg-primary/90 hover:shadow-inner active:scale-[0.98]",
  danger: "hover:bg-destructive/90 hover:shadow-inner active:scale-[0.98]",
  outline: "hover:bg-accent hover:text-accent-foreground hover:border-primary/30 active:scale-[0.98]",
  ghost: "hover:bg-accent hover:text-accent-foreground active:scale-[0.98]",
  link: "hover:underline",
  secondary: "hover:bg-secondary/80 hover:shadow-inner active:scale-[0.98]",
};

/**
 * Icon hover effect classes for consistent styling
 */
export const ICON_HOVER_EFFECTS = {
  default: "group-hover:scale-110 transition-transform",
  primary: "group-hover:scale-110 group-hover:text-primary transition-all",
  destructive: "group-hover:scale-110 group-hover:text-destructive transition-all", 
  success: "group-hover:scale-110 group-hover:text-green-600 transition-all",
  warning: "group-hover:scale-110 group-hover:text-amber-600 transition-all",
  info: "group-hover:scale-110 group-hover:text-blue-600 transition-all",
  muted: "group-hover:scale-110 group-hover:text-muted-foreground transition-all",
  large: "group-hover:scale-125 transition-transform",
};

/**
 * Card hover effect classes for consistent styling
 */
export const CARD_HOVER_EFFECTS = {
  default: "hover:shadow-md hover:border-primary/30 hover:-translate-y-0.5",
  highlight: "hover:shadow-md hover:border-primary hover:bg-primary/5",
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
