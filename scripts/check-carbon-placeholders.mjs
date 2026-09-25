import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const dir = 'apps/web/app/(dashboard)/carbon';
const files = [];
function walk(d) {
  for (const f of readdirSync(d)) {
    const p = join(d, f);
    if (statSync(p).isDirectory()) walk(p);
    else if (p.endsWith('.tsx')) files.push(p);
  }
}
walk(dir);

let realPlaceholder = false;
for (const f of files) {
  const c = readFileSync(f, 'utf8');
  // Match placeholder text content (not HTML placeholder= attributes)
  const lines = c.split('\n');
  lines.forEach((line, idx) => {
    if (/coming soon|under construction|mock page|todo/i.test(line)) {
      console.log(`REAL PLACEHOLDER ${f}:${idx + 1}: ${line.trim()}`);
      realPlaceholder = true;
    }
    // placeholder="..." attribute usage is fine; only flag text like "Placeholder" as visible text
    if (/>\s*Placeholder\s*</i.test(line)) {
      console.log(`REAL PLACEHOLDER TEXT ${f}:${idx + 1}: ${line.trim()}`);
      realPlaceholder = true;
    }
  });
}
if (!realPlaceholder) {
  console.log('CLEAN: No real placeholder components/text found. Only HTML placeholder= attributes exist (legitimate input hints).');
}