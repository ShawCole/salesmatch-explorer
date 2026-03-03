import { useMemo } from 'react';
import { useFilters } from '../../contexts/FilterContext';
import { useAggregation } from '../../hooks/useAggregation';
import { FloatingCard } from './FloatingCard';
import { BarChart } from '../charts/BarChart';
import { HorizontalBar } from '../charts/HorizontalBar';
import { INCOME_RANGE_ORDER, INCOME_RANGE_LABELS, INCOME_MOBILE_LABELS } from '../../utils/constants';

export function IncomeCard({ onClose, compact }: { onClose?: () => void; compact?: boolean }) {
  const { filteredRecords } = useFilters();
  const labels = compact ? INCOME_MOBILE_LABELS : INCOME_RANGE_LABELS;
  const data = useAggregation(filteredRecords, 'INCOME_RANGE', INCOME_RANGE_ORDER, labels);
  const reversed = useMemo(() => [...data].reverse(), [data]);

  if (compact) {
    return (
      <FloatingCard title="Income Range" noPadding onClose={onClose}>
        <HorizontalBar data={reversed} color="#2563eb" height={225} yAxisWidth={90} compact />
      </FloatingCard>
    );
  }

  return (
    <FloatingCard title="Income Range" className="w-[320px]" onClose={onClose}>
      <BarChart data={data} color="#2563eb" height={175} xAxisHeight={30} />
    </FloatingCard>
  );
}
