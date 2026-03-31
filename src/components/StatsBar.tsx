import { useMemo, useCallback, useState } from 'react';
import { useFilters } from '../contexts/FilterContext';
import { buildShareURL } from '../utils/urlFilters';
import { MapPin, Link, Check } from 'lucide-react';

function describeArea(
  filters: {
    selectedZips: Set<string>;
    county: { include: Set<string> };
    city: { include: Set<string> };
    state: { include: Set<string> };
  },
  countyLabelMap: Record<string, string>,
): string {
  // State filter
  if (filters.state.include.size > 0) {
    const states = [...filters.state.include];
    if (states.length === 1) return states[0];
    if (states.length === 2) return `${states[0]} & ${states[1]}`;
    return `${states.length} States`;
  }

  // Specific ZIPs selected on map
  if (filters.selectedZips.size > 0) {
    const count = filters.selectedZips.size;
    if (count === 1) return `ZIP ${[...filters.selectedZips][0]}`;
    return `${count} ZIPs`;
  }

  // County filter
  if (filters.county.include.size > 0) {
    const counties = [...filters.county.include];
    if (counties.length === 1) {
      const label = countyLabelMap[counties[0]];
      return label ? `${label} County` : `County ${counties[0]}`;
    }
    if (counties.length === 2) {
      const n1 = countyLabelMap[counties[0]] || counties[0];
      const n2 = countyLabelMap[counties[1]] || counties[1];
      return `${n1} & ${n2}`;
    }
    return `${counties.length} Counties`;
  }

  // City filter
  if (filters.city.include.size > 0) {
    const cities = [...filters.city.include];
    if (cities.length === 1) return cities[0];
    return `${cities[0]} & ${cities.length - 1} other${cities.length > 2 ? 's' : ''}`;
  }

  return 'National';
}

export function StatsBar({ hideExport }: { hideExport?: boolean } = {}) {
  const { filters, apiData } = useFilters();
  const [linkCopied, setLinkCopied] = useState(false);

  const countyLabelMap = useMemo(() => {
    if (!apiData?.filterOptions?.counties) return {};
    const map: Record<string, string> = {};
    for (const c of apiData.filterOptions.counties) {
      map[c.fips] = `${c.name}, ${c.state}`;
    }
    return map;
  }, [apiData?.filterOptions?.counties]);

  const handleCopyLink = useCallback(() => {
    const url = buildShareURL(filters);
    navigator.clipboard.writeText(url);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  }, [filters]);

  const areaLabel = useMemo(
    () => describeArea(filters, countyLabelMap),
    [filters, countyLabelMap],
  );

  const filteredCount = apiData?.filteredContacts ?? 0;
  const totalCount = apiData?.totalContacts ?? 0;

  return (
    <div className="pointer-events-auto">
      <div className="glass rounded-xl p-3 w-[200px] space-y-2">
        {/* Area */}
        <div className="flex items-center gap-1.5">
          <MapPin size={12} className="text-purple-400 shrink-0" />
          <span className="text-[11px] font-semibold text-white truncate" title={areaLabel}>{areaLabel}</span>
        </div>

        {/* Count */}
        <div className="border-t border-white/5 pt-2">
          <div className="flex items-baseline justify-between">
            <span className="text-lg font-bold text-white leading-none">
              {filteredCount.toLocaleString()}
            </span>
            {filteredCount !== totalCount && (
              <span className="text-[10px] text-gray-500">of {totalCount.toLocaleString()}</span>
            )}
          </div>
        </div>

        {/* Copy Link */}
        {!hideExport && (
          <div className="flex gap-1.5">
            <button
              onClick={handleCopyLink}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-purple-600/30 hover:bg-purple-600/50 border border-purple-400/20 text-purple-200 text-[11px] font-medium transition-colors"
              title="Copy shareable link with current filters"
            >
              {linkCopied ? <Check size={12} className="text-green-400" /> : <Link size={12} />}
              {linkCopied ? 'Copied' : 'Share Link'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
