import fs from 'node:fs';
const f = process.argv[2];
if (!f) { console.log('usage: node patch-rhf-form.mjs PATH'); process.exit(1); }
let c = fs.readFileSync(f, 'utf8');
if (!c.includes('react-hook-form')) { console.log('SKIP not RHF ' + f); process.exit(0); }
if (c.includes('useAutoFill')) { console.log('already ' + f); process.exit(0); }
const Q = "'";
const imp = 'import { useAutoFill } from ' + Q + '@/modules/auto-populate/hooks/useAutoFill' + Q + ';';
const hook = '  const { useSetDefaults } = useAutoFill({});';
const names = ['programId', 'goalId', 'kpiId', 'reportingPeriodId', 'facilityId', 'projectId', 'supplierIds'];
const mapped = names.map(n => '{ name: ' + Q + n + Q + ', fillKey: ' + Q + n + Q + ' }').join(', ');
const eff = '\n  useSetDefaults(setValue, [' + mapped + ']);\n';
const imports = [...c.matchAll(/^import .+$/gm)].map(m => m[0]);
if (imports.length) c = c.replace(imports[imports.length - 1], imports[imports.length - 1] + '\n' + imp);
c = c.replace(/(\s+)register,/, '$1register,$1setValue,');
const idx = c.indexOf('  });');
if (idx > -1) {
  const nl = c.indexOf('\n', idx);
  c = c.slice(0, nl + 1) + hook + eff + c.slice(nl + 1);
}
fs.writeFileSync(f, c);
console.log('PATCHED ' + f);