import { env } from '../config/env.js';

type Level = 'debug' | 'info' | 'warn' | 'error';

const order: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 };
const threshold = order[(env.LOG_LEVEL as Level) ?? 'info'] ?? 20;

function write(level: Level, args: unknown[]): void {
  if (order[level] < threshold) return;
  const ts = new Date().toISOString();
  const line = `[${ts}] ${level.toUpperCase()}`;
  if (level === 'error') console.error(line, ...args);
  else if (level === 'warn') console.warn(line, ...args);
  else console.log(line, ...args);
}

export const logger = {
  debug: (...a: unknown[]) => write('debug', a),
  info: (...a: unknown[]) => write('info', a),
  warn: (...a: unknown[]) => write('warn', a),
  error: (...a: unknown[]) => write('error', a),
};
