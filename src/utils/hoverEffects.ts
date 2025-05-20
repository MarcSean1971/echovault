
/**
 * Consistent hover transition effect for UI elements
 */
export const HOVER_TRANSITION = "transition-all duration-200 ease-in-out";

/**
 * Button hover effects by style
 */
export const BUTTON_HOVER_EFFECTS = {
  default: "hover:brightness-105 hover:shadow-sm",
  outline: "hover:brightness-95 hover:shadow-inner",
  danger: "hover:brightness-110 hover:shadow-sm"
};

/**
 * Icon hover effects by type
 */
export const ICON_HOVER_EFFECTS = {
  default: "transition-all duration-200 hover:text-primary",
  muted: "transition-all duration-200 hover:text-foreground",
  primary: "transition-all duration-200 hover:text-primary/80",
  destructive: "transition-all duration-200 hover:text-destructive/80"
};

/**
 * Animation effects for confirmation actions
 */
export const CONFIRMATION_ANIMATION = {
  pulse: "animate-pulse",
  shake: "animate-shake",
  highlight: "animate-highlight"
};
