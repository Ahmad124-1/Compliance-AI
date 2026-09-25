import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const base = 'apps/web/app/(dashboard)/carbon';
const dirs = ['scopes', 'emission-factors', 'projects', 'offsets', 'targets', 'reports'];

for (const d of dirs) {
  const f = join(base, d, 'page.tsx');
  const c = readFileSync(f, 'utf8');
  console.log(`\n===== ${d} =====`);
  // import line
  const imp = c.match(/import \{ [^\n]*lucide-react[^\n]*/);
  console.log('IMPORT:', imp ? imp[0] : 'NOT FOUND');
  // query key
  const qk = c.match(/queryKey: \['carbon', '[^\]]+'\]/);
  console.log('QUERYKEY:', qk ? qk[0] : 'NOT FOUND');
  // handleEdit line
  const he = c.match(/const handleEdit = \(([^)]*)\) => \{/);
  console.log('EDIT_SIG:', he ? he[0] : 'NOT FOUND');
  // actions buttons
  const btns = [...c.matchAll(/<div className="flex gap-2">[\s\S]*?<\/div>\s*<\/td>/g)];
  btns.forEach((b, i) => {
    console.log(`ACTIONS_${i}:`, b[0].replace(/\n\s*/g, ' '));
  });
  // empty state now contains Button - check it has resetForm/showForm closure context - verify handleDelete absent + check what row var used in map
  const mapRow = c.match(/\{([a-z])\.id\}[^}]*/);
  console.log('ROWVAR:', mapRow ? mapRow[1] : 'none');
}