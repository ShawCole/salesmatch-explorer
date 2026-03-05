import { useFilters } from '../../contexts/FilterContext';
import { useAggregation } from '../../hooks/useAggregation';
import { useRenderPerf } from '../../hooks/useRenderPerf';
import { FloatingCard } from './FloatingCard';
import { HorizontalBar } from '../charts/HorizontalBar';
import { CREDIT_RATING_ORDER, CREDIT_RATING_LABELS } from '../../utils/constants';

export function CreditRatingCard({ onClose, compact }: { onClose?: () => void; compact?: boolean }) {
  useRenderPerf('CreditRatingCard');
  const { filteredRecords } = useFilters();
  const raw = useAggregation(
    filteredRecords,
    'SKIPTRACE_CREDIT_RATING',
    CREDIT_RATING_ORDER,
    CREDIT_RATING_LABELS,
  );
  const data = raw.filter(d => d.name !== 'U');

  return (
    <FloatingCard title="Credit Rating" className={compact ? undefined : 'w-[280px]'} noPadding onClose={onClose}>
      <HorizontalBar data={data} color="#f59e0b" height={compact ? 225 : 175} yAxisWidth={90} compact={compact} />
    </FloatingCard>
  );
}
