# Sprint 7C Implementation Plan — Environmental Management System (ISO 14001)

## Architecture Pattern (from existing codebase)
- **API**: Fastify routes → services → repositories → PostgreSQL
- **Web**: Next.js pages → module service → module API (HTTP client)
- **DB**: Migrations in `apps/api/src/db/migrations/`, tracked in `_migrations` table
- **Auth**: JWT with `authenticate` preHandler + `requirePermission` guard
- **Audit**: `audit()` function from `core/audit.ts`
- **Types**: Shared types in `apps/api/src/types/environment.ts` and `apps/web/src/modules/environment/types.ts`

## Implementation Order

### Phase 1: Database & Types (Foundation)
1. Create migration `0026_sprint7c_environment.sql` - adds new tables:
   - `water_targets` - Water reduction targets & KPIs
   - `waste_vendors` - Waste management vendors
   - `waste_targets` - Waste reduction targets & KPIs
   - `air_emission_limits` - Permit compliance limits
   - `chemical_containers` - Container tracking
   - `chemical_spill_records` - Spill records
   - `biodiversity_records` - Protected areas, trees, habitats
   - `environmental_objectives` - ISO 14001 objectives & targets
   - `objective_milestones` - Milestones for objectives
   - `environmental_reports` - Generated reports
   - `environmental_insights` - AI-generated insights cache
2. Add new types to `apps/api/src/types/environment.ts`
3. Add new types to `apps/web/src/modules/environment/types.ts`

### Phase 2: Dedicated Repositories
4. Create `apps/api/src/repositories/water-target.repo.ts`
5. Create `apps/api/src/repositories/waste-vendor.repo.ts`
6. Create `apps/api/src/repositories/waste-target.repo.ts`
7. Create `apps/api/src/repositories/air-emission-limit.repo.ts`
8. Create `apps/api/src/repositories/chemical-container.repo.ts`
9. Create `apps/api/src/repositories/chemical-spill.repo.ts`
10. Create `apps/api/src/repositories/biodiversity.repo.ts`
11. Create `apps/api/src/repositories/environmental-objective.repo.ts`
12. Create `apps/api/src/repositories/environmental-report.repo.ts`

### Phase 3: Environment Service Enhancement
13. Update `apps/api/src/services/environment.service.ts` - add new dashboard metrics, AI insights, facility/department comparison, environmental score, compliance score calculation

### Phase 4: Dedicated Services
14. Create `apps/api/src/services/water.service.ts` - water management business logic
15. Create `apps/api/src/services/waste.service.ts` - waste management business logic
16. Create `apps/api/src/services/air.service.ts` - air emissions business logic
17. Create `apps/api/src/services/chemicals.service.ts` - chemical management business logic
18. Create `apps/api/src/services/environmental-incidents.service.ts` - incident management
19. Create `apps/api/src/services/environmental-permits.service.ts` - permit management
20. Create `apps/api/src/services/biodiversity.service.ts` - biodiversity management
21. Create `apps/api/src/services/environmental-objectives.service.ts` - objectives tracking
22. Create `apps/api/src/services/environmental-reports.service.ts` - report generation
23. Create `apps/api/src/services/environmental-ai.service.ts` - AI copilot integration

### Phase 5: Modular API Routes
24. Create `apps/api/src/routes/water.routes.ts` - Water Management API
25. Create `apps/api/src/routes/waste.routes.ts` - Waste Management API
26. Create `apps/api/src/routes/air-emissions.routes.ts` - Air Emissions API
27. Create `apps/api/src/routes/chemicals.routes.ts` - Chemical Management API
28. Create `apps/api/src/routes/environmental-incidents.routes.ts` - Incidents API
29. Create `apps/api/src/routes/environmental-permits.routes.ts` - Permits API
30. Create `apps/api/src/routes/biodiversity.routes.ts` - Biodiversity API
31. Create `apps/api/src/routes/environmental-objectives.routes.ts` - Objectives API
32. Create `apps/api/src/routes/environmental-reports.routes.ts` - Reports API
33. Create `apps/api/src/routes/environmental-ai.routes.ts` - AI Copilot routes
34. Update `apps/api/src/server.ts` - register new routes

### Phase 6: Web Module Enhancement
35. Update `apps/web/src/modules/environment/types.ts` - add new types
36. Update `apps/web/src/modules/environment/constants.ts` - add new constants
37. Update `apps/web/src/modules/environment/api.ts` - add new API methods
38. Update `apps/web/src/modules/environment/service.ts` - add new service methods

