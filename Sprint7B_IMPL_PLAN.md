# Sprint 7B Completion Plan

## Architecture Pattern (from existing codebase)
- **API**: Fastify routes → services → repositories → PostgreSQL
- **Web**: Next.js pages → module service → module API (HTTP client)
- **DB**: Migrations in `apps/api/src/db/migrations/`, tracked in `_migrations` table
- **Auth**: JWT with `authenticate` preHandler + `requirePermission` guard
- **Audit**: `audit()` function from `core/audit.ts`
- **Types**: Shared types in `apps/api/src/types/` and `apps/web/src/modules/carbon/types.ts`

## Implementation Order

### Phase 1: Database & Types (Foundation)
1. Create migration `0025_sprint7b_completion.sql` - adds sbti_targets table, adds emission source types, carbon settings
2. Add SBTi types to `apps/api/src/types/carbon.ts`
3. Add SBTi types to `apps/web/src/modules/carbon/types.ts`

### Phase 2: Repositories & Services
4. Create `apps/api/src/repositories/sbti-target.repo.ts`
5. Create `apps/api/src/services/ghg.service.ts` - extract GHG logic
6. Create `apps/api/src/services/emission-factors.service.ts` - extract emission factor logic
7. Create `apps/api/src/services/sbti.service.ts` - SBTi business logic
8. Create `apps/api/src/services/carbon-projects.service.ts` - extract project logic
9. Create `apps/api/src/services/carbon-offsets.service.ts` - extract offset logic
10. Create `apps/api/src/services/unit-conversion.service.ts` - unit conversion engine
11. Create `apps/api/src/services/report-generation.service.ts` - report generation engine

### Phase 3: API Routes
12. Create `apps/api/src/routes/sbti.routes.ts` - SBTi API endpoints
13. Create `apps/api/src/routes/ghg.routes.ts` - GHG API endpoints
14. Create `apps/api/src/routes/carbon-projects.routes.ts` - dedicated project endpoints
15. Create `apps/api/src/routes/carbon-offsets.routes.ts` - dedicated offset endpoints
16. Create `apps/api/src/routes/carbon-executive.routes.ts` - executive dashboard endpoint
17. Create `apps/api/src/routes/carbon-settings.routes.ts` - settings endpoint
18. Update `apps/api/src/server.ts` - register new routes

### Phase 4: Web Module (Frontend Services)
19. Create `apps/web/src/modules/sbti/` - SBTi module (types, api, service, constants)
20. Add Unit Conversion API to web module
21. Add Report Generation API to web module

### Phase 5: Pages (UI)
22. Create `/dashboard/carbon/sbti/` - SBTi pages (list, detail, targets)
23. Create `/dashboard/carbon/executive/` - Executive Carbon Dashboard
24. Create `/dashboard/carbon/settings/` - Carbon Settings page
25. Create `/dashboard/carbon/department/` - Department Analytics page
26. Update existing carbon pages with enhanced charts

### Phase 6: AI Carbon Copilot
27. Extend `apps/api/src/modules/ai-copilot/service.ts` with carbon intelligence
28. Add carbon AI routes to `apps/api/src/routes/ai-copilot.routes.ts`
29. Create carbon AI chat UI

### Phase 7: Build & Integration
30. Update navigation entries
31. Run lint, typecheck, build
32. Fix any issues

## Files to Create (New)
- `apps/api/src/db/migrations/0025_sprint7b_completion.sql`
- `apps/api/src/repositories/sbti-target.repo.ts`
- `apps/api/src/services/ghg.service.ts`
- `apps/api/src/services/emission-factors.service.ts`
- `apps/api/src/services/sbti.service.ts`
- `apps/api/src/services/carbon-projects.service.ts`
- `apps/api/src/services/carbon-offsets.service.ts`
- `apps/api/src/services/unit-conversion.service.ts`
- `apps/api/src/services/report-generation.service.ts`
- `apps/api/src/routes/sbti.routes.ts`
- `apps/api/src/routes/ghg.routes.ts`
- `apps/api/src/routes/carbon-projects.routes.ts`
- `apps/api/src/routes/carbon-offsets.routes.ts`
- `apps/api/src/routes/carbon-executive.routes.ts`
- `apps/api/src/routes/carbon-settings.routes.ts`
- `apps/web/src/modules/sbti/` (types, api, service, constants, index)
- `apps/web/app/(dashboard)/carbon/sbti/page.tsx`
- `apps/web/app/(dashboard)/carbon/executive/page.tsx`
- `apps/web/app/(dashboard)/carbon/settings/page.tsx`
- `apps/web/app/(dashboard)/carbon/department/page.tsx`

## Files to Edit (Existing)
- `apps/api/src/types/carbon.ts` - Add SBTi types, new emission source types
- `apps/api/src/server.ts` - Register new routes
- `apps/api/src/services/carbon.service.ts` - Add unit conversion, executive dashboard, department analytics
- `apps/api/src/routes/carbon.routes.ts` - Add new emission source types, department analytics, executive dashboard
- `apps/api/src/modules/ai-copilot/service.ts` - Add carbon intelligence methods
- `apps/api/src/routes/ai-copilot.routes.ts` - Add carbon AI endpoints
- `apps/web/src/modules/carbon/types.ts` - Add SBTi types, new source types
- `apps/web/src/modules/carbon/api.ts` - Add new endpoints
- `apps/web/src/modules/carbon/service.ts` - Add new service methods
- `apps/web/src/modules/carbon/constants.ts` - Add new constants
- `apps/web/app/(dashboard)/layout.tsx` - Add navigation entries for new pages
- `apps/web/app/(dashboard)/carbon/layout.tsx` - Add new sub-paths
- `apps/web/app/(dashboard)/carbon/emission-sources/page.tsx` - Add new source types
- `apps/web/app/(dashboard)/carbon/dashboard/page.tsx` - Enhance with executive view
