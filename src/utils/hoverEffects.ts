
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
  default: "transition-transform duration-200 group-hover:scale-110 group-hover:text-primary",
  subtle: "transition-opacity duration-200 group-hover:opacity-80",
  rotate: "transition-transform duration-200 group-hover:rotate-12",
  bounce: "transition-transform duration-200 group-hover:translate-y-[-2px]",
  // Adding back compatibility for existing icon effect types
  muted: "transition-opacity duration-200 group-hover:opacity-80",
  primary: "transition-transform duration-200 group-hover:scale-110 group-hover:text-primary-dark",
  destructive: "transition-transform duration-200 group-hover:scale-110 group-hover:text-destructive-dark"
};

// Confirmation animation effects
export const CONFIRMATION_ANIMATION = {
  pulse: "animate-[pulse_1.5s_cubic-bezier(0.4,0,0.6,1)_infinite] shadow-lg shadow-red-500/50",
  shake: "animate-[wiggle_0.5s_ease-in-out]",
  highlight: "ring-4 ring-red-500 ring-opacity-75"
};
