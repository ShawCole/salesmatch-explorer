import { useRef, useCallback } from 'react';

const isMobile = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;

/**
 * Returns a ref and onTouchStart handler for a chart container.
 * On touch devices, fades the Recharts tooltip to transparent after 5s
 * but keeps it in the DOM so the next tap can reactivate it.
 */
export function useMobileTooltipDismiss() {
  const ref = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const onTouchStart = useCallback(() => {
    if (!isMobile) return;
    const el = ref.current;
    if (!el) return;

    // Reset opacity immediately on new tap
    const tooltip = el.querySelector('.recharts-tooltip-wrapper') as HTMLElement | null;
    if (tooltip) {
      tooltip.style.transition = 'none';
      tooltip.style.opacity = '1';
    }

    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const tip = el.querySelector('.recharts-tooltip-wrapper') as HTMLElement | null;
      if (tip) {
        tip.style.transition = 'opacity 0.5s ease-out';
        tip.style.opacity = '0';
      }
    }, 5000);
  }, []);

  return { ref, onTouchStart };
}
