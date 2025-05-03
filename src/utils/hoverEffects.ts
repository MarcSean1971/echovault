
/**
 * Utility file for consistent hover effects across the application
 */

// Standard transition timing for hover effects
export const HOVER_TRANSITION = "transition-all duration-200";

// Button hover effects by variant
export const BUTTON_HOVER_EFFECTS = {
  default: "hover:brightness-110 hover:shadow-sm active:scale-[0.98]",
  primary: "hover:brightness-110 hover:shadow-sm active:scale-[0.98]",
  secondary: "hover:opacity-90 hover:shadow-sm active:scale-[0.98]",
  destructive: "hover:brightness-110 hover:shadow-sm active:scale-[0.98]",
  outline: "hover:bg-accent hover:text-accent-foreground active:scale-[0.98]",
  ghost: "hover:bg-accent hover:text-accent-foreground active:scale-[0.98]",
  link: "hover:underline",
};

// Icon hover effects
export const ICON_HOVER_EFFECTS = "hover:scale-110 hover:opacity-80 transition-all duration-200";

// Card hover effects
export const CARD_HOVER_EFFECTS = "hover:shadow-md transition-shadow duration-200";
