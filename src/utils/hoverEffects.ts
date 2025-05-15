
// Define common hover effect transitions for consistent UI
export const HOVER_TRANSITION = "transition-all duration-200 ease-in-out";
export const HOVER_SCALE = "hover:scale-105";
export const HOVER_OPACITY = "hover:opacity-80";
export const BUTTON_HOVER = "hover:bg-opacity-90";

// Define consistent hover effects for different button variants
export const BUTTON_HOVER_EFFECTS = {
  default: "hover:shadow-md hover:translate-y-[-1px]",
  outline: "hover:bg-secondary hover:text-primary-foreground",
  destructive: "hover:bg-destructive/90",
  secondary: "hover:bg-secondary/80",
  ghost: "hover:bg-accent",
  link: "hover:underline",
};

// Define consistent hover effects for icons
export const ICON_HOVER_EFFECTS = {
  default: "transition-colors hover:text-primary",
  muted: "transition-colors hover:text-muted-foreground",
  destructive: "transition-colors hover:text-destructive",
  success: "transition-colors hover:text-green-500",
  warning: "transition-colors hover:text-amber-500",
  info: "transition-colors hover:text-blue-500",
};
