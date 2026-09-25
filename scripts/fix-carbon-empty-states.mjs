import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const base = 'apps/web/app/(dashboard)/carbon';
const map = {
  'emission-factors': 'Factor',
  'emission-sources': 'Source',
  'emissions': 'Record',
  'projects': 'Project',
  'offsets': 'Offset',
  'targets': 'Target',
  'reports': 'Report',
};

let fixed = 0;
for (const [dir, label] of Object.entries(map)) {
  const file = join(base, dir, 'page.tsx');
  let c;
  try {
    c = readFileSync(file, 'utf8');
  } catch {
    console.log(`NO FILE: ${file}`);
    continue;
  }
  const pattern = /<p className="text-sm text-\[rgb\(var\(--muted\)\)\]">No [^<]*found\.<\/p>/;
  const match = c.match(pattern);
  if (!match) {
    console.log(`NO MATCH: ${file}`);
    continue;
  }
  const replacement = `<div className="py-8 text-center">\n            <p className="text-sm text-[rgb(var(--muted))]">No carbon data available</p>\n            <Button className="mt-3" variant="outline" onClick={() => { resetForm(); setShowForm(true); }}>\n              <PlusCircle className="mr-2 h-4 w-4" />Add ${label}\n            </Button>\n          </div>`;
  const updated = c.replace(pattern, replacement);
  writeFileSync(file, updated, 'utf8');
  console.log(`FIXED: ${file}`);
  fixed++;
}
console.log(`\nTotal fixed: ${fixed}`);