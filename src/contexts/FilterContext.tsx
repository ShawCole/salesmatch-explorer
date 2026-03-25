import { createContext, useContext, useReducer, useMemo, useEffect, useRef, useState, type ReactNode } from 'react';
import type { MultiSelectFilter } from '../types/record';
import type { DashboardResponse } from '../types/dashboard';
import { fetchDashboard } from '../utils/apiClient';
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

const DEFAULT_TOPIC = 'wealth-management-services';

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
}

const FilterContext = createContext<FilterContextValue>(null!);

export function FilterProvider({ children }: { children: ReactNode }) {
  const [filters, dispatch] = useReducer(reducer, initialState);
  const [apiData, setApiData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [topics, setTopics] = useState<Topic[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch available topics on mount
  useEffect(() => {
    const API_BASE = import.meta.env.VITE_API_URL || '';
    const API_KEY = import.meta.env.VITE_API_KEY || '';
    const headers: Record<string, string> = {};
    if (API_KEY) headers['x-api-key'] = API_KEY;
    fetch(`${API_BASE}/api/topics`, { headers })
      .then(r => r.json())
      .then((data: Topic[]) => {
        // Filter out "unknown" and topics with 0 signals
        setTopics(data.filter(t => t.topic_slug !== 'unknown' && Number(t.signal_count) > 0));
      })
      .catch(err => console.error('Failed to fetch topics:', err));
  }, []);

  // Stable serialized key — only changes when filter *values* actually change
  const filterKey = serializeFilters(filters);
  // Keep a ref to the latest filters so the fetch always reads current state
  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  // Sync filter state → URL bar
  useEffect(() => {
    syncFiltersToURL(filters);
  }, [filterKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch dashboard data when filters change (debounced)
  useEffect(() => {
    // Cancel any pending debounce
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const doFetch = () => {
      // Abort previous in-flight request
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      fetchDashboard(filtersRef.current, controller.signal)
        .then(data => {
          if (!controller.signal.aborted) {
            setApiData(data);
            setLoading(false);
          }
        })
        .catch(err => {
          if (err.name === 'AbortError' || controller.signal.aborted) return;
          console.error('Dashboard fetch failed:', err);
          setLoading(false);
        });
    };

    // First load: fetch immediately. Subsequent: debounce 300ms.
    if (!apiData) {
      doFetch();
    } else {
      debounceRef.current = setTimeout(doFetch, 300);
    }

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [filterKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup abort on unmount — but DON'T abort, let the request finish
  // so strict-mode remount can pick up the result
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const value = useMemo(() => ({
    filters,
    apiData,
    loading,
    dispatch,
    topics,
  }), [filters, apiData, loading, topics]);

  return (
    <FilterContext.Provider value={value}>
      {children}
    </FilterContext.Provider>
  );
}

export function useFilters() {
  return useContext(FilterContext);
}
