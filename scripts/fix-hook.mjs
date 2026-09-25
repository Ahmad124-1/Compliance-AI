import fs from 'node:fs';
const p = 'apps/web/src/modules/auto-populate/hooks/useAutoFill.ts';
let c = fs.readFileSync(p, 'utf8');
c = c.replace("import { useEffect } from 'react';", "import { useCallback, useEffect } from 'react';");
const N = String.fromCharCode(10);
const helper = N + '  const autoFillState = useCallback((setForm, mapping) => {' + N + '    if (isLoading) return;' + N + '    const patch = {};' + N + '    for (const m of mapping) {' + N + '      const v = fill[m.fillKey];' + N + "      if (v != null && v !== '') patch[m.stateKey] = m.transform ? m.transform(v) : v;" + N + '    }' + N + '    if (Object.keys(patch).length > 0) setForm((prev) => ({ ...prev, ...patch }));' + N + '  }, [fill, isLoading]);' + N + N;
c = c.replace('  return { fill, isLoading, refetch, useSetDefaults };', helper + '  return { fill, isLoading, refetch, useSetDefaults, autoFillState };');
fs.writeFileSync(p, c);
console.log('hooked');