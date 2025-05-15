
import { useCallback, useEffect } from 'react';
import { HOVER_TRANSITION } from '@/utils/hoverEffects';

export function useHoverEffects() {
  // Apply hover effects to elements matched by selector
  const applyHoverEffect = useCallback((selector: string) => {
    useEffect(() => {
      const elements = document.querySelectorAll(selector);
      
      elements.forEach(el => {
        if (el instanceof HTMLElement) {
          el.classList.add(HOVER_TRANSITION);
          
          // Store original opacity/transform if needed
          const originalOpacity = el.style.opacity || '1';
          const originalTransform = el.style.transform || '';
          
          el.addEventListener('mouseenter', () => {
            el.style.opacity = '0.8';
            if (!el.style.transform.includes('scale')) {
              el.style.transform = `${originalTransform} scale(1.02)`;
            }
          });
          
          el.addEventListener('mouseleave', () => {
            el.style.opacity = originalOpacity;
            el.style.transform = originalTransform;
          });
        }
      });
      
      // Cleanup event listeners on unmount
      return () => {
        elements.forEach(el => {
          if (el instanceof HTMLElement) {
            el.classList.remove(HOVER_TRANSITION);
            el.removeEventListener('mouseenter', () => {});
            el.removeEventListener('mouseleave', () => {});
          }
        });
      };
    }, [selector]);
  }, []);
  
  // Get classes for specific hover effect types
  const getIconHoverClasses = (type: 'default' | 'danger' | 'success' | 'warning' = 'default') => {
    switch(type) {
      case 'danger':
        return `${HOVER_TRANSITION} group-hover:text-red-500 transition-colors`;
      case 'success':
        return `${HOVER_TRANSITION} group-hover:text-green-500 transition-colors`;
      case 'warning':
        return `${HOVER_TRANSITION} group-hover:text-amber-500 transition-colors`;
      case 'default':
      default:
        return `${HOVER_TRANSITION} group-hover:text-primary transition-colors`;
    }
  };

  return {
    applyHoverEffect,
    getIconHoverClasses
  };
}
