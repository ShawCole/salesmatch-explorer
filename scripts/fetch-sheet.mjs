import { writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { read, utils } from 'xlsx';

const SHEET_ID = '1lQGNTrQs892piv-kZSjeOvMZZcB7EOLqwUDinVRXA6s';
const EXPORT_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=xlsx`;

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = resolve(__dirname, '../src/data/records.json');

async function fetchSheet() {
  console.log('Fetching Google Sheet as xlsx...');
  const res = await fetch(EXPORT_URL);
  if (!res.ok) {
    throw new Error(`Failed to fetch sheet: ${res.status} ${res.statusText}`);
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  console.log(`Downloaded ${(buffer.length / 1024 / 1024).toFixed(1)}MB`);

  const wb = read(buffer);
  console.log(`Sheets: ${wb.SheetNames.join(', ')}`);

  const records = [];
  for (const sheetName of wb.SheetNames) {
    if (/master/i.test(sheetName)) continue;
    const rows = utils.sheet_to_json(wb.Sheets[sheetName]);
    for (const row of rows) {
      row.HOME_VALUE_TAB = sheetName;
      if (row.SKIPTRACE_ZIP != null) {
        row.SKIPTRACE_ZIP = String(row.SKIPTRACE_ZIP).padStart(5, '0');
      }
      if (row.PERSONAL_ZIP != null) {
        row.PERSONAL_ZIP = String(row.PERSONAL_ZIP).padStart(5, '0');
      }
      records.push(row);
    }
  }

  mkdirSync(resolve(__dirname, '../src/data'), { recursive: true });
  writeFileSync(OUTPUT_PATH, JSON.stringify(records));

  const tabs = [...new Set(records.map(r => r.HOME_VALUE_TAB))];
  console.log(`Total records: ${records.length}`);
  console.log(`Home value tabs (${tabs.length}): ${tabs.join(', ')}`);
  console.log(`Fields: ${Object.keys(records[0] || {}).length}`);
  console.log(`Written to ${OUTPUT_PATH}`);
}

fetchSheet().catch(err => {
  console.error('Sheet fetch failed:', err.message);
  process.exit(1);
});
