
import { useCallback } from "react";
import { BUTTON_HOVER_EFFECTS, HOVER_TRANSITION, CONFIRMATION_ANIMATION, ICON_HOVER_EFFECTS } from "@/utils/hoverEffects";

/**
 * Custom hook for applying consistent hover effects across the application
 */
export function useHoverEffects() {
  /**
   * Get classNames for button hover effects based on variant
   * @param variant Button variant ('default', 'primary', 'secondary', etc.)
   */
  const getButtonHoverClasses = useCallback((variant: keyof typeof BUTTON_HOVER_EFFECTS = 'default') => {
    return `${HOVER_TRANSITION} ${BUTTON_HOVER_EFFECTS[variant] || BUTTON_HOVER_EFFECTS.default}`;
  }, []);

  /**
   * Get classNames for icon hover effects based on type
   * @param type Icon type ('default', 'muted', 'primary', etc.)
   */
  const getIconHoverClasses = useCallback((type: keyof typeof ICON_HOVER_EFFECTS = 'default') => {
    return ICON_HOVER_EFFECTS[type] || ICON_HOVER_EFFECTS.default;
  }, []);

  /**
   * Get classNames for confirmation animation effects
   * @param animationType Animation type ('pulse', 'shake', 'highlight')
   */
  const getConfirmationAnimationClasses = useCallback((animationType: keyof typeof CONFIRMATION_ANIMATION = 'pulse') => {
    return CONFIRMATION_ANIMATION[animationType];
  }, []);

  return {
    getButtonHoverClasses,
    getIconHoverClasses,
    getConfirmationAnimationClasses,
    HOVER_TRANSITION
  };
}
