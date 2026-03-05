import { useRef, useEffect } from 'react';

/** DEV-only: logs how long a component's render + commit takes */
export function useRenderPerf(label: string) {
  const t0 = useRef(performance.now());

  // Capture start time on every render (runs synchronously during render)
  t0.current = performance.now();

  useEffect(() => {
    if (import.meta.env.DEV) {
      const elapsed = performance.now() - t0.current;
      console.log(`[render] ${label}: ${elapsed.toFixed(1)}ms`);
    }
  });
}
