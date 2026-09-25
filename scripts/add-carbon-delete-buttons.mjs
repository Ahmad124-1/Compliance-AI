import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const base = 'apps/web/app/(dashboard)/carbon';

const configs = [
  { dir: 'scopes', var: 's', method: 'deleteScope', query: "['carbon', 'scopes']" },
  { dir: 'emission-factors', var: 'f', method: 'deleteEmissionFactor', query: "['carbon', 'emissionFactors']" },
  { dir: 'projects', var: 'p', method: 'deleteProject', query: "['carbon', 'projects']" },
  { dir: 'offsets', var: 'o', method: 'deleteOffset', query: "['carbon', 'offsets']" },
  { dir: 'targets', var: 't', method: 'deleteTarget', query: "['carbon', 'targets']" },
  { dir: 'reports', var: 'r', method: 'deleteReport', query: "['carbon', 'reports']" },
];

for (const cfg of configs) {
  const file = join(base, cfg.dir, 'page.tsx');
  let c = readFileSync(file, 'utf8');
  const original = c;

  // 1. Add Trash2 to lucide import
  if (!c.includes('Trash2')) {
    c = c.replace(/import \{ PlusCircle, Edit/, 'import { PlusCircle, Edit, Trash2');
  }

  // 2. Add handleDelete function before the final return (
  if (!c.includes(`const handleDelete`)) {
    const handler = `  const handleDelete = async (id: string) => {
    await carbonService.${cfg.method}(id);
    queryClient.invalidateQueries({ queryKey: ${cfg.query} });
  };

`;
    // Insert before the last "return (" that belongs to the component
    const idx = c.lastIndexOf('  return (');
    if (idx === -1) {
      console.log(`NO RETURN FOUND: ${file}`);
      continue;
    }
    c = c.slice(0, idx) + handler + c.slice(idx);
  }

  // 3. Add delete button after each edit button
  const editBtn = `<Button variant="ghost" size="sm" onClick={() => handleEdit(${cfg.var})}><Edit className="h-4 w-4" /></Button>`;
  const deleteBtn = `\n                        <Button variant="ghost" size="sm" onClick={() => handleDelete(${cfg.var}.id)}><Trash2 className="h-4 w-4" /></Button>`;
  const count = c.split(editBtn).length - 1;
  if (count > 0) {
    c = c.split(editBtn).join(editBtn + deleteBtn);
  }

  if (c !== original) {
    writeFileSync(file, c, 'utf8');
    console.log(`FIXED: ${file} (edit buttons: ${count})`);
  } else {
    console.log(`NO CHANGES: ${file}`);
  }
}