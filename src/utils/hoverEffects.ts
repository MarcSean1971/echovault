
// Common hover transition classes
export const HOVER_TRANSITION = "transition-all duration-200";

// Hover effects for different button variants
export const BUTTON_HOVER_EFFECTS = {
  default: "hover:scale-105 hover:shadow-md",
  outline: "hover:bg-accent hover:text-accent-foreground hover:scale-105",
  ghost: "hover:bg-accent/50 hover:text-accent-foreground",
  destructive: "hover:bg-destructive/90 hover:scale-105",
  link: "hover:underline"
};

// Hover effects for icons - now defined as an object with different icon types
export const ICON_HOVER_EFFECTS = {
  default: "hover:scale-110 text-muted-foreground hover:text-foreground",
  muted: "hover:scale-110 text-muted-foreground hover:text-muted-foreground/80",
  primary: "hover:scale-110 text-primary hover:text-primary/80",
  destructive: "hover:scale-110 text-destructive hover:text-destructive/80"
};

// Hover effects for media controls
export const MEDIA_CONTROL_HOVER = "hover:bg-black/20 active:bg-black/30";

// Confirmation animation effects
export const CONFIRMATION_ANIMATION = {
  pulse: "animate-pulse",
  shake: "animate-[wiggle_0.5s_ease-in-out]",
  highlight: "animate-[highlight_1s_ease-in-out]"
};
