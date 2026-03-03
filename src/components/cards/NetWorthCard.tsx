import { useMemo } from 'react';
import { useFilters } from '../../contexts/FilterContext';
import { useAggregation } from '../../hooks/useAggregation';
import { FloatingCard } from './FloatingCard';
import { BarChart } from '../charts/BarChart';
import { HorizontalBar } from '../charts/HorizontalBar';
import { NET_WORTH_ORDER, NET_WORTH_LABELS, NET_WORTH_MOBILE_LABELS } from '../../utils/constants';

export function NetWorthCard({ onClose, compact }: { onClose?: () => void; compact?: boolean }) {
  const { filteredRecords } = useFilters();
  const labels = compact ? NET_WORTH_MOBILE_LABELS : NET_WORTH_LABELS;
  const data = useAggregation(filteredRecords, 'NET_WORTH', NET_WORTH_ORDER, labels);
  const reversed = useMemo(() => [...data].reverse(), [data]);

  if (compact) {
    return (
      <FloatingCard title="Net Worth" noPadding onClose={onClose}>
        <HorizontalBar data={reversed} color="#7c3aed" height={225} yAxisWidth={90} compact />
      </FloatingCard>
    );
  }

  return (
    <FloatingCard title="Net Worth" className="w-[360px]" onClose={onClose}>
      <BarChart data={data} color="#7c3aed" height={175} />
    </FloatingCard>
  );
}
