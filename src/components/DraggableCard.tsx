import { useState, useRef, useCallback, useEffect, type ReactNode, type MouseEvent } from 'react';

interface Props {
  id: string;
  defaultX: number;
  defaultY: number;
  visible: boolean;
  children: ReactNode;
}

function clamp(x: number, y: number, el: HTMLElement | null): { x: number; y: number } {
  const w = el?.offsetWidth || 280;
  const h = el?.offsetHeight || 200;
  const margin = 8;
  return {
    x: Math.max(margin, Math.min(x, window.innerWidth - w - margin)),
    y: Math.max(margin, Math.min(y, window.innerHeight - h - margin)),
  };
}

export function DraggableCard({ id, defaultX, defaultY, visible, children }: Props) {
  const [pos, setPos] = useState(() => ({ x: defaultX, y: defaultY }));
  const [zIndex, setZIndex] = useState(10);
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Clamp on mount and window resize
  useEffect(() => {
    const reclamp = () => {
      setPos(prev => clamp(prev.x, prev.y, cardRef.current));
    };
    // Defer initial clamp so card has rendered and has dimensions
    const raf = requestAnimationFrame(reclamp);
    window.addEventListener('resize', reclamp);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', reclamp);
    };
  }, []);

  // Re-clamp when defaults change (e.g. percentage recalc)
  useEffect(() => {
    setPos(clamp(defaultX, defaultY, cardRef.current));
  }, [defaultX, defaultY]);

  const onMouseDown = useCallback((e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('select')) return;

    e.preventDefault();
    setZIndex(100);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: pos.x,
      origY: pos.y,
    };

    const onMouseMove = (ev: globalThis.MouseEvent) => {
      if (!dragRef.current) return;
      const dx = ev.clientX - dragRef.current.startX;
      const dy = ev.clientY - dragRef.current.startY;
      setPos(clamp(dragRef.current.origX + dx, dragRef.current.origY + dy, cardRef.current));
    };

    const onMouseUp = () => {
      dragRef.current = null;
      setZIndex(10);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, [pos]);

  if (!visible) return null;

  return (
    <div
      ref={cardRef}
      data-card-id={id}
      className="absolute pointer-events-auto"
      style={{
        left: pos.x,
        top: pos.y,
        zIndex,
        cursor: 'grab',
      }}
      onMouseDown={onMouseDown}
      onMouseEnter={() => window.dispatchEvent(new Event('card-hover-start'))}
    >
      {children}
    </div>
  );
}
