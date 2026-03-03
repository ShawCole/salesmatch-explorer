import { useMemo } from 'react';
import type { IntentRecord } from '../types/record';
import { countByZip } from '../utils/aggregation';

export function useZipAggregation(records: IntentRecord[]) {
  return useMemo(() => countByZip(records), [records]);
}
