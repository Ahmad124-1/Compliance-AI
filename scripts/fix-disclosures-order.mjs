import fs from 'node:fs';
const f = 'apps/web/app/(dashboard)/esg/disclosures/new/page.tsx';
let c = fs.readFileSync(f, 'utf8');
// Extract the useSetDefaults block
const re = /  const \{ useSetDefaults \} = useAutoFill\(\{\}\);\n  useSetDefaults\(setValue, \[[^\]]*\]\);\n/;
const m = c.match(re);
if (!m) { console.log('NO MATCH'); process.exit(0); }
const block = m[0];
c = c.replace(re, '');
// Find the useForm closing: look for defaultValues block end then });
const useFormEnd = c.indexOf('  });', c.indexOf('useForm<'));
if (useFormEnd === -1) { console.log('NO USEFORM END'); process.exit(0); }
const nl = c.indexOf('\n', useFormEnd);
c = c.slice(0, nl + 1) + block + c.slice(nl + 1);
fs.writeFileSync(f, c);
console.log('FIXED disclosures');