import { useFilters } from '../../contexts/FilterContext';
import { FloatingCard } from './FloatingCard';
import { FamilyDoughnut } from '../charts/FamilyDoughnut';

export function FamilyDynamicsCard({ onClose, compact }: { onClose?: () => void; compact?: boolean }) {
  const { filteredRecords } = useFilters();

  return (
    <FloatingCard title="Family Dynamics" className="w-[280px]" onClose={onClose}>
      <div className={compact
        ? "flex items-center justify-center gap-x-3 gap-y-0.5 px-1 mb-1 flex-wrap"
        : "grid grid-cols-2 gap-x-1 gap-y-0.5 px-1 mb-1 justify-items-center"
      }>
        <span className="flex items-center gap-1 text-[10px] text-gray-400">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: '#6d28d9' }} /> Married + Kids
        </span>
        <span className="flex items-center gap-1 text-[10px] text-gray-400">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: '#a78bfa' }} /> Married
        </span>
        <span className="flex items-center gap-1 text-[10px] text-gray-400">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: '#4b5563' }} /> Single + Kids
        </span>
        <span className="flex items-center gap-1 text-[10px] text-gray-400">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: '#9ca3af' }} /> Single
        </span>
      </div>
      <FamilyDoughnut records={filteredRecords} height={170} compact={compact} />
    </FloatingCard>
  );
}
