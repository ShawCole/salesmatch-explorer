import { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { useFilters, type MultiSelectKey } from '../contexts/FilterContext';
import { HOME_VALUE_ORDER, AGE_RANGE_ORDER, GENDER_ORDER, INCOME_RANGE_ORDER, INCOME_RANGE_LABELS, NET_WORTH_ORDER, NET_WORTH_LABELS, CREDIT_RATING_ORDER, CREDIT_RATING_LABELS, SENIORITY_ORDER, SENIORITY_LABELS, LANGUAGE_CODE_LABELS } from '../utils/constants';
import { ZIP_TO_COUNTY } from '../utils/zipCounty';
import { X, Copy, Check, ChevronDown } from 'lucide-react';
import { MultiSelectPopover } from './MultiSelectPopover';

function Pill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
        active
          ? 'bg-purple-600/80 text-white border border-purple-400/40'
          : 'glass-light text-gray-300 hover:text-white hover:bg-white/10'
      }`}
    >
      {label}
    </button>
  );
}

function ZipChipGroup({
  zips,
  variant,
  onClear,
  onClearOne,
}: {
  zips: Set<string>;
  variant: 'included' | 'excluded';
  onClear: () => void;
  onClearOne: (zip: string) => void;
}) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [copied, setCopied] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const isExcluded = variant === 'excluded';
  const count = zips.size;
  const zipList = Array.from(zips).sort();

  // Close tooltip on click outside
  useEffect(() => {
    if (!showTooltip) return;
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowTooltip(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showTooltip]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(zipList.join(', '));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [zipList]);

  if (count === 0) return null;

  return (
    <div ref={containerRef} className="relative">
      <span
        className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] border cursor-pointer select-none ${
          isExcluded
            ? 'bg-gray-600/30 text-gray-300 border-gray-500/20'
            : 'bg-purple-600/30 text-purple-200 border-purple-400/20'
        }`}
        onClick={() => setShowTooltip(!showTooltip)}
      >
        {count} {isExcluded ? 'Excluded' : 'Selected'} ZIP{count !== 1 ? 's' : ''}
        <button
          onClick={e => { e.stopPropagation(); onClear(); }}
          className="hover:text-white"
        >
          <X size={10} />
        </button>
      </span>

      {showTooltip && (
        <div className="absolute top-full left-0 mt-1 z-50 w-52 rounded-xl border border-white/10 bg-gray-900/95 backdrop-blur-xl shadow-2xl">
          <div className="flex items-center justify-between px-3 pt-2 pb-1">
            <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">
              {isExcluded ? 'Excluded' : 'Selected'} ZIPs
            </span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-white transition-colors"
            >
              {copied ? <Check size={10} className="text-green-400" /> : <Copy size={10} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <div className="max-h-40 overflow-y-auto px-1 pb-1">
            {zipList.map(zip => (
              <div
                key={zip}
                className="flex items-center justify-between px-2 py-1 rounded-lg text-xs text-gray-300 hover:bg-white/5"
              >
                {zip}
                <button
                  onClick={() => onClearOne(zip)}
                  className="text-gray-500 hover:text-white"
                >
                  <X size={10} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function toTitleCase(s: string): string {
  return s
    .toLowerCase()
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

const MOBILE_BP = 768;

export function FilterBar({ onCollapseChange }: { onCollapseChange?: (collapsed: boolean) => void } = {}) {
  const { filters, allRecords, dispatch } = useFilters();
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < MOBILE_BP);
  const [filtersOpen, setFiltersOpen] = useState(true);

  useEffect(() => {
    onCollapseChange?.(!filtersOpen);
  }, [filtersOpen, onCollapseChange]);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < MOBILE_BP);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Build city options sorted by frequency — ALL cities, normalized to title case
  const cityOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of allRecords) {
      const city = r.PERSONAL_CITY;
      if (city) {
        const normalized = toTitleCase(city);
        counts.set(normalized, (counts.get(normalized) || 0) + 1);
      }
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name]) => name);
  }, [allRecords]);

  // Build language options sorted by frequency (exclude UX)
  const languageOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of allRecords) {
      const lang = r.SKIPTRACE_LANGUAGE_CODE;
      if (lang) counts.set(lang, (counts.get(lang) || 0) + 1);
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .filter(([code]) => code !== 'UX')
      .map(([code]) => code);
  }, [allRecords]);

  // Build county options sorted by frequency
  const countyOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of allRecords) {
      const county = ZIP_TO_COUNTY[r.SKIPTRACE_ZIP];
      if (county) counts.set(county, (counts.get(county) || 0) + 1);
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name]) => name);
  }, [allRecords]);

  const allActive = filters.homeValueTabs.size === 0;

  // Build active filter chips (non-ZIP)
  const activeFilters: { label: string; clear: () => void }[] = [];

  // Merge consecutive ordered ranges into shorthand: "$20k-$45k" + "$45k-$60k" → "$20k-$60k"
  const mergeRangeLabel = (
    selected: Set<string>,
    order: string[],
    labelMap: Record<string, string>,
  ): string => {
    const sorted = order.filter(t => selected.has(t));
    const runs: string[][] = [];
    for (const item of sorted) {
      const idx = order.indexOf(item);
      const lastRun = runs[runs.length - 1];
      if (lastRun && order.indexOf(lastRun[lastRun.length - 1]) === idx - 1) {
        lastRun.push(item);
      } else {
        runs.push([item]);
      }
    }
    const rangeLabels = runs.map(run => {
      if (run.length === 1) return labelMap[run[0]] ?? run[0];
      const firstLabel = labelMap[run[0]] ?? run[0];
      const lastLabel = labelMap[run[run.length - 1]] ?? run[run.length - 1];
      // Extract low from first label, high from last label
      // Labels: "< $20k", "$20k-$45k", "> $250k", "< -$2.5k", "-$2.5k-$2.5k"
      // Split on the hyphen that separates low-high (not negative sign hyphens)
      const splitRange = (lbl: string) => {
        // Match "LOW-HIGH" where the separator hyphen comes after k/M/digit
        const m = lbl.match(/^(.+[kM\d])-(\$[\d.]+[kM]?\+?)$/);
        return m ? [m[1], m[2]] : [lbl, lbl];
      };
      const [low] = splitRange(firstLabel);
      const [, high] = splitRange(lastLabel);
      return `${low}-${high}`;
    });
    return rangeLabels.join(', ');
  };

  // Merge consecutive age ranges: "35-44" + "45-54" + "55-64" → "35-64", "55-64" + "65+" → "55+"
  const mergeAgeLabel = (selected: Set<string>): string => {
    const sorted = AGE_RANGE_ORDER.filter(t => selected.has(t));
    const runs: string[][] = [];
    for (const item of sorted) {
      const idx = AGE_RANGE_ORDER.indexOf(item);
      const lastRun = runs[runs.length - 1];
      if (lastRun && AGE_RANGE_ORDER.indexOf(lastRun[lastRun.length - 1]) === idx - 1) {
        lastRun.push(item);
      } else {
        runs.push([item]);
      }
    }
    const rangeLabels = runs.map(run => {
      if (run.length === 1) return run[0];
      const first = run[0];
      const last = run[run.length - 1];
      const low = first.split('-')[0];
      if (last.endsWith('+')) return `${low}+`;
      const high = last.split('-')[1];
      return `${low}-${high}`;
    });
    return rangeLabels.join(', ');
  };

  // Range-merge configs: these use consecutive-range shorthand in chips
  const rangeMergeConfigs: { key: MultiSelectKey; label: string; order: string[]; labelMap: Record<string, string> }[] = [
    { key: 'incomeRange', label: 'Income', order: INCOME_RANGE_ORDER, labelMap: INCOME_RANGE_LABELS },
    { key: 'netWorth', label: 'Net Worth', order: NET_WORTH_ORDER, labelMap: NET_WORTH_LABELS },
  ];

  for (const { key, label, order, labelMap } of rangeMergeConfigs) {
    const f = filters[key];
    const total = f.include.size + f.exclude.size;
    if (total > 0) {
      const parts: string[] = [];
      if (f.include.size > 0) parts.push(mergeRangeLabel(f.include, order, labelMap));
      if (f.exclude.size > 0) parts.push(`${f.exclude.size} excl`);
      activeFilters.push({
        label: `${label}: ${parts.join(', ')}`,
        clear: () => dispatch({ type: 'CLEAR_MULTI_SELECT', key }),
      });
    }
  }

  // Age range chip with consecutive merge
  {
    const f = filters.ageRange;
    const total = f.include.size + f.exclude.size;
    if (total > 0) {
      const parts: string[] = [];
      if (f.include.size > 0) parts.push(mergeAgeLabel(f.include));
      if (f.exclude.size > 0) parts.push(`${f.exclude.size} excl`);
      activeFilters.push({
        label: `Age: ${parts.join(', ')}`,
        clear: () => dispatch({ type: 'CLEAR_MULTI_SELECT', key: 'ageRange' }),
      });
    }
  }

  const multiSelectConfigs: { key: MultiSelectKey; label: string; labelMap?: Record<string, string> }[] = [
    { key: 'gender', label: 'Gender', labelMap: { F: 'Female', M: 'Male', U: 'Unknown' } },
    { key: 'creditRating', label: 'Credit', labelMap: CREDIT_RATING_LABELS },
    { key: 'county', label: 'County' },
    { key: 'city', label: 'City' },
    { key: 'language', label: 'Language', labelMap: LANGUAGE_CODE_LABELS },
    { key: 'seniorityLevel', label: 'Seniority', labelMap: SENIORITY_LABELS },
  ];

  for (const { key, label, labelMap } of multiSelectConfigs) {
    const f = filters[key];
    const total = f.include.size + f.exclude.size;
    if (total > 0) {
      const parts: string[] = [];
      if (f.include.size > 0) {
        if (f.include.size <= 2) {
          const names = [...f.include].map(v => labelMap?.[v] ?? v);
          parts.push(names.join(', '));
        } else {
          parts.push(`${f.include.size} incl`);
        }
      }
      if (f.exclude.size > 0) parts.push(`${f.exclude.size} excl`);
      activeFilters.push({
        label: `${label}: ${parts.join(', ')}`,
        clear: () => dispatch({ type: 'CLEAR_MULTI_SELECT', key }),
      });
    }
  }

  // Home Value chip (mobile only — desktop uses pills)
  // Merge consecutive ranges: "$350-400k" + "$400-450k" → "$350-450k"
  if (isMobile && filters.homeValueTabs.size > 0) {
    // Sort selected tabs by their position in HOME_VALUE_ORDER
    const sorted = HOME_VALUE_ORDER.filter(t => filters.homeValueTabs.has(t));
    // Group into consecutive runs
    const runs: string[][] = [];
    for (const tab of sorted) {
      const idx = HOME_VALUE_ORDER.indexOf(tab);
      const lastRun = runs[runs.length - 1];
      if (lastRun && HOME_VALUE_ORDER.indexOf(lastRun[lastRun.length - 1]) === idx - 1) {
        lastRun.push(tab);
      } else {
        runs.push([tab]);
      }
    }
    // Extract low end from first tab, high end from last tab in each run
    const parselow = (t: string) => t.replace(/^(\$[\d,]+).*/, '$1');
    const parseHigh = (t: string) => {
      if (t === 'Over $1M') return '$1M+';
      const m = t.match(/-([\d,]+k)/);
      return m ? `$${m[1]}` : t;
    };
    const rangeLabels = runs.map(run => {
      if (run.length === 1) return run[0];
      const low = parselow(run[0]);
      const high = parseHigh(run[run.length - 1]);
      return `${low}-${high}`;
    });
    const hvLabel = rangeLabels.join(', ');
    activeFilters.unshift({
      label: `Home Value: ${hvLabel}`,
      clear: () => {
        for (const tab of filters.homeValueTabs) {
          dispatch({ type: 'TOGGLE_HOME_VALUE', tab });
        }
      },
    });
  }

  const hasAnyFilter = filters.homeValueTabs.size > 0 || activeFilters.length > 0 || filters.selectedZips.size > 0 || filters.excludedZips.size > 0;

  const handleToggle = (key: MultiSelectKey) => (value: string, state: 'include' | 'exclude' | 'unset') => {
    dispatch({ type: 'TOGGLE_MULTI_SELECT', key, value, state });
  };

  const handleClear = (key: MultiSelectKey) => () => {
    dispatch({ type: 'CLEAR_MULTI_SELECT', key });
  };

  return (
    <div
      className="pointer-events-auto"
      onMouseEnter={() => window.dispatchEvent(new Event('card-hover-start'))}
    >
      <div className="glass rounded-xl p-3 max-w-[calc(100vw-24px)] mx-auto">
        {/* Title + collapse toggle */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <h1 className="text-white font-bold text-lg leading-tight">
            Searching for <span className="text-purple-400">"Sell Home For Cash"</span> in the past 7 days
          </h1>
          <button
            onClick={() => setFiltersOpen(prev => !prev)}
            className="shrink-0 mt-1 p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <ChevronDown size={16} className={`transition-transform duration-200 ${filtersOpen ? '' : '-rotate-90'}`} />
          </button>
        </div>

        {/* Collapsible filter content */}
        <div className={`overflow-hidden transition-all duration-300 ${filtersOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
        {/* Home value pills (desktop only) */}
        {!isMobile && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            <Pill
              label="All"
              active={allActive}
              onClick={() => dispatch({ type: 'CLEAR_ALL' })}
            />
            {HOME_VALUE_ORDER.map(tab => (
              <Pill
                key={tab}
                label={tab}
                active={filters.homeValueTabs.has(tab)}
                onClick={() => dispatch({ type: 'TOGGLE_HOME_VALUE', tab })}
              />
            ))}
          </div>
        )}

        {/* Multi-select popovers + active chips */}
        <div className="flex items-center gap-2 flex-wrap">
          {isMobile && (
            <MultiSelectPopover
              label="Home Value"
              options={HOME_VALUE_ORDER}
              filter={{ include: filters.homeValueTabs, exclude: new Set<string>() }}
              onToggle={(value, state) => {
                if (state === 'include' && !filters.homeValueTabs.has(value)) {
                  dispatch({ type: 'TOGGLE_HOME_VALUE', tab: value });
                } else if (state !== 'include' && filters.homeValueTabs.has(value)) {
                  dispatch({ type: 'TOGGLE_HOME_VALUE', tab: value });
                }
              }}
              onClear={() => dispatch({ type: 'CLEAR_ALL' })}
            />
          )}
          <MultiSelectPopover
            label={isMobile ? 'Age' : 'Age Range'}
            options={AGE_RANGE_ORDER}
            filter={filters.ageRange}
            onToggle={handleToggle('ageRange')}
            onClear={handleClear('ageRange')}
          />
          <MultiSelectPopover
            label="Gender"
            options={GENDER_ORDER}
            labelMap={{ F: 'Female', M: 'Male', U: 'Unknown' }}
            filter={filters.gender}
            onToggle={handleToggle('gender')}
            onClear={handleClear('gender')}
          />
          <MultiSelectPopover
            label="Income"
            options={INCOME_RANGE_ORDER}
            labelMap={INCOME_RANGE_LABELS}
            filter={filters.incomeRange}
            onToggle={handleToggle('incomeRange')}
            onClear={handleClear('incomeRange')}
          />
          <MultiSelectPopover
            label={isMobile ? 'Credit' : 'Credit Rating'}
            options={CREDIT_RATING_ORDER}
            labelMap={CREDIT_RATING_LABELS}
            filter={filters.creditRating}
            onToggle={handleToggle('creditRating')}
            onClear={handleClear('creditRating')}
          />
          <MultiSelectPopover
            label={isMobile ? 'Worth' : 'Net Worth'}
            options={NET_WORTH_ORDER}
            labelMap={NET_WORTH_LABELS}
            filter={filters.netWorth}
            onToggle={handleToggle('netWorth')}
            onClear={handleClear('netWorth')}
          />
          <MultiSelectPopover
            label="City"
            options={cityOptions}
            filter={filters.city}
            onToggle={handleToggle('city')}
            onClear={handleClear('city')}
          />
          <MultiSelectPopover
            label="County"
            options={countyOptions}
            filter={filters.county}
            onToggle={handleToggle('county')}
            onClear={handleClear('county')}
          />
          <MultiSelectPopover
            label="Language"
            options={languageOptions}
            labelMap={LANGUAGE_CODE_LABELS}
            filter={filters.language}
            onToggle={handleToggle('language')}
            onClear={handleClear('language')}
          />
          <MultiSelectPopover
            label="Seniority"
            options={SENIORITY_ORDER}
            labelMap={SENIORITY_LABELS}
            filter={filters.seniorityLevel}
            onToggle={handleToggle('seniorityLevel')}
            onClear={handleClear('seniorityLevel')}
          />

        </div>
        </div>{/* end collapsible */}

        {/* Applied filters — always visible, even when collapsed */}
        {hasAnyFilter && (
          <div className="flex items-center gap-2 flex-wrap mt-2">
            <ZipChipGroup
              zips={filters.selectedZips}
              variant="included"
              onClear={() => dispatch({ type: 'CLEAR_SELECTED_ZIPS' })}
              onClearOne={zip => dispatch({ type: 'TOGGLE_ZIP', zip })}
            />
            <ZipChipGroup
              zips={filters.excludedZips}
              variant="excluded"
              onClear={() => dispatch({ type: 'CLEAR_EXCLUDED_ZIPS' })}
              onClearOne={zip => dispatch({ type: 'TOGGLE_EXCLUDE_ZIP', zip })}
            />

            {activeFilters.map(f => (
              <span
                key={f.label}
                className="flex items-center gap-1 px-2 py-1 rounded-full bg-purple-600/30 text-purple-200 text-[10px] border border-purple-400/20"
              >
                {f.label}
                <button onClick={f.clear} className="hover:text-white">
                  <X size={10} />
                </button>
              </span>
            ))}

            <button
              onClick={() => dispatch({ type: 'CLEAR_ALL' })}
              className="text-[10px] text-gray-400 hover:text-white transition-colors ml-1"
            >
              Clear All
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
