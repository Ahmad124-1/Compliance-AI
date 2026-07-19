export type QrCodeType = 'organization' | 'factory' | 'department' | 'campaign' | 'poster';

export interface QrCode {
  id: string;
  organizationId: string;
  siteId: string | null;
  departmentId: string | null;
  name: string;
  type: QrCodeType;
  code: string;
  url: string;
  configuration: Record<string, unknown>;
  scanCount: number;
  lastScannedAt: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface QrScanEvent {
  id: string;
  organizationId: string;
  qrCodeId: string;
  ipAddress: string | null;
  userAgent: string | null;
  country: string | null;
  city: string | null;
  device: string | null;
  browser: string | null;
  createdAt: Date;
}
