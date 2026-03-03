import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check, Ban } from 'lucide-react';
import type { MultiSelectFilter } from '../types/record';

type TriState = 'unset' | 'include' | 'exclude';

function cycleState(current: TriState): TriState {
  if (current === 'unset') return 'include';
  if (current === 'include') return 'exclude';
  return 'unset';
}

interface MultiSelectPopoverProps {
  label: string;
  options: string[];
  labelMap?: Record<string, string>;
  filter: MultiSelectFilter;
  onToggle: (value: string, state: TriState) => void;
  onClear: () => void;
}

export function MultiSelectPopover({
  label,
  options,
  labelMap,
  filter,
  onToggle,
  onClear,
}: MultiSelectPopoverProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const count = filter.include.size + filter.exclude.size;

  const filtered = search
    ? options.filter(o => {
        const display = labelMap?.[o] ?? o;
        return display.toLowerCase().includes(search.toLowerCase());
      })
    : options;

  const getState = useCallback(
    (value: string): TriState => {
      if (filter.include.has(value)) return 'include';
      if (filter.exclude.has(value)) return 'exclude';
      return 'unset';
    },
    [filter],
  );

  // Position the panel using fixed coordinates from the trigger's bounding rect
  useEffect(() => {
    if (!open || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const popoverWidth = 256;
    const gap = 4;

    let left = rect.left;
    // If it would overflow right, align the popover's right edge to the trigger's right edge
    if (left + popoverWidth > window.innerWidth - 8) {
      left = rect.right - popoverWidth;
    }
    // Clamp to not go past left edge either
    if (left < 8) left = 8;

    setPos({ top: rect.bottom + gap, left });
  }, [open]);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (
        triggerRef.current?.contains(e.target as Node) ||
        panelRef.current?.contains(e.target as Node)
      ) return;
      setOpen(false);
      setSearch('');
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false);
        setSearch('');
      }
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open]);

  // Focus search when opened
  useEffect(() => {
    if (open) searchRef.current?.focus();
  }, [open]);

  return (
    <>
      {/* Trigger button */}
      <button
        ref={triggerRef}
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1 glass-light rounded-lg px-3 py-1.5 text-xs transition-colors cursor-pointer hover:bg-white/10 ${
          count > 0 ? 'text-purple-300 border border-purple-400/30' : 'text-gray-300'
        }`}
      >
        {label}
        {count > 0 && (
          <span className="bg-purple-600/60 text-purple-100 rounded-full px-1.5 py-0.5 text-[10px] leading-none font-medium">
            {count}
          </span>
        )}
        <ChevronDown size={12} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Popover panel — portalled to body to escape stacking contexts */}
      {open && pos && createPortal(
        <div
          ref={panelRef}
          className="fixed z-[9999] w-64 rounded-xl border border-white/10 bg-gray-900/95 backdrop-blur-xl shadow-2xl"
          style={{ top: pos.top, left: pos.left }}
        >
          {/* Search */}
          <div className="p-2 border-b border-white/5">
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={`Search ${label.toLowerCase()}...`}
              className="w-full bg-white/5 rounded-lg px-2.5 py-1.5 text-xs text-gray-200 placeholder-gray-500 outline-none focus:ring-1 focus:ring-purple-500/40"
            />
          </div>

          {/* Options list */}
          <div className="max-h-60 overflow-y-auto p-1">
            {filtered.length === 0 ? (
              <div className="px-3 py-2 text-xs text-gray-500">No matches</div>
            ) : (
              filtered.map(option => {
                const state = getState(option);
                const display = labelMap?.[option] ?? option;
                return (
                  <button
                    key={option}
                    onClick={() => onToggle(option, cycleState(state))}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-left transition-colors hover:bg-white/5 ${
                      state === 'include'
                        ? 'text-purple-300'
                        : state === 'exclude'
                          ? 'text-gray-500'
                          : 'text-gray-300'
                    }`}
                  >
                    {/* State icon */}
                    <span className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                      {state === 'include' && (
                        <span className="w-4 h-4 rounded border border-purple-400 bg-purple-600/40 flex items-center justify-center">
                          <Check size={10} className="text-purple-200" />
                        </span>
                      )}
                      {state === 'exclude' && (
                        <span className="w-4 h-4 rounded border border-gray-600 bg-gray-700/40 flex items-center justify-center">
                          <Ban size={10} className="text-gray-400" />
                        </span>
                      )}
                      {state === 'unset' && (
                        <span className="w-4 h-4 rounded border border-gray-600" />
                      )}
                    </span>
                    <span className={state === 'exclude' ? 'line-through' : ''}>{display}</span>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer */}
          {count > 0 && (
            <div className="border-t border-white/5 p-2">
              <button
                onClick={() => {
                  onClear();
                  setSearch('');
                }}
                className="text-[10px] text-gray-400 hover:text-white transition-colors"
              >
                Clear {label}
              </button>
            </div>
          )}
        </div>,
        document.body,
      )}
    </>
  );
}
