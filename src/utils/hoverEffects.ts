
// Consistent hover effects for buttons and icons throughout the app
export const HOVER_TRANSITION = "transition-all duration-200 ease-in-out hover:shadow-sm active:scale-[0.98]";

// Button hover effects for different variants
export const BUTTON_HOVER_EFFECTS = {
  default: "hover:bg-opacity-90",
  destructive: "hover:bg-opacity-90",
  outline: "hover:bg-muted",
  primary: "hover:bg-primary/90",
  secondary: "hover:bg-secondary/90"
};

// Icon hover effects for different contexts
export const ICON_HOVER_EFFECTS = {
  default: "transition-transform duration-200 group-hover:scale-105",
  rotate: "transition-transform duration-200 group-hover:rotate-12",
  bounce: "transition-transform duration-200 group-hover:-translate-y-0.5",
  muted: "transition-transform duration-200 group-hover:text-primary",
  primary: "transition-transform duration-200 group-hover:text-primary-dark"
};

// Animation effects for confirmations and notifications
export const CONFIRMATION_ANIMATION = {
  pulse: "animate-pulse",
  shake: "animate-[shake_0.5s_ease-in-out]",
  highlight: "animate-[highlight_1s_ease-in-out]"
};
