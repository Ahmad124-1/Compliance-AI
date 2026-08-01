import { query } from '../db/pool.js';

export interface WasteVendor {
  id: string;
  organizationId: string;
  name: string;
  vendorType: 'recycler' | 'disposal' | 'treatment' | 'collection' | 'transport' | 'other';
  contactPerson: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  licenseNumber: string | null;
  licenseExpiry: string | null;
  wasteTypesAccepted: string[];
  certifications: string[];
  contractStart: string | null;
  contractEnd: string | null;
  pricingNotes: string | null;
  isApproved: boolean;
  approvalDate: string | null;
  rating: number | null;
  notes: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

function mapWasteVendor(row: any): WasteVendor {
  return {
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    vendorType: row.vendor_type,
    contactPerson: row.contact_person,
    email: row.email,
    phone: row.phone,
    address: row.address,
    licenseNumber: row.license_number,
    licenseExpiry: row.license_expiry,
    wasteTypesAccepted: row.waste_types_accepted || [],
    certifications: row.certifications || [],
    contractStart: row.contract_start,
    contractEnd: row.contract_end,
    pricingNotes: row.pricing_notes,
    isApproved: row.is_approved,
    approvalDate: row.approval_date,
    rating: row.rating,
    notes: row.notes,
    isDeleted: row.is_deleted,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface WasteVendorFilter {
  vendorType?: string;
  isApproved?: boolean;
  wasteType?: string;
}

export const wasteVendorRepo = {
  async create(input: {
    organizationId: string;
    name: string;
    vendorType: string;
    contactPerson?: string | null;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    licenseNumber?: string | null;
    licenseExpiry?: string | null;
    wasteTypesAccepted?: string[];
    certifications?: string[];
    contractStart?: string | null;
    contractEnd?: string | null;
    pricingNotes?: string | null;
    isApproved?: boolean;
    approvalDate?: string | null;
    rating?: number | null;
    notes?: string | null;
  }): Promise<WasteVendor> {
    const { rows } = await query<WasteVendor>(
      `INSERT INTO waste_vendors (organization_id, name, vendor_type, contact_person, email, phone, address, license_number, license_expiry, waste_types_accepted, certifications, contract_start, contract_end, pricing_notes, is_approved, approval_date, rating, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18) RETURNING *`,
      [
        input.organizationId,
        input.name,
        input.vendorType,
        input.contactPerson ?? null,
        input.email ?? null,
        input.phone ?? null,
        input.address ?? null,
        input.licenseNumber ?? null,
        input.licenseExpiry ?? null,
        input.wasteTypesAccepted ?? [],
        input.certifications ?? [],
        input.contractStart ?? null,
        input.contractEnd ?? null,
        input.pricingNotes ?? null,
        input.isApproved ?? false,
        input.approvalDate ?? null,
        input.rating ?? null,
        input.notes ?? null,
      ],
    );
    return mapWasteVendor(rows[0]);
  },

  async findById(id: string, orgId: string): Promise<WasteVendor | null> {
    const { rows } = await query<WasteVendor>(
      `SELECT * FROM waste_vendors WHERE id = $1 AND organization_id = $2 AND is_deleted = FALSE`,
      [id, orgId],
    );
    return rows[0] ? mapWasteVendor(rows[0]) : null;
  },

  async listByOrganization(orgId: string, filter: WasteVendorFilter = {}): Promise<WasteVendor[]> {
    const where: string[] = ['organization_id = $1 AND is_deleted = FALSE'];
    const params: unknown[] = [orgId];
    let i = 2;
    if (filter.vendorType) { where.push(`vendor_type = $${i++}`); params.push(filter.vendorType); }
    if (filter.isApproved !== undefined) { where.push(`is_approved = $${i++}`); params.push(filter.isApproved); }
    if (filter.wasteType) { where.push(`$${i} = ANY(waste_types_accepted)`); params.push(filter.wasteType); i++; }
    const { rows } = await query<WasteVendor>(
      `SELECT * FROM waste_vendors WHERE ${where.join(' AND ')} ORDER BY name ASC`,
      params,
    );
    return rows.map(mapWasteVendor);
  },

  async update(id: string, orgId: string, patch: Partial<Pick<WasteVendor, 'name' | 'vendorType' | 'contactPerson' | 'email' | 'phone' | 'address' | 'licenseNumber' | 'licenseExpiry' | 'wasteTypesAccepted' | 'certifications' | 'contractStart' | 'contractEnd' | 'pricingNotes' | 'isApproved' | 'approvalDate' | 'rating' | 'notes'>>): Promise<WasteVendor | null> {
    const sets: string[] = [];
    const params: unknown[] = [];
    let i = 1;
    const set = (col: string, val: unknown) => { sets.push(`${col} = $${i++}`); params.push(val); };
    if (patch.name !== undefined) set('name', patch.name);
    if (patch.vendorType !== undefined) set('vendor_type', patch.vendorType);
    if (patch.contactPerson !== undefined) set('contact_person', patch.contactPerson);
    if (patch.email !== undefined) set('email', patch.email);
    if (patch.phone !== undefined) set('phone', patch.phone);
    if (patch.address !== undefined) set('address', patch.address);
    if (patch.licenseNumber !== undefined) set('license_number', patch.licenseNumber);
    if (patch.licenseExpiry !== undefined) set('license_expiry', patch.licenseExpiry);
    if (patch.wasteTypesAccepted !== undefined) set('waste_types_accepted', patch.wasteTypesAccepted);
    if (patch.certifications !== undefined) set('certifications', patch.certifications);
    if (patch.contractStart !== undefined) set('contract_start', patch.contractStart);
    if (patch.contractEnd !== undefined) set('contract_end', patch.contractEnd);
    if (patch.pricingNotes !== undefined) set('pricing_notes', patch.pricingNotes);
    if (patch.isApproved !== undefined) set('is_approved', patch.isApproved);
    if (patch.approvalDate !== undefined) set('approval_date', patch.approvalDate);
    if (patch.rating !== undefined) set('rating', patch.rating);
    if (patch.notes !== undefined) set('notes', patch.notes);
    if (!sets.length) return this.findById(id, orgId);
    sets.push('updated_at = now()');
    params.push(id, orgId);
    const { rows } = await query<WasteVendor>(
      `UPDATE waste_vendors SET ${sets.join(', ')} WHERE id = $${i} AND organization_id = $${i + 1} AND is_deleted = FALSE RETURNING *`,
      params,
    );
    return rows[0] ? mapWasteVendor(rows[0]) : null;
  },

  async softDelete(id: string, orgId: string): Promise<boolean> {
    const { rowCount } = await query(
      `UPDATE waste_vendors SET is_deleted = TRUE, updated_at = now() WHERE id = $1 AND organization_id = $2 AND is_deleted = FALSE`,
      [id, orgId],
    );
    return (rowCount ?? 0) > 0;
  },
};

