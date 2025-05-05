
// Define standard hover transition effects
export const HOVER_TRANSITION = "transition-all duration-200 hover:brightness-95 active:brightness-90";

// Define standard button hover effects by variant
export const BUTTON_HOVER_EFFECTS = {
  default: "hover:shadow-sm active:scale-[0.98]",
  primary: "hover:shadow-md active:scale-[0.98]",
  secondary: "hover:bg-opacity-90 active:scale-[0.98]",
  outline: "hover:bg-gray-50 active:scale-[0.98]",
  destructive: "hover:bg-red-700 active:scale-[0.98]",
  ghost: "hover:bg-gray-100 active:scale-[0.98]",
  link: "hover:underline"
};

// Define confirmation animations
export const CONFIRMATION_ANIMATION = {
  pulse: "animate-pulse",
  shake: "animate-[shake_0.5s_ease-in-out]",
  highlight: "animate-[highlight_1s_ease-in-out]"
};

// Define icon hover effects by type
export const ICON_HOVER_EFFECTS = {
  default: "hover:scale-110 transition-transform duration-200",
  muted: "hover:text-foreground transition-colors duration-200",
  primary: "hover:text-primary-600 transition-colors duration-200",
  secondary: "hover:text-secondary-600 transition-colors duration-200",
  accent: "hover:text-accent-600 transition-colors duration-200",
  warning: "hover:text-yellow-500 transition-colors duration-200"
};
