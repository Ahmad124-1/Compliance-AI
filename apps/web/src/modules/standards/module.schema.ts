/**
 * Standards module DTO and schema mappings.
 */

export type StandardDto = {
  name: string;
  code: string;
  description?: string;
  publisher?: string;
  category?: string;
  isActive?: boolean;
};

export type FrameworkEnableDto = {
  frameworkId: string;
};

export type AssignDto = {
  scope: 'organization' | 'site' | 'department';
  siteId?: string | null;
  departmentId?: string | null;
};

export type ApplicabilityDto = {
  applicable: boolean;
  notes?: string | null;
};

export type ControlStatusDto = {
  status: 'not_started' | 'in_progress' | 'implemented' | 'not_applicable';
  ownerId?: string | null;
  notes?: string | null;
};

export function toStandardDto(dto: Partial<StandardDto>): StandardDto {
  return {
    name: dto.name ?? '',
    code: dto.code ?? '',
    description: dto.description,
    publisher: dto.publisher,
    category: dto.category,
    isActive: dto.isActive ?? true,
  };
}
