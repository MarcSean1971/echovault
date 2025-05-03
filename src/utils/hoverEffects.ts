
// Define transition classes for hover effects
export const HOVER_TRANSITION = "transition-all duration-200 ease-in-out";

// Different button hover effect styles
export const BUTTON_HOVER_EFFECTS = {
  default: "hover:bg-primary/90 hover:shadow-sm active:translate-y-0.5",
  danger: "hover:bg-destructive/90 hover:shadow-sm active:translate-y-0.5",
  outline: "hover:bg-accent hover:text-accent-foreground active:translate-y-0.5",
  ghost: "hover:bg-accent/50 hover:text-accent-foreground active:translate-y-0.5",
  link: "hover:underline",
  icon: "hover:bg-accent/20 hover:text-accent-foreground active:translate-y-0.5"
};

// Icon hover effects
export const ICON_HOVER_EFFECTS = {
  default: "hover:text-primary cursor-pointer",
  accent: "hover:text-accent cursor-pointer",
  destructive: "hover:text-destructive cursor-pointer",
  muted: "hover:text-foreground cursor-pointer"
};
