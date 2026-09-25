import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const base = 'apps/web/app/(dashboard)/carbon';
const dirs = ['facilities', 'emission-sources', 'emissions', 'emission-factors', 'projects', 'offsets', 'targets', 'reports', 'calculator', 'scopes', 'ghg'];

for (const d of dirs) {
  const f = join(base, d, 'page.tsx');
  if (!existsSync(f)) { console.log(`NO FILE: ${d}`); continue; }
  const c = readFileSync(f, 'utf8');
  const hasTrash = c.includes('Trash2');
  const hasDelete = /handleDelete|deleteFacility|deleteEmission|deleteFactor|deleteProject|deleteOffset|deleteTarget|deleteReport|deleteSource|deleteScope/.test(c);
  console.log(`${d} => Trash2: ${hasTrash}, DeleteHandler: ${hasDelete}`);
}