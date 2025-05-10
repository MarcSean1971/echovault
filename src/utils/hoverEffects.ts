
// Define consistent hover transition effect to use throughout the app
export const HOVER_TRANSITION = "transition-all duration-200 ease-in-out hover:scale-[1.01] hover:shadow-sm";

// Button hover effect variations
export const BUTTON_HOVER_EFFECTS = {
  default: "hover:bg-primary/90",
  outline: "hover:bg-accent hover:text-accent-foreground",
  secondary: "hover:bg-secondary/80",
  destructive: "hover:bg-destructive/90",
  ghost: "hover:bg-muted/80",
  link: "hover:underline",
  primary: "hover:bg-primary/90",
  success: "hover:bg-green-600",
  warning: "hover:bg-amber-600",
  danger: "hover:bg-red-600",
  info: "hover:bg-blue-600"
};

// Icon hover effect variations
export const ICON_HOVER_EFFECTS = {
  default: "hover:text-primary transition-colors duration-200",
  muted: "hover:text-foreground transition-colors duration-200",
  primary: "hover:text-primary/80 transition-colors duration-200",
  destructive: "hover:text-destructive/80 transition-colors duration-200",
  success: "hover:text-green-600 transition-colors duration-200",
  warning: "hover:text-amber-600 transition-colors duration-200"
};

// Animation effects for confirmations
export const CONFIRMATION_ANIMATION = {
  pulse: "animate-pulse",
  shake: "animate-shake",
  highlight: "animate-highlight",
  fadeIn: "animate-fadeIn",
  fadeOut: "animate-fadeOut"
};
