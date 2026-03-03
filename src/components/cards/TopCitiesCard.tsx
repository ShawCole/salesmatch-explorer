import { useFilters } from '../../contexts/FilterContext';
import { useAggregation } from '../../hooks/useAggregation';
import { FloatingCard } from './FloatingCard';
import { HorizontalBar } from '../charts/HorizontalBar';

export function TopCitiesCard({ onClose, compact }: { onClose?: () => void; compact?: boolean }) {
  const { filteredRecords } = useFilters();
  const data = useAggregation(filteredRecords, 'PERSONAL_CITY', undefined, undefined, 10, true);

  return (
    <FloatingCard title="Top Cities" className="w-[280px]" noPadding onClose={onClose}>
      <HorizontalBar data={data} color="#10b981" height={compact ? 225 : 240} compact={compact} />
    </FloatingCard>
  );
}
