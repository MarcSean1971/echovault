
// Constants for hover transition effects
export const HOVER_TRANSITION = "transition-all duration-200 ease-in-out";

export const BUTTON_HOVER_EFFECTS = {
  default: "hover:shadow-md hover:-translate-y-0.5",
  subtle: "hover:bg-opacity-90",
  danger: "hover:bg-red-600 hover:text-white",
  success: "hover:bg-green-600 hover:text-white",
  ghost: "hover:bg-gray-100 dark:hover:bg-gray-800",
  outline: "hover:bg-gray-50 active:bg-gray-100" // Added the missing 'outline' property
};

// Add back the missing ICON_HOVER_EFFECTS export
export const ICON_HOVER_EFFECTS = {
  default: "transition-all duration-200 hover:scale-110 hover:text-blue-500",
  danger: "transition-all duration-200 hover:scale-110 hover:text-red-500",
  success: "transition-all duration-200 hover:scale-110 hover:text-green-500",
  warning: "transition-all duration-200 hover:scale-110 hover:text-amber-500",
  muted: "transition-all duration-200 hover:text-gray-700",
  primary: "transition-all duration-200 hover:scale-110 hover:text-primary",
  secondary: "transition-all duration-200 hover:text-secondary",
  destructive: "transition-all duration-200 hover:text-destructive"
};

// Add back the CONFIRMATION_ANIMATION export
export const CONFIRMATION_ANIMATION = {
  pulse: "animate-pulse",
  shake: "animate-[shake_0.5s_ease-in-out]",
  highlight: "animate-[highlight_1s_ease-in-out]"
};
