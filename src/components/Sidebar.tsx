import {
  Users,
  DollarSign,
  Banknote,
  CreditCard,
  MapPin,
  Heart,
  Languages,
  Building2,
  TrendingUp,
} from 'lucide-react';

export interface CardConfig {
  id: string;
  label: string;
  icon: React.ReactNode;
}

export const CARD_CONFIGS: CardConfig[] = [
  { id: 'age-gender', label: 'Age & Gender', icon: <Users size={16} /> },
  { id: 'top-cities', label: 'Top Cities', icon: <MapPin size={16} /> },
  { id: 'income', label: 'Income', icon: <Banknote size={16} /> },
  { id: 'credit', label: 'Credit Rating', icon: <CreditCard size={16} /> },
  { id: 'net-worth', label: 'Net Worth', icon: <DollarSign size={16} /> },
  { id: 'family', label: 'Family Dynamics', icon: <Heart size={16} /> },
  { id: 'language', label: 'Primary Language', icon: <Languages size={16} /> },
  { id: 'headcount', label: 'Headcount', icon: <Building2 size={16} /> },
  { id: 'company-revenue', label: 'Est. Revenue', icon: <TrendingUp size={16} /> },
];

interface Props {
  visibility: Record<string, boolean>;
  onToggle: (id: string) => void;
}

export function Sidebar({ visibility, onToggle }: Props) {
  return (
    <div className="absolute left-0 top-1/2 -translate-y-1/2 z-20 pointer-events-auto">
      <div className="glass rounded-r-xl py-2 px-1.5 flex flex-col gap-1">
        {CARD_CONFIGS.map(card => {
          const active = visibility[card.id] !== false;
          return (
            <div key={card.id} className="relative group">
              <button
                onClick={() => onToggle(card.id)}
                className={`p-1.5 rounded-lg transition-all ${
                  active
                    ? 'text-purple-400 bg-purple-500/20'
                    : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                }`}
              >
                {card.icon}
              </button>
              <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 glass-light rounded-md text-[10px] text-gray-200 whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity">
                {card.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
