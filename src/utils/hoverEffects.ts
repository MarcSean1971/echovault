
// Transition timing for hover effects
export const HOVER_TRANSITION = "transition-all duration-200 ease-in-out";

// Button hover effects by variant
export const BUTTON_HOVER_EFFECTS = {
  default: "hover:shadow-md hover:transform hover:translate-y-[-2px]",
  destructive: "hover:shadow-md hover:transform hover:translate-y-[-2px] hover:brightness-95",
  primary: "hover:shadow-md hover:transform hover:translate-y-[-2px] hover:brightness-95",
  secondary: "hover:shadow-md hover:transform hover:translate-y-[-2px] hover:brightness-95",
  outline: "hover:shadow-md hover:transform hover:translate-y-[-2px] hover:brightness-95",
};

// Icon hover effects by type
export const ICON_HOVER_EFFECTS = {
  default: "hover:text-primary transition-colors duration-200",
  muted: "hover:text-foreground transition-colors duration-200",
  primary: "hover:text-primary-dark transition-colors duration-200",
  destructive: "hover:text-destructive-dark transition-colors duration-200",
};

// Confirmation animation effects
export const CONFIRMATION_ANIMATION = {
  pulse: "animate-[pulse_1.5s_cubic-bezier(0.4,0,0.6,1)_infinite] shadow-lg shadow-red-500/50",
  shake: "animate-[wiggle_0.5s_ease-in-out]",
  highlight: "ring-4 ring-red-500 ring-opacity-75"
};
