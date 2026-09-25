import { readFileSync } from 'node:fs';

const s = readFileSync('apps/api/src/services/carbon.service.ts', 'utf8');
console.log('SERVICE has deleteCalculationHistory:', s.includes('deleteCalculationHistory'));
const i = s.indexOf('getCalculationHistory');
console.log('AROUND GET:');
console.log(s.substring(i - 50, i + 350));

const r = readFileSync('apps/api/src/routes/carbon.routes.ts', 'utf8');
const ci = r.indexOf('calculations');
console.log('ROUTES calc section:');
console.log(ci >= 0 ? r.substring(ci - 100, ci + 600) : 'NONE');