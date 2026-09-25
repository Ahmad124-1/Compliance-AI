import { readFileSync } from 'node:fs';

const s = readFileSync('apps/web/src/modules/carbon/service.ts', 'utf8');
const i = s.indexOf('calculations');
console.log('SERVICE calc section:');
console.log(i >= 0 ? s.substring(i - 100, i + 400) : 'NONE');

const c = readFileSync('apps/web/app/(dashboard)/carbon/calculator/page.tsx', 'utf8');
const h = c.indexOf('Calculations');
console.log('---CALC PAGE HISTORY AREA---');
console.log(h >= 0 ? c.substring(h - 200, h + 1800) : 'NOT FOUND');