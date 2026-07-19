import { grievancesApi } from './module.api.js';
import type {
  GrievanceSubmitInput,
  GrievanceTrackInput,
  CategoryCreateInput,
  PortalConfigInput,
  QrPortalInput,
} from './module.types.js';

export const grievancesService = {
  submit: (dto: GrievanceSubmitInput) => grievancesApi.submit(dto),

  track: (dto: GrievanceTrackInput) => grievancesApi.track(dto),

  getCategories: (organizationId?: string) => grievancesApi.getCategories(organizationId),

  getLanguages: () => grievancesApi.getLanguages(),

  getSources: () => grievancesApi.getSources(),

  getChannels: () => grievancesApi.getChannels(),

  list: (params?: { status?: string; category?: string; source?: string }) => grievancesApi.list(params),

  get: (id: string) => grievancesApi.get(id),

  update: (id: string, patch: { status?: string; priority?: string; severity?: string | null }) =>
    grievancesApi.update(id, patch),

  getAttachments: (id: string) => grievancesApi.getAttachments(id),

  createCategory: (dto: CategoryCreateInput) => grievancesApi.createCategory(dto),

  listCategories: () => grievancesApi.listCategories(),

  getPortalConfig: () => grievancesApi.getPortalConfig(),

  upsertPortalConfig: (dto: PortalConfigInput) => grievancesApi.upsertPortalConfig(dto),

  createQrPortal: (dto: QrPortalInput) => grievancesApi.createQrPortal(dto),

  listQrPortals: () => grievancesApi.listQrPortals(),
};
