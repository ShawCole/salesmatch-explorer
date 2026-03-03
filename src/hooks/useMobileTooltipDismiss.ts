import { useRef, useCallback } from 'react';

const isMobile = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;

/**
 * Returns a ref and onTouchStart handler for a chart container.
 * On touch devices, fades out Recharts tooltips after 5s then removes them.
 */
export function useMobileTooltipDismiss() {
  const ref = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const onTouchStart = useCallback(() => {
    if (!isMobile) return;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const el = ref.current;
      if (!el) return;
      // Find the Recharts tooltip wrapper and fade it out
      const tooltip = el.querySelector('.recharts-tooltip-wrapper') as HTMLElement | null;
      if (tooltip) {
        tooltip.style.transition = 'opacity 0.5s ease-out';
        tooltip.style.opacity = '0';
        // After fade completes, dispatch mouseleave to fully remove
        setTimeout(() => {
          el.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
        }, 500);
      }
    }, 5000);
  }, []);

  return { ref, onTouchStart };
}
