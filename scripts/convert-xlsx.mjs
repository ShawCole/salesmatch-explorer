import { readFileSync, writeFileSync } from 'fs';
import { read, utils } from 'xlsx';

const wb = read(readFileSync('/tmp/sheet.xlsx'));

const records = [];
for (const sheetName of wb.SheetNames) {
  if (/master/i.test(sheetName)) continue;
  const rows = utils.sheet_to_json(wb.Sheets[sheetName]);
  for (const row of rows) {
    // Inject tab name as HOME_VALUE_TAB
    row.HOME_VALUE_TAB = sheetName;
    // Normalize ZIP to 5-digit zero-padded string
    if (row.SKIPTRACE_ZIP != null) {
      row.SKIPTRACE_ZIP = String(row.SKIPTRACE_ZIP).padStart(5, '0');
    }
    if (row.PERSONAL_ZIP != null) {
      row.PERSONAL_ZIP = String(row.PERSONAL_ZIP).padStart(5, '0');
    }
    records.push(row);
  }
}

console.log(`Total records: ${records.length}`);
console.log(`Sheet names: ${wb.SheetNames.join(', ')}`);

// Show sample of first record's keys
if (records.length > 0) {
  console.log(`Fields (${Object.keys(records[0]).length}):`, Object.keys(records[0]).join(', '));
}

// Show distinct HOME_VALUE_TAB values
const tabs = [...new Set(records.map(r => r.HOME_VALUE_TAB))];
console.log(`Home value tabs (${tabs.length}):`, tabs.join(', '));

// Show distinct ZIP count
const zips = new Set(records.map(r => r.SKIPTRACE_ZIP).filter(Boolean));
console.log(`Distinct ZIPs: ${zips.size}`);

writeFileSync(
  new URL('../src/data/records.json', import.meta.url),
  JSON.stringify(records)
);
console.log('Written to src/data/records.json');
