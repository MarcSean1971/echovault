
// Consistent hover transition effect for all interactive elements
export const HOVER_TRANSITION = "transition-all duration-200";

// Icon hover effects
export const ICON_HOVER_EFFECTS = {
  default: "transition-all duration-200 group-hover:scale-110",
  subtle: "transition-all duration-200 group-hover:opacity-80",
  rotate: "transition-all duration-200 group-hover:rotate-12",
  bouncy: "transition-all duration-200 group-hover:scale-110 hover:scale-110",
  glow: "transition-all duration-200 group-hover:drop-shadow-md",
  colorShift: "transition-all duration-200 group-hover:text-primary",
  muted: "transition-all duration-200 group-hover:opacity-70",
  primary: "transition-all duration-200 group-hover:text-primary"
};

// Button hover effects
export const BUTTON_HOVER_EFFECTS = {
  default: "hover:scale-102 active:scale-98",
  outline: "hover:bg-muted/80 active:bg-muted",
  destructive: "hover:bg-destructive/90 active:bg-destructive/80"
};

// Confirmation animation effects for interactive elements
export const CONFIRMATION_ANIMATION = {
  pulse: "animate-pulse",
  shake: "animate-shake",
  highlight: "animate-highlight"
};
