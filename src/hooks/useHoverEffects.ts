
import { useCallback, useEffect } from 'react';

export function useHoverEffects() {
  // Apply hover effect to specified elements
  const applyHoverEffect = useCallback((selector: string) => {
    const applyEffects = () => {
      const elements = document.querySelectorAll(selector);
      
      elements.forEach(element => {
        // Add hover class for tracking
        element.classList.add('hover-effect-applied');
        
        // Add event listeners
        element.addEventListener('mouseenter', handleMouseEnter);
        element.addEventListener('mouseleave', handleMouseLeave);
        element.addEventListener('focus', handleFocus);
        element.addEventListener('blur', handleBlur);
      });
    };
    
    const handleMouseEnter = (e: Event) => {
      const el = e.currentTarget as HTMLElement;
      el.style.transform = 'translateY(-1px)';
      el.style.transition = 'all 0.2s ease';
      
      // Add subtle shadow effect
      if (el.tagName === 'BUTTON' || el.classList.contains('clickable-icon')) {
        el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
      }
    };
    
    const handleMouseLeave = (e: Event) => {
      const el = e.currentTarget as HTMLElement;
      el.style.transform = 'translateY(0)';
      el.style.boxShadow = '';
    };
    
    const handleFocus = (e: Event) => {
      const el = e.currentTarget as HTMLElement;
      el.style.transform = 'translateY(-1px)';
      el.style.boxShadow = '0 0 0 2px rgba(66, 153, 225, 0.5)';
    };
    
    const handleBlur = (e: Event) => {
      const el = e.currentTarget as HTMLElement;
      el.style.transform = 'translateY(0)';
      el.style.boxShadow = '';
    };
    
    // Clean up function to remove event listeners
    const cleanupEffects = () => {
      const elements = document.querySelectorAll(selector + '.hover-effect-applied');
      
      elements.forEach(element => {
        element.removeEventListener('mouseenter', handleMouseEnter);
        element.removeEventListener('mouseleave', handleMouseLeave);
        element.removeEventListener('focus', handleFocus);
        element.removeEventListener('blur', handleBlur);
        element.classList.remove('hover-effect-applied');
      });
    };
    
    // Apply effects immediately
    applyEffects();
    
    // Set up a mutation observer to apply effects to new elements
    const observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          applyEffects();
        }
      });
    });
    
    // Start observing the document with configured parameters
    observer.observe(document.body, { childList: true, subtree: true });
    
    // Return cleanup function
    return () => {
      observer.disconnect();
      cleanupEffects();
    };
  }, []);
  
  return { applyHoverEffect };
}
