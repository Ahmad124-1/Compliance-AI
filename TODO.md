# ComplianceOS AI – Sprint 8C Module Completion

## Objective
Complete every existing module to production-ready. Work module by module.
No audits, no reports, no placeholders, no new product modules.

## Module Implementation Status

### Phase 1: Suppliers – Supplier Carbon Backend (COMPLETE)
- [x] Create migration `0027_sprint8c_completion.sql` (`supplier_carbon_targets` table)
- [x] Create `apps/api/src/services/supplier-carbon.service.ts` (CRUD + dashboard + targets)
- [x] Create `apps/api/src/routes/supplier-carbon.routes.ts`
- [x] Register supplier-carbon routes in `apps/api/src/server.ts`
- [x] Register all 6 dead carbon route files (sbti, ghg, carbon-settings, carbon-projects, carbon-offsets, carbon-executive)
- [x] Fix supplier-carbon.service.ts type errors (mapRecord generic)
- [ ] Verify typecheck passes for API

### Phase 2: RBAC Permission Catalogue Fix (Carbon 403 root cause)
- [x] Add `carbon`, `esg`, `suppliers`, `compliance`, `policy`, `document` resources to `buildPermissionCatalogue()`
- [ ] Create migration `0028_rbac_completion.sql` to append new permission keys + assign to superadmin role
- [x] Align carbon route guards with carbon permissions (`carbonPermission` helper accepts `carbon:*` OR `sustainability:*`)

### Phase 3: ESG Frontend Pages (fix 404 Add/Edit links)
- [x] Create `new` page for frameworks
- [x] Create `[id]` detail/edit page for frameworks
- [x] Create `new` page for metrics
- [x] Create `[id]` detail/edit page for metrics
- [x] Create `new` page for periods
- [x] Create `[id]` detail/edit page for periods
- [x] Create `new` page for disclosures
- [x] Create `[id]` detail/edit page for disclosures
- [x] Create `new` page for assurance
- [x] Create `[id]` detail/edit page for assurance
- [x] Create `new` page for data-points
- [x] Create `[id]` detail/edit page for data-points
- [x] Create `new` page for materiality topics
- [x] Create `[id]` detail/edit page for materiality topics
- [x] Create `new` page for reports
- [x] Create `[id]` detail/edit page for reports

### Phase 4: Analytics Compliance Score API (COMPLETE)
- [x] Implement `GET /api/v1/compliance/status` endpoint (compliance.service.ts + compliance.routes.ts registered in server.ts)
- [x] Wire compliance-score page donut chart to real data

### Phase 5: Compliance – Policies & Documents (COMPLETE)
- [x] Wire Policies page to real backend (list + search + generate + detail + approve/reject + export)
- [x] Wire Documents page to real backend (list + upload + search + detail + process + AI analysis)

### Phase 6: Environmental Detail Pages
- [ ] Add `[id]` pages for water/waste/air/chemicals/incidents/permits where missing
- [ ] Add `new` pages for water/waste/air/chemicals/incidents/permits where missing

### Phase 7: Build & Verification
- [ ] Run API typecheck (`tsc --noEmit`)
- [ ] Run API lint
- [ ] Run web typecheck
- [ ] Run web lint
- [ ] Run full build (`pnpm build`)
- [ ] Update `Sprint8C_IMPL_PLAN.md`
- [ ] Update final report (files modified, features implemented, build/tsc/lint status)

