import { clsx, type ClassValue } from 'clsx';

/**
 * Class name utility.
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

