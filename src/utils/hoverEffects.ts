
// Consistent hover effects to be applied throughout the app
export const HOVER_TRANSITION = "transition-all duration-200";

export const BUTTON_HOVER_EFFECTS = {
  default: "hover:bg-primary/90",
  outline: "hover:bg-accent hover:text-accent-foreground",
  ghost: "hover:bg-accent hover:text-accent-foreground",
  secondary: "hover:bg-secondary/80",
  destructive: "hover:bg-destructive/90",
  subtle: "hover:bg-white/20"
};

// Icon hover effects
export const ICON_HOVER_EFFECTS = {
  default: "transition-all duration-200 hover:scale-110",
  primary: "transition-all duration-200 hover:text-primary hover:scale-110",
  muted: "transition-all duration-200 hover:text-foreground hover:scale-105",
};

// Animation effects for confirmations
export const CONFIRMATION_ANIMATION = {
  pulse: "animate-pulse",
  shake: "animate-shake",
  highlight: "animate-highlight"
};
