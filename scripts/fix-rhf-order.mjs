import fs from 'node:fs';
const f = process.argv[2];
if (!f) { console.log('usage: node fix-rhf-order.mjs PATH'); process.exit(1); }
let c = fs.readFileSync(f, 'utf8');
// Match: const { useSetDefaults } = useAutoFill({});\n  useSetDefaults(setValue, [...]);
// and remove from current position
const hookRe = /  const \{ useSetDefaults \} = useAutoFill\(\{\}\);\n  useSetDefaults\(setValue, \[[^\]]*\]\);\n/;
const m = c.match(hookRe);
if (!m) { console.log('NO MATCH ' + f); process.exit(0); }
const hookBlock = m[0];
c = c.replace(hookRe, '');
// Insert after the useForm closing (the last `});` before a blank line followed by `const createMutation`
const target = '  });\n\n  const createMutation';
const idx = c.indexOf(target);
if (idx === -1) { console.log('NO ANCHOR ' + f); process.exit(0); }
c = c.slice(0, idx) + '  });\n' + hookBlock.slice(0, -1) + '\n\n  const createMutation' + c.slice(idx + target.length);
fs.writeFileSync(f, c);
console.log('FIXED ' + f);