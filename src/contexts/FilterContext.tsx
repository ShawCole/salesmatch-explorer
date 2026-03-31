import { createContext, useContext, useReducer, useMemo, useEffect, useRef, useState, useCallback, type ReactNode } from 'react';
import type { MultiSelectFilter } from '../types/record';
import type { DashboardResponse } from '../types/dashboard';
import { searchParamsToFilters, syncFiltersToURL } from '../utils/urlFilters';

function emptyFilter(): MultiSelectFilter {
  return { include: new Set(), exclude: new Set() };
}

export interface FilterState {
  topic: string;
  intent: MultiSelectFilter;
  ageRange: MultiSelectFilter;
  gender: MultiSelectFilter;
  incomeRange: MultiSelectFilter;
  netWorth: MultiSelectFilter;
  creditRating: MultiSelectFilter;
  seniorityLevel: MultiSelectFilter;
  homeowner: MultiSelectFilter;
  city: MultiSelectFilter;
  county: MultiSelectFilter;
  language: MultiSelectFilter;
  state: MultiSelectFilter;
  selectedZips: Set<string>;
  excludedZips: Set<string>;
}

export type MultiSelectKey =
  | 'intent' | 'ageRange' | 'gender' | 'incomeRange' | 'netWorth'
  | 'creditRating' | 'seniorityLevel' | 'homeowner' | 'city' | 'county' | 'language' | 'state';

type Action =
  | { type: 'SET_TOPIC'; topic: string }
  | { type: 'TOGGLE_MULTI_SELECT'; key: MultiSelectKey; value: string; state: 'include' | 'exclude' | 'unset' }
  | { type: 'CLEAR_MULTI_SELECT'; key: MultiSelectKey }
  | { type: 'TOGGLE_ZIP'; zip: string }
  | { type: 'TOGGLE_EXCLUDE_ZIP'; zip: string }
  | { type: 'CLEAR_SELECTED_ZIPS' }
  | { type: 'CLEAR_EXCLUDED_ZIPS' }
  | { type: 'CLEAR_ALL' };

const DEFAULT_TOPIC = 'sales_revenue';

export type DatasetKey = 'sales_revenue' | 'sales_headcount' | 'csm_revenue' | 'csm_headcount';

const DATASET_URLS: Record<DatasetKey, string> = {
  sales_revenue: '/datasets/sales_revenue.json',
  sales_headcount: '/datasets/sales_headcount.json',
  csm_revenue: '/datasets/csm_revenue.json',
  csm_headcount: '/datasets/csm_headcount.json',
};

function buildEmptyState(): FilterState {
  return {
    topic: DEFAULT_TOPIC,
    intent: emptyFilter(),
    ageRange: emptyFilter(),
    gender: emptyFilter(),
    incomeRange: emptyFilter(),
    netWorth: emptyFilter(),
    creditRating: emptyFilter(),
    seniorityLevel: emptyFilter(),
    homeowner: emptyFilter(),
    city: emptyFilter(),
    county: emptyFilter(),
    language: emptyFilter(),
    state: emptyFilter(),
    selectedZips: new Set(),
    excludedZips: new Set(),
  };
}

function buildInitialState(): FilterState {
  const fromURL = searchParamsToFilters(window.location.search);
  return fromURL ?? buildEmptyState();
}

const initialState = buildInitialState();

function reducer(state: FilterState, action: Action): FilterState {
  switch (action.type) {
    case 'SET_TOPIC':
      return { ...buildEmptyState(), topic: action.topic };
    case 'TOGGLE_MULTI_SELECT': {
      const prev = state[action.key];
      const include = new Set(prev.include);
      const exclude = new Set(prev.exclude);
      include.delete(action.value);
      exclude.delete(action.value);
      if (action.state === 'include') include.add(action.value);
      else if (action.state === 'exclude') exclude.add(action.value);
      return { ...state, [action.key]: { include, exclude } };
    }
    case 'CLEAR_MULTI_SELECT':
      return { ...state, [action.key]: emptyFilter() };
    case 'TOGGLE_ZIP': {
      const next = new Set(state.selectedZips);
      if (next.has(action.zip)) next.delete(action.zip);
      else next.add(action.zip);
      return { ...state, selectedZips: next };
    }
    case 'TOGGLE_EXCLUDE_ZIP': {
      const next = new Set(state.excludedZips);
      if (next.has(action.zip)) next.delete(action.zip);
      else next.add(action.zip);
      return { ...state, excludedZips: next };
    }
    case 'CLEAR_SELECTED_ZIPS':
      return { ...state, selectedZips: new Set() };
    case 'CLEAR_EXCLUDED_ZIPS':
      return { ...state, excludedZips: new Set() };
    case 'CLEAR_ALL':
      return { ...buildEmptyState(), topic: state.topic };
    default:
      return state;
  }
}

