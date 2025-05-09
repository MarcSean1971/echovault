
// Constants for hover effects and transitions
export const HOVER_TRANSITION = "transition-all duration-200 ease-in-out";

// Button hover effects
export const BUTTON_HOVER_EFFECTS = {
  default: "hover:shadow-sm hover:brightness-110",
  destructive: "hover:shadow-sm hover:brightness-110 hover:scale-105",
  outline: "hover:bg-accent hover:border-primary/20",
  subtle: "hover:brightness-110",
  download: "hover:translate-y-[-2px]"
};

// Icon hover effects
export const ICON_HOVER_EFFECTS = {
  default: "hover:scale-110 hover:opacity-80",
  muted: "hover:opacity-100",
  primary: "hover:text-primary hover:scale-105",
  destructive: "hover:text-destructive hover:scale-105"
};

// Add a specific keyframe animation for attention-grabbing elements
export const ATTENTION_ANIMATION = "animate-pulse";

// Confirmation animation
export const CONFIRMATION_ANIMATION = {
  pulse: "animate-pulse",
  bounce: "animate-bounce",
  shake: "animate-shake",
  highlight: "animate-highlight"
};
