import { useMemo } from 'react';
import { useFilters } from '../../contexts/FilterContext';
import { useRenderPerf } from '../../hooks/useRenderPerf';
import { FloatingCard } from './FloatingCard';
import { PopulationPyramid } from '../charts/PopulationPyramid';
import { buildPyramid } from '../../utils/aggregation';
import { AGE_RANGE_ORDER } from '../../utils/constants';

export function AgeGenderCard({ onClose, compact }: { onClose?: () => void; compact?: boolean }) {
  useRenderPerf('AgeGenderCard');
  const { filteredRecords } = useFilters();
  const data = useMemo(
    () => buildPyramid(filteredRecords, AGE_RANGE_ORDER),
    [filteredRecords],
  );

  return (
    <FloatingCard title="Age & Gender" className="w-[340px]" onClose={onClose}>
      <div className="flex items-center gap-3 px-1 mb-1 ">
        <span className="flex items-center gap-1 text-[10px] text-gray-400">
          <span className="w-2 h-2 rounded-full bg-pink-500" /> Female
        </span>
        <span className="flex items-center gap-1 text-[10px] text-gray-400">
          <span className="w-2 h-2 rounded-full bg-blue-500" /> Male
        </span>
      </div>
      <PopulationPyramid data={data} height={compact ? 198 : 190} compact={compact} />
    </FloatingCard>
  );
}
