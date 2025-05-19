
// Define common hover effects
// These can be used across the application for consistent styling

export const HOVER_TRANSITION = "transition-all duration-200 ease-in-out";

export const BUTTON_HOVER_EFFECTS = {
  default: "hover:bg-opacity-90 active:bg-opacity-80 transform active:scale-95 hover:shadow-sm",
  outline: "hover:bg-gray-50 active:bg-gray-100 transform active:scale-95",
  danger: "hover:bg-red-600 active:bg-red-700 transform active:scale-95",
  ghost: "hover:bg-gray-100 active:bg-gray-200 transform active:scale-95",
  link: "hover:underline",
};

export const ICON_HOVER_EFFECTS = {
  default: "transition-all duration-200 hover:scale-110 hover:text-blue-500",
  danger: "transition-all duration-200 hover:scale-110 hover:text-red-500",
  success: "transition-all duration-200 hover:scale-110 hover:text-green-500",
  warning: "transition-all duration-200 hover:scale-110 hover:text-amber-500",
  // Add back the muted property that was being used
  muted: "transition-all duration-200 hover:text-gray-700",
  primary: "transition-all duration-200 hover:scale-110 hover:text-primary",
  secondary: "transition-all duration-200 hover:text-secondary",
  destructive: "transition-all duration-200 hover:text-destructive"
};

export const CARD_HOVER_EFFECTS = {
  default: "transition-all duration-200 hover:shadow-md hover:border-gray-300",
  clickable: "transition-all duration-200 hover:shadow-md hover:border-gray-300 cursor-pointer",
};

// Add back the CONFIRMATION_ANIMATION that was referenced
export const CONFIRMATION_ANIMATION = {
  pulse: "animate-pulse",
  shake: "animate-[shake_0.5s_ease-in-out]",
  highlight: "animate-[highlight_1s_ease-in-out]"
};
