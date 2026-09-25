import fs from 'node:fs';
const f = process.argv[2];
if (!f) { console.log('usage: node patch-form.mjs path'); process.exit(1); }
if (!fs.existsSync(f)) { console.log('no file'); process.exit(1); }
let c = fs.readFileSync(f, 'utf8');
if (c.includes('useAutoFill')) { console.log('already'); process.exit(0); }
const Q = String.fromCharCode(39);
const N = String.fromCharCode(10);
const imp = 'import { useAutoFill } from ' + Q + '@/modules/auto-populate/hooks/useAutoFill' + Q + ';';
const hook = '  const { autoFillState } = useAutoFill({});';
const keys = 'facilityId,projectId,supplierIds,reportingPeriodId,programId,goalId,kpiId'.split(',');
const mapp = keys.map(k => '{stateKey:' + Q + k + Q + ',fillKey:' + Q + k + Q + '}').join(',');
const eff = N + '  useEffect(() => { autoFillState(setForm, [' + mapp + ']); }, [autoFillState]);' + N;
const KEYS = ['facilityId', 'projectId', 'supplierIds', 'reportingPeriodId', 'programId', 'goalId', 'kpiId', 'documentIds'];
const hasKey = KEYS.some(k => c.includes(k));
if (!hasKey) { console.log('SKIP nokeys ' + f); process.exit(0); }
if (!c.includes('setForm')) { console.log('SKIP nosetForm ' + f); process.exit(0); }
const im = [...c.matchAll(/^import .+$/gm)].map(m => m[0]);
if (!im.length) { console.log('no imports'); process.exit(1); }
c = c.replace(im[im.length - 1], im[im.length - 1] + N + imp);
c = c.replace(/^import \{([^}]*)\} from 'react';/m, (m, g) => 'import { ' + g.trim() + ', useEffect } from ' + Q + 'react' + Q + ';');
const fn = c.match(/export default function \w+\(\)/);
if (fn) { c = c.replace(fn[0], fn[0] + N + N + hook); }
const ri = c.indexOf('  return (');
if (ri > -1) { const at = c.lastIndexOf(N, ri); c = c.slice(0, at) + eff + c.slice(at); }
fs.writeFileSync(f, c);
console.log('PATCHED ' + f);
