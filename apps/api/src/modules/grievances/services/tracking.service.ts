import { query } from '../../../db/pool.js';
import { randomToken } from '../../../core/crypto.js';

export interface TrackingResult {
  trackingNumber: string;
  trackingPIN: string;
}

export const trackingService = {
  async generate(): Promise<TrackingResult> {
    let trackingNumber: string;
    let pin: string;
    let attempts = 0;
    do {
      trackingNumber = `WV-${Date.now().toString(36).toUpperCase()}-${randomToken(4).slice(0, 4).toUpperCase()}`;
      pin = randomToken(6).slice(0, 6);
      attempts++;
      if (attempts > 10) throw new Error('Failed to generate unique tracking number');
    } while (await this.isTrackingNumberTaken(trackingNumber));
    return { trackingNumber, trackingPIN: pin };
  },

  async isTrackingNumberTaken(trackingNumber: string): Promise<boolean> {
    const { rows } = await query(`SELECT id FROM grievances WHERE tracking_number = $1`, [trackingNumber]);
    return rows.length > 0;
  },
};
