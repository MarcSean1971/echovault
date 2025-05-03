
import { useCallback } from "react";
import { ICON_HOVER_EFFECTS, BUTTON_HOVER_EFFECTS, HOVER_TRANSITION } from "@/utils/hoverEffects";

/**
 * Custom hook for applying consistent hover effects across the application
 */
export function useHoverEffects() {
  /**
   * Get classNames for icon hover effects
   */
  const getIconHoverClasses = useCallback(() => {
    return ICON_HOVER_EFFECTS;
  }, []);

  /**
   * Get classNames for button hover effects based on variant
   * @param variant Button variant ('default', 'primary', 'secondary', etc.)
   */
  const getButtonHoverClasses = useCallback((variant: keyof typeof BUTTON_HOVER_EFFECTS = 'default') => {
    return `${HOVER_TRANSITION} ${BUTTON_HOVER_EFFECTS[variant] || BUTTON_HOVER_EFFECTS.default}`;
  }, []);

  return {
    getIconHoverClasses,
    getButtonHoverClasses,
    HOVER_TRANSITION
  };
}
