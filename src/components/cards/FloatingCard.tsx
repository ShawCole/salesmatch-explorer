import { type ReactNode } from 'react';
import { X } from 'lucide-react';

interface Props {
  title: string;
  children: ReactNode;
  className?: string;
  noPadding?: boolean;
  onClose?: () => void;
}

export function FloatingCard({ title, children, className = '', noPadding = false, onClose }: Props) {
  return (
    <div
      className={`glass rounded-xl shadow-2xl transition-all duration-300 ${className}`}
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/5">
        <h3 className="text-xs font-medium text-gray-300 uppercase tracking-wider">{title}</h3>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-gray-200 transition-colors"
          >
            <X size={12} />
          </button>
        )}
      </div>
      <div className={noPadding ? '' : 'px-2 pt-2 pb-2'}>
        {children}
      </div>
    </div>
  );
}
