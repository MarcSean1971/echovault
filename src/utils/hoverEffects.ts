
// Core hover transition effect
export const HOVER_TRANSITION = "transition-all duration-300 ease-in-out";

// Button-specific hover effects
export const BUTTON_HOVER_EFFECTS = {
  default: "hover:shadow-md hover:translate-y-[-2px]",
  subtle: "hover:bg-opacity-90 hover:shadow-sm",
  primary: "hover:bg-primary-600 hover:shadow-md",
  destructive: "hover:bg-red-600 hover:shadow-md",
  muted: "hover:bg-muted/60",
  outline: "hover:bg-accent hover:text-accent-foreground"
};

// Icon hover effects
export const ICON_HOVER_EFFECTS = {
  default: "hover:scale-110",
  subtle: "hover:opacity-80",
  rotate: "hover:rotate-12",
  bouncy: "hover:animate-bounce",
  glow: "hover:text-primary hover:shadow-glow",
  colorShift: "hover:text-blue-500 dark:hover:text-blue-400",
  primary: "hover:text-primary",
  muted: "hover:text-muted-foreground/80"
};
