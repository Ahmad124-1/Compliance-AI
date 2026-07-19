'use client';

import { cn } from '@/lib/cn';

const PALETTE = [
  'rgb(59 130 246)',
  'rgb(34 197 94)',
  'rgb(245 158 11)',
  'rgb(239 68 68)',
  'rgb(168 85 247)',
  'rgb(14 165 233)',
  'rgb(236 72 153)',
  'rgb(132 204 22)',
];

export function colorAt(i: number): string {
  return PALETTE[i % PALETTE.length];
}

export interface BarDatum {
  label: string;
  value: number;
  color?: string;
}

export function BarChart({
  data,
  height = 220,
  format = (v: number) => String(v),
  className,
}: {
  data: BarDatum[];
  height?: number;
  format?: (v: number) => string;
  className?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <div className="flex h-full items-end gap-2">
        {data.map((d, i) => (
          <div key={d.label} className="flex flex-1 flex-col items-center justify-end gap-1">
            <span className="text-xs text-[rgb(var(--muted))]">{format(d.value)}</span>
            <div
              className="w-full rounded-t-md"
              style={{ height: `${(d.value / max) * 78}%`, background: d.color ?? colorAt(i), minHeight: 2 }}
              title={`${d.label}: ${format(d.value)}`}
            />
            <span className="truncate text-[11px] text-[rgb(var(--muted))]">{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export interface DonutSlice {
  label: string;
  value: number;
  color?: string;
}

export function DonutChart({
  data,
  size = 180,
  format = (v: number) => String(v),
}: {
  data: DonutSlice[];
  size?: number;
  format?: (v: number) => string;
}) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const radius = size / 2 - 10;
  const cx = size / 2;
  const cy = size / 2;
  let offset = 0;
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Distribution">
        <circle cx={cx} cy={cy} r={radius} fill="none" stroke="rgb(var(--border-color))" strokeWidth={14} />
        {data.map((d, i) => {
          const frac = d.value / total;
          const dash = frac * 2 * Math.PI * radius;
          const el = (
            <circle
              key={d.label}
              cx={cx}
              cy={cy}
              r={radius}
              fill="none"
              stroke={d.color ?? colorAt(i)}
              strokeWidth={14}
              strokeDasharray={`${dash} ${2 * Math.PI * radius - dash}`}
              strokeDashoffset={-offset}
              transform={`rotate(-90 ${cx} ${cy})`}
            />
          );
          offset += dash;
          return el;
        })}
        <text x={cx} y={cy - 4} textAnchor="middle" className="fill-[rgb(var(--text))]" fontSize={18} fontWeight={600}>
          {format(total)}
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle" className="fill-[rgb(var(--muted))]" fontSize={11}>
          total
        </text>
      </svg>
      <ul className="space-y-1 text-sm">
        {data.map((d, i) => (
          <li key={d.label} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.color ?? colorAt(i) }} />
            <span className="text-[rgb(var(--text))]">{d.label}</span>
            <span className="text-[rgb(var(--muted))]">({format(d.value)})</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export interface LinePoint {
  label: string;
  value: number;
}

export function LineChart({
  data,
  height = 220,
  format = (v: number) => String(v),
  className,
}: {
  data: LinePoint[];
  height?: number;
  format?: (v: number) => string;
  className?: string;
}) {
  const width = 600;
  const pad = 30;
  const max = Math.max(1, ...data.map((d) => d.value));
  const step = data.length > 1 ? (width - pad * 2) / (data.length - 1) : 0;
  const pts = data.map((d, i) => ({
    x: pad + i * step,
    y: height - pad - (d.value / max) * (height - pad * 2),
  }));
  const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  return (
    <div className={cn('w-full overflow-x-auto', className)}>
      <svg width={Math.max(width, data.length * 40)} height={height} viewBox={`0 0 ${Math.max(width, data.length * 40)} ${height}`} role="img" aria-label="Trend">
        <path d={path} fill="none" stroke="rgb(59 130 246)" strokeWidth={2} />
        {pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={3} fill="rgb(59 130 246)" />
        ))}
        {data.map((d, i) => (
          <text key={i} x={pts[i].x} y={height - 8} textAnchor="middle" className="fill-[rgb(var(--muted))]" fontSize={10}>
            {d.label}
          </text>
        ))}
        {data.map((d, i) => (
          <text key={`v${i}`} x={pts[i].x} y={Math.max(12, pts[i].y - 6)} textAnchor="middle" className="fill-[rgb(var(--text))]" fontSize={10}>
            {format(d.value)}
          </text>
        ))}
      </svg>
    </div>
  );
}

export function Heatmap({
  data,
  className,
}: {
  data: { dayOfWeek: number; hour: number; count: number }[];
  className?: string;
}) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const max = Math.max(1, ...data.map((d) => d.count));
  const grid: Record<string, number> = {};
  data.forEach((d) => {
    grid[`${d.dayOfWeek}-${d.hour}`] = d.count;
  });
  return (
    <div className={cn('overflow-x-auto', className)}>
      <div className="inline-block">
        <div className="flex">
          <div className="w-10" />
          {Array.from({ length: 24 }).map((_, h) => (
            <div key={h} className="w-4 text-center text-[9px] text-[rgb(var(--muted))]">
              {h % 3 === 0 ? h : ''}
            </div>
          ))}
        </div>
        {days.map((day, di) => (
          <div key={day} className="flex items-center">
            <div className="w-10 text-right pr-1 text-[10px] text-[rgb(var(--muted))]">{day}</div>
            {Array.from({ length: 24 }).map((_, h) => {
              const count = grid[`${di}-${h}`] ?? 0;
              const intensity = count / max;
              return (
                <div
                  key={h}
                  className="m-[1px] h-4 w-4 rounded-sm"
                  title={`${day} ${h}:00 — ${count}`}
                  style={{ background: `rgba(59, 130, 246, ${0.08 + intensity * 0.92})` }}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

export function StatTile({ label, value, hint, className }: { label: string; value: React.ReactNode; hint?: string; className?: string }) {
  return (
    <div className={cn('rounded-lg border border-[rgb(var(--border-color))] bg-[rgb(var(--card))] p-4', className)}>
      <p className="text-xs uppercase tracking-wide text-[rgb(var(--muted))]">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-[rgb(var(--text))]">{value}</p>
      {hint && <p className="mt-1 text-xs text-[rgb(var(--muted))]">{hint}</p>}
    </div>
  );
}
