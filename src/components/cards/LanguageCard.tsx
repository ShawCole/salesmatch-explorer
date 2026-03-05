import { useMemo, useRef, useState, useEffect } from 'react';
import { useFilters } from '../../contexts/FilterContext';
import { useRenderPerf } from '../../hooks/useRenderPerf';
import { FloatingCard } from './FloatingCard';
import { LanguageDoughnut } from '../charts/LanguageDoughnut';
import { LANGUAGE_CODE_LABELS } from '../../utils/constants';

const COLORS = ['#2563eb', '#f59e0b', '#10b981', '#a855f7', '#ef4444', '#ec4899', '#06b6d4', '#f97316', '#6b7280'];
const MIN_PCT = 0.5;
// Max 4 named languages — fits 2 rows of 3 items (4 named + Other = 5 items)
const MAX_NAMED = 4;

export interface LangSegment {
  name: string;
  value: number;
  fill: string;
}

function buildSegments(records: { SKIPTRACE_LANGUAGE_CODE: string }[]): LangSegment[] {
  const named = new Map<string, number>();
  let otherCount = 0;
  for (const r of records) {
    const code = r.SKIPTRACE_LANGUAGE_CODE;
    if (!code) continue;
    const label = code !== 'UX' ? LANGUAGE_CODE_LABELS[code] : undefined;
    if (label) {
      named.set(label, (named.get(label) || 0) + 1);
    } else {
      otherCount++;
    }
  }
  const total = records.length || 1;
  const threshold = total * (MIN_PCT / 100);
  const segments: LangSegment[] = [];
  let colorIdx = 0;
  const sorted = Array.from(named.entries()).sort((a, b) => b[1] - a[1]);
  for (const [label, count] of sorted) {
    if (count >= threshold && segments.length < MAX_NAMED) {
      segments.push({ name: label, value: count, fill: COLORS[colorIdx % COLORS.length] });
      colorIdx++;
    } else {
      otherCount += count;
    }
  }
  if (otherCount > 0) {
    segments.push({ name: 'Other', value: otherCount, fill: COLORS[COLORS.length - 1] });
  }
  return segments;
}

export function LanguageCard({ onClose, compact }: { onClose?: () => void; compact?: boolean }) {
  useRenderPerf('LanguageCard');
  const { filteredRecords, totalCount } = useFilters();

  const segments = useMemo(() => buildSegments(filteredRecords as any[]), [filteredRecords]);

  const legendRef = useRef<HTMLDivElement>(null);
  const [hideOther, setHideOther] = useState(false);

  // Measure legend height — if it exceeds 2 rows (~32px), hide "Other" label
  useEffect(() => {
    const el = legendRef.current;
    if (!el) return;
    // Temporarily show all segments to measure
    setHideOther(false);
    requestAnimationFrame(() => {
      if (!legendRef.current) return;
      // 2 rows at ~15px line-height + gap ≈ 32px; anything over means 3+ rows
      setHideOther(legendRef.current.scrollHeight > 36);
    });
  }, [segments]);

  const legendSegments = hideOther ? segments.filter(s => s.name !== 'Other') : segments;

  return (
    <FloatingCard title="Primary Language" className="w-[280px]" onClose={onClose}>
      <div ref={legendRef} className="flex items-center justify-center gap-x-3 gap-y-0.5 px-1 mb-1 flex-wrap min-h-[30px]">
        {legendSegments.map(s => (
          <span key={s.name} className="flex items-center gap-1 text-[10px] text-gray-400">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: s.fill }} /> {s.name}
          </span>
        ))}
      </div>
      <LanguageDoughnut segments={segments} totalCount={totalCount} height={170} compact={compact} />
    </FloatingCard>
  );
}
