import { QR_ROUTES } from './constants.js';

export interface AppRoute {
  path: string;
  permission?: string[];
  public?: boolean;
  label?: string;
}

export const qrRoutesMap: AppRoute[] = [
  { path: QR_ROUTES.list, permission: ['qr:read'], label: 'QR Codes' },
  { path: QR_ROUTES.detail(':id'), permission: ['qr:read'], label: 'QR Code Details' },
];

export function findQrRoute(path: string): AppRoute | undefined {
  return qrRoutesMap.find((r) => r.path === path);
}
