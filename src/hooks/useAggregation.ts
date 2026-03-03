import { useMemo } from 'react';
import type { IntentRecord } from '../types/record';
import { countBy, topN, type CountItem } from '../utils/aggregation';

export function useAggregation(
  records: IntentRecord[],
  key: keyof IntentRecord,
  order?: string[],
  labelMap?: Record<string, string>,
  top?: number,
  normalizeKeys?: boolean,
): CountItem[] {
  return useMemo(() => {
    const items = countBy(records, key, order, labelMap, normalizeKeys);
    return top ? topN(items, top) : items;
  }, [records, key, order, labelMap, top, normalizeKeys]);
}
