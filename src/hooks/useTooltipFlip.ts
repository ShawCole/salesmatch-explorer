import { useCallback, useRef } from 'react';

/**
 * Returns a ref to attach to the tooltip wrapper and a position calculator
 * that auto-flips the tooltip when it would overflow the viewport.
 */
export function useTooltipFlip(offset = 12) {
  const ref = useRef<HTMLDivElement>(null);

  const getStyle = useCallback(
    (mouseX: number, mouseY: number): { left: number; top: number } => {
      const el = ref.current;
      const w = el?.offsetWidth ?? 160;
      const h = el?.offsetHeight ?? 40;

      let left = mouseX + offset;
      let top = mouseY - h / 2;

      // Flip left if overflowing right
      if (left + w > window.innerWidth - 8) {
        left = mouseX - w - offset;
      }
      // Clamp top
      if (top < 8) top = 8;
      if (top + h > window.innerHeight - 8) {
        top = window.innerHeight - h - 8;
      }

      return { left, top };
    },
    [offset],
  );

  return { ref, getStyle };
}