// Serialize filter state to a stable string for effect dependency comparison.
// This avoids re-firing effects due to new Set/object references.
function serializeFilters(f: FilterState): string {
  const serSet = (s: Set<string>) => [...s].sort().join(',');
  const serMF = (m: MultiSelectFilter) => `${serSet(m.include)}|${serSet(m.exclude)}`;
  return [
    f.topic,
    serMF(f.intent), serMF(f.ageRange), serMF(f.gender),
    serMF(f.incomeRange), serMF(f.netWorth), serMF(f.creditRating),
    serMF(f.seniorityLevel), serMF(f.homeowner), serMF(f.city), serMF(f.county),
    serMF(f.language), serMF(f.state),
    serSet(f.selectedZips), serSet(f.excludedZips),
  ].join(';;');
}

export interface Topic {
  topic_id: number;
  topic_slug: string;
  topic_label: string;
  category: string;
  signal_count: string;
}

interface FilterContextValue {
  filters: FilterState;
  apiData: DashboardResponse | null;
  loading: boolean;
  dispatch: React.Dispatch<Action>;
  topics: Topic[];
  dataset: DatasetKey;
  setDataset: (key: DatasetKey) => void;
}

const FilterContext = createContext<FilterContextValue>(null!);

export function FilterProvider({ children }: { children: ReactNode }) {
  const [filters, dispatch] = useReducer(reducer, initialState);
  const [apiData, setApiData] = useState<DashboardResponse | null>(null);
  const [fullData, setFullData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [dataset, setDatasetRaw] = useState<DatasetKey>(() => {
    const params = new URLSearchParams(window.location.search);
    return (params.get('dataset') as DatasetKey) || 'sales_revenue';
  });
  const topics: Topic[] = [];
  const cache = useRef<Partial<Record<DatasetKey, DashboardResponse>>>({});

  const setDataset = useCallback((key: DatasetKey) => {
    setDatasetRaw(key);
    // Reset filters when switching dataset
    dispatch({ type: 'CLEAR_ALL' });
    // Update URL
    const url = new URL(window.location.href);
    url.searchParams.set('dataset', key);
    window.history.replaceState({}, '', url.toString());
  }, []);

  // Load static JSON when dataset changes
  useEffect(() => {
    const cached = cache.current[dataset];
    if (cached) {
      setFullData(cached);
      setApiData(cached);
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch(DATASET_URLS[dataset])
      .then(r => r.json())
      .then((data: DashboardResponse) => {
        cache.current[dataset] = data;
        setFullData(data);
        setApiData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load dataset:', err);
        setLoading(false);
      });
  }, [dataset]);

  // Client-side filtering when filters change
  const filterKey = serializeFilters(filters);

  useEffect(() => {
    if (!fullData) return;

    // Check if any filters are active
    const hasFilters = filters.state.include.size > 0 || filters.state.exclude.size > 0 ||
      filters.city.include.size > 0 || filters.ageRange.include.size > 0 ||
      filters.gender.include.size > 0 || filters.incomeRange.include.size > 0 ||
      filters.netWorth.include.size > 0 || filters.creditRating.include.size > 0 ||
      filters.seniorityLevel.include.size > 0 || filters.homeowner.include.size > 0 ||
      filters.language.include.size > 0 || filters.selectedZips.size > 0 ||
      filters.excludedZips.size > 0;

    if (!hasFilters) {
      setApiData(fullData);
      return;
    }

    // Apply geo filters client-side (state, city, zip)
    let filteredCounties = fullData.geo.counties;
    let filteredZips = fullData.geo.zips;

    if (filters.state.include.size > 0) {
      const states = filters.state.include;
      filteredCounties = filteredCounties.filter(c => states.has(c.state));
      filteredZips = filteredZips.filter(z => states.has(z.state));
    }
    if (filters.state.exclude.size > 0) {
      const states = filters.state.exclude;
      filteredCounties = filteredCounties.filter(c => !states.has(c.state));
      filteredZips = filteredZips.filter(z => !states.has(z.state));
    }
    if (filters.selectedZips.size > 0) {
      filteredZips = filteredZips.filter(z => filters.selectedZips.has(z.zip));
      const zipFips = new Set(filteredZips.map(z => z.county_fips));
      filteredCounties = filteredCounties.filter(c => zipFips.has(c.fips));
    }
    if (filters.excludedZips.size > 0) {
      filteredZips = filteredZips.filter(z => !filters.excludedZips.has(z.zip));
    }

    const filteredTotal = filteredZips.reduce((sum, z) => sum + z.total, 0) || fullData.filteredContacts;

    setApiData({
      ...fullData,
      filteredContacts: filteredTotal,
      geo: { counties: filteredCounties, zips: filteredZips },
      tooltipGeo: { counties: fullData.geo.counties, zips: fullData.geo.zips },
    });
  }, [filterKey, fullData]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync filter state → URL bar
  useEffect(() => {
    syncFiltersToURL(filters);
  }, [filterKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const value = useMemo(() => ({
    filters,
    apiData,
    loading,
    dispatch,
    topics,
    dataset,
    setDataset,
  }), [filters, apiData, loading, topics, dataset, setDataset]);

  return (
    <FilterContext.Provider value={value}>
      {children}
    </FilterContext.Provider>
  );
}

export function useFilters() {
  return useContext(FilterContext);
}
