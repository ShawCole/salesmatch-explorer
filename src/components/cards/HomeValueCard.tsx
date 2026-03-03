import { useFilters } from '../../contexts/FilterContext';
import { useAggregation } from '../../hooks/useAggregation';
import { FloatingCard } from './FloatingCard';
import { HorizontalBar } from '../charts/HorizontalBar';
import { HOME_VALUE_ORDER } from '../../utils/constants';

export function HomeValueCard({ onClose, compact }: { onClose?: () => void; compact?: boolean }) {
  const { filteredRecords } = useFilters();
  const data = useAggregation(filteredRecords, 'HOME_VALUE_TAB', [...HOME_VALUE_ORDER].reverse());

  return (
    <FloatingCard title="Home Value" className="w-[280px]" noPadding onClose={onClose}>
      <HorizontalBar data={data} color="#8b5cf6" height={compact ? 225 : 260} compact={compact} />
    </FloatingCard>
  );
}