### Phase 7: Frontend Pages
39. Create `/dashboard/environment/executive/page.tsx` - Executive Environmental Dashboard
40. Create `/dashboard/environment/water/list/page.tsx` - Water Management list
41. Create `/dashboard/environment/water/new/page.tsx` - Create water record
42. Create `/dashboard/environment/water/[id]/page.tsx` - Water detail
43. Create `/dashboard/environment/waste/list/page.tsx` - Waste Management list
44. Create `/dashboard/environment/waste/new/page.tsx` - Create waste record
45. Create `/dashboard/environment/waste/[id]/page.tsx` - Waste detail
46. Create `/dashboard/environment/waste/vendors/page.tsx` - Waste vendors
47. Create `/dashboard/environment/air/list/page.tsx` - Air emissions list
48. Create `/dashboard/environment/air/new/page.tsx` - Create air emission
49. Create `/dashboard/environment/air/[id]/page.tsx` - Air emission detail
50. Create `/dashboard/environment/chemicals/list/page.tsx` - Chemical inventory
51. Create `/dashboard/environment/chemicals/new/page.tsx` - Add chemical
52. Create `/dashboard/environment/chemicals/[id]/page.tsx` - Chemical detail
53. Create `/dashboard/environment/incidents/list/page.tsx` - Incidents list
54. Create `/dashboard/environment/incidents/new/page.tsx` - Report incident
55. Create `/dashboard/environment/incidents/[id]/page.tsx` - Incident detail
56. Create `/dashboard/environment/permits/list/page.tsx` - Permits list
57. Create `/dashboard/environment/permits/new/page.tsx` - Add permit
58. Create `/dashboard/environment/permits/[id]/page.tsx` - Permit detail
59. Create `/dashboard/environment/biodiversity/page.tsx` - Biodiversity dashboard
60. Create `/dashboard/environment/objectives/page.tsx` - Environmental objectives
61. Create `/dashboard/environment/objectives/new/page.tsx` - New objective
62. Create `/dashboard/environment/objectives/[id]/page.tsx` - Objective detail
63. Create `/dashboard/environment/reports/page.tsx` - Environmental reports
64. Create `/dashboard/environment/ai-copilot/page.tsx` - AI Environmental Copilot

### Phase 8: AI Copilot Enhancement
65. Update `apps/api/src/modules/ai-copilot/service.ts` - add environmental intelligence methods
66. Update `apps/api/src/routes/ai-copilot.routes.ts` - add environmental AI endpoints

### Phase 9: Reporting
67. Create environmental report generation service
68. Add PDF/Excel/CSV export support

### Phase 10: Build & Integration
69. Update navigation entries in dashboard layout
70. Run lint, typecheck, build
71. Fix any issues

## Files to Create (New)

### Database
- `apps/api/src/db/migrations/0026_sprint7c_environment.sql`

### Repositories
- `apps/api/src/repositories/water-target.repo.ts`
- `apps/api/src/repositories/waste-vendor.repo.ts`
- `apps/api/src/repositories/waste-target.repo.ts`
- `apps/api/src/repositories/air-emission-limit.repo.ts`
- `apps/api/src/repositories/chemical-container.repo.ts`
- `apps/api/src/repositories/chemical-spill.repo.ts`
- `apps/api/src/repositories/biodiversity.repo.ts`
- `apps/api/src/repositories/environmental-objective.repo.ts`
- `apps/api/src/repositories/environmental-report.repo.ts`

### Services
- `apps/api/src/services/water.service.ts`
- `apps/api/src/services/waste.service.ts`
- `apps/api/src/services/air.service.ts`
- `apps/api/src/services/chemicals.service.ts`
- `apps/api/src/services/environmental-incidents.service.ts`
- `apps/api/src/services/environmental-permits.service.ts`
- `apps/api/src/services/biodiversity.service.ts`
- `apps/api/src/services/environmental-objectives.service.ts`
- `apps/api/src/services/environmental-reports.service.ts`
- `apps/api/src/services/environmental-ai.service.ts`

### API Routes
- `apps/api/src/routes/water.routes.ts`
- `apps/api/src/routes/waste.routes.ts`
- `apps/api/src/routes/air-emissions.routes.ts`
- `apps/api/src/routes/chemicals.routes.ts`
- `apps/api/src/routes/environmental-incidents.routes.ts`
- `apps/api/src/routes/environmental-permits.routes.ts`
- `apps/api/src/routes/biodiversity.routes.ts`
- `apps/api/src/routes/environmental-objectives.routes.ts`
- `apps/api/src/routes/environmental-reports.routes.ts`
- `apps/api/src/routes/environmental-ai.routes.ts`

### Frontend Pages (under apps/web/app/(dashboard)/environment/)
- `executive/page.tsx`
- `water/list/page.tsx`
- `water/new/page.tsx`
- `water/[id]/page.tsx`
- `waste/list/page.tsx`
- `waste/new/page.tsx`
- `waste/[id]/page.tsx`
- `waste/vendors/page.tsx`
- `air/list/page.tsx`
- `air/new/page.tsx`
- `air/[id]/page.tsx`
- `chemicals/list/page.tsx`
- `chemicals/new/page.tsx`
- `chemicals/[id]/page.tsx`
- `incidents/list/page.tsx`
- `incidents/new/page.tsx`
- `incidents/[id]/page.tsx`
- `permits/list/page.tsx`
- `permits/new/page.tsx`
- `permits/[id]/page.tsx`
- `biodiversity/page.tsx`
- `objectives/page.tsx`
- `objectives/new/page.tsx`
- `objectives/[id]/page.tsx`
- `reports/page.tsx`
- `ai-copilot/page.tsx`

## Files to Edit (Existing)
- `apps/api/src/types/environment.ts` - Add new types
- `apps/api/src/services/environment.service.ts` - Enhance dashboard, add new metrics
- `apps/api/src/server.ts` - Register new routes
- `apps/api/src/modules/ai-copilot/service.ts` - Add environmental intelligence
- `apps/api/src/routes/ai-copilot.routes.ts` - Add environmental AI endpoints
- `apps/web/src/modules/environment/types.ts` - Add new frontend types
- `apps/web/src/modules/environment/api.ts` - Add new API endpoints
- `apps/web/src/modules/environment/service.ts` - Add new service methods
- `apps/web/src/modules/environment/constants.ts` - Add new constants
- `apps/web/app/(dashboard)/layout.tsx` - Add navigation entries
- `apps/web/app/(dashboard)/environment/page.tsx` - Enhance with executive dashboard
