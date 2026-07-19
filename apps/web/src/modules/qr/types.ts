export type QrType = 'organization' | 'factory' | 'department' | 'campaign' | 'poster';

export interface QrCode {
  id: string;
  organizationId: string;
  siteId: string | null;
  departmentId: string | null;
  name: string;
  type: QrType;
  code: string;
  url: string;
  configuration: Record<string, unknown>;
  scanCount: number;
  lastScannedAt: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface QrStats {
  totalQrCodes: number;
  activeQrCodes: number;
  totalScans: number;
}

export interface QrScanEvent {
  id: string;
  qrCodeId: string;
  ipAddress: string | null;
  userAgent: string | null;
  country: string | null;
  city: string | null;
  device: string | null;
  browser: string | null;
  createdAt: string;
}
