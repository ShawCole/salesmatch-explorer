import { useMemo } from 'react';
import { useFilters } from '../../contexts/FilterContext';
import { useAggregation } from '../../hooks/useAggregation';
import { useRenderPerf } from '../../hooks/useRenderPerf';
import { FloatingCard } from './FloatingCard';
import { BarChart } from '../charts/BarChart';
import { HorizontalBar } from '../charts/HorizontalBar';
import { COMPANY_REVENUE_ORDER, COMPANY_REVENUE_LABELS } from '../../utils/constants';

export function CompanyRevenueCard({ onClose, compact }: { onClose?: () => void; compact?: boolean }) {
  useRenderPerf('CompanyRevenueCard');
  const { apiData } = useFilters();
  const data = useAggregation(apiData?.aggregations.company_revenue, COMPANY_REVENUE_ORDER, COMPANY_REVENUE_LABELS);
  const reversed = useMemo(() => [...data].reverse(), [data]);

  if (compact) {
    return (
      <FloatingCard title="Est. Revenue" noPadding onClose={onClose}>
        <HorizontalBar data={reversed} color="#7c3aed" height={225} yAxisWidth={90} compact />
      </FloatingCard>
    );
  }

  return (
    <FloatingCard title="Est. Revenue" className="w-[360px]" onClose={onClose}>
      <BarChart data={data} color="#7c3aed" height={175} />
    </FloatingCard>
  );
}
