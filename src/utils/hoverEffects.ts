
/**
 * Standardized hover effects for consistent UI interactions
 */

// Default timing for all transitions
export const HOVER_TRANSITION = 'transition-all duration-200';

// Different hover effects categorized by element type
export const ICON_HOVER_EFFECTS = {
  // For primary action icons (stronger hover effect)
  primary: 'hover:scale-110 hover:text-primary',
  
  // For secondary action icons (medium hover effect)
  secondary: 'hover:scale-105 hover:text-secondary-foreground',
  
  // For icons in muted or disabled state (subtle hover effect)
  muted: 'hover:text-foreground',
  
  // For icons that show attention or warning (orange/amber hover)
  warning: 'hover:text-amber-500',
  
  // For dangerous action icons (red hover)
  danger: 'hover:text-destructive',
  
  // For simple icons with just opacity effect (default)
  default: 'hover:opacity-80'
};

// For buttons with icon + text combinations
export const BUTTON_HOVER_EFFECTS = {
  // Transform effect for primary buttons
  transform: 'hover:translate-y-[-1px] hover:shadow-md',
  
  // Scale effect for round buttons
  scale: 'hover:scale-105',
  
  // Subtle effect for secondary/ghost buttons
  subtle: 'hover:bg-muted/80',
  
  // No transform but color change
  color: '',
  
  // Default is just what's built into the button variants
  default: '',
  
  // For outline buttons with hover effect
  outline: 'hover:bg-accent hover:text-accent-foreground'
};

// Animation effects for confirmation actions
export const CONFIRMATION_ANIMATION = {
  // Pulse animation for drawing attention
  pulse: 'animate-pulse',
  
  // Shake animation for warnings/errors
  shake: 'animate-[shake_0.5s_ease-in-out]',
  
  // Highlight animation for success
  highlight: 'animate-[highlight_1s_ease-in-out]'
};
