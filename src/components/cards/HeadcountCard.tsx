import { useMemo } from 'react';
import { useFilters } from '../../contexts/FilterContext';
import { useAggregation } from '../../hooks/useAggregation';
import { useRenderPerf } from '../../hooks/useRenderPerf';
import { FloatingCard } from './FloatingCard';
import { BarChart } from '../charts/BarChart';
import { HorizontalBar } from '../charts/HorizontalBar';
import { EMPLOYEE_COUNT_ORDER, EMPLOYEE_COUNT_LABELS } from '../../utils/constants';

export function HeadcountCard({ onClose, compact }: { onClose?: () => void; compact?: boolean }) {
  useRenderPerf('HeadcountCard');
  const { apiData } = useFilters();
  const data = useAggregation(apiData?.aggregations.employee_count, EMPLOYEE_COUNT_ORDER, EMPLOYEE_COUNT_LABELS);
  const reversed = useMemo(() => [...data].reverse(), [data]);

  if (compact) {
    return (
      <FloatingCard title="Headcount" noPadding onClose={onClose}>
        <HorizontalBar data={reversed} color="#2563eb" height={225} yAxisWidth={90} compact />
      </FloatingCard>
    );
  }

  return (
    <FloatingCard title="Headcount" className="w-[320px]" onClose={onClose}>
      <BarChart data={data} color="#2563eb" height={175} xAxisHeight={30} />
    </FloatingCard>
  );
}
