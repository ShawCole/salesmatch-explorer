import type { IntentRecord } from '../types/record';

export interface CountItem {
  name: string;
  value: number;
}

function titleCase(s: string): string {
  return s.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

export function countBy(
  records: IntentRecord[],
  key: keyof IntentRecord,
  order?: string[],
  labelMap?: Record<string, string>,
  normalizeKeys?: boolean,
): CountItem[] {
  const map = new Map<string, number>();
  for (const r of records) {
    const v = r[key];
    if (v != null && v !== '') {
      const k = normalizeKeys ? titleCase(String(v).trim()) : String(v);
      map.set(k, (map.get(k) || 0) + 1);
    }
  }

  let items: CountItem[];
  if (order) {
    items = order
      .filter(k => map.has(k))
      .map(k => ({ name: labelMap?.[k] ?? k, value: map.get(k)! }));
    // Append any values not in order
    for (const [k, v] of map) {
      if (!order.includes(k)) {
        items.push({ name: labelMap?.[k] ?? k, value: v });
      }
    }
  } else {
    items = Array.from(map, ([name, value]) => ({
      name: labelMap?.[name] ?? name,
      value,
    })).sort((a, b) => b.value - a.value);
  }

  return items;
}

export function topN(items: CountItem[], n: number): CountItem[] {
  return items.slice(0, n);
}

export function countByZip(records: IntentRecord[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const r of records) {
    const zip = r.SKIPTRACE_ZIP;
    if (zip) {
      map.set(zip, (map.get(zip) || 0) + 1);
    }
  }
  return map;
}

export interface PyramidItem {
  ageRange: string;
  male: number;
  female: number;
}

export function buildPyramid(
  records: IntentRecord[],
  ageOrder: string[],
): PyramidItem[] {
  const map = new Map<string, { male: number; female: number }>();
  for (const age of ageOrder) {
    map.set(age, { male: 0, female: 0 });
  }
  for (const r of records) {
    let age = (r.AGE_RANGE || '').trim();
    const gender = r.GENDER;

    // Consolidate 65+ variants into single bin
    const lower = age.toLowerCase();
    if (lower === '65 and older' || lower === '65-74' || lower === '75+' || lower === '65+') {
      age = '65 and older';
    }

    if (age && map.has(age)) {
      const entry = map.get(age)!;
      if (gender === 'M' || gender === 'Male') entry.male++;
      else if (gender === 'F' || gender === 'Female') entry.female++;
    }
  }
  return ageOrder.map(age => ({
    ageRange: age,
    male: map.get(age)!.male,
    female: -map.get(age)!.female, // negative for left side
  }));
}
