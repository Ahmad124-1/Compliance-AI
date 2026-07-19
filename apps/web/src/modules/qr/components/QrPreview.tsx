'use client';

import { useMemo } from 'react';

interface QrPreviewProps {
  code: string;
  size?: number;
  className?: string;
}

/**
 * Deterministic visual representation of a QR code derived from its code string.
 * Pure CSS/SVG so it works offline without external libraries.
 */
export function QrPreview({ code, size = 160, className }: QrPreviewProps) {
  const cells = 21;
  const grid = useMemo(() => {
    let h = 2166136261;
    for (let i = 0; i < code.length; i++) {
      h ^= code.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    const bits: boolean[] = [];
    for (let i = 0; i < cells * cells; i++) {
      h ^= h << 13;
      h ^= h >>> 17;
      h ^= h << 5;
      bits.push((h & 1) === 1);
    }
    return bits;
  }, [code]);

  const isFinder = (r: number, c: number) => {
    const inBox = (br: number, bc: number) => r >= br && r < br + 7 && c >= bc && c < bc + 7;
    return inBox(0, 0) || inBox(0, cells - 7) || inBox(cells - 7, 0);
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${cells} ${cells}`}
      className={className}
      role="img"
      aria-label={`QR preview for ${code}`}
      style={{ background: '#fff', borderRadius: 8 }}
    >
      {grid.map((on, i) => {
        const r = Math.floor(i / cells);
        const c = i % cells;
        if (isFinder(r, c)) return null;
        if (!on) return null;
        return <rect key={i} x={c} y={r} width={1} height={1} fill="#0f172a" />;
      })}
      {[
        [0, 0],
        [0, cells - 7],
        [cells - 7, 0],
      ].map(([br, bc], i) => (
        <g key={i}>
          <rect x={bc} y={br} width={7} height={7} fill="#0f172a" />
          <rect x={bc + 1} y={br + 1} width={5} height={5} fill="#fff" />
          <rect x={bc + 2} y={br + 2} width={3} height={3} fill="#0f172a" />
        </g>
      ))}
    </svg>
  );
}
