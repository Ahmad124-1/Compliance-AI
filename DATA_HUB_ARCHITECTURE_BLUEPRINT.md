# ComplianceOS AI — Central Data Hub Architecture Blueprint

**Audit type:** Read-only system audit (no code modified)
**Auditor:** Lead Software Architect
**Date:** 2026-08-02
**Objective:** Eliminate duplicate data entry; establish a single central Data Hub ("Sustainability Workspace") where users enter/upload information once and every other module consumes that same data automatically.

---

## Executive Summary

ComplianceOS AI currently behaves as **six parallel CRUD applications** (Administration, Compliance, Supplier, Sustainability, Carbon & GHG, ESG) that happen to share a database. Each module maintains its own copies of shared master entities (facilities/sites, programs, goals, targets, reports, KPIs, documents), its own CRUD endpoints, its own form pages, and its own services. Users are asked to enter the same information repeatedly (facility name, reporting period, progress %, report metadata, target values) in each module.

The intended product — **one central Data Hub (Sustainability Workspace), enter once / consume everywhere** — does not exist. There is no "Data Hub" page, no shared import pipeline, no shared reference-data service, and no cross-module linkage layer.

**The fix is not to build new screens.** The fix is to (1) promote the correct existing tables to **single source of truth**, (2) add foreign-key linkage so the consuming tables reference them, (3) convert every other module's data-entry surface to **read-only, auto-populated dashboards**, and (4) add a shared ingestion/calculation service layer that propagates one entry into all downstream modules automatically.

---

## 1. Current Architecture

### 1.1 Repo structure (monorepo, Turborepo + pnpm)

- `apps/api` — Fastify + TypeScript + Zod + PostgreSQL. Entry: `apps/api/src/server.ts`.
- `apps/web` — Next.js App Router (React + Tailwind). Entry: `apps/web/app/(dashboard)/layout.tsx`, nav in `apps/web/src/components/layouts/DashboardNav.tsx`.
- `apps/api/src/db/migrations/` — SQL migrations numbered `00xx–0028`.
- `apps/api/src/routes/` — ~50 Fastify route modules, all mounted under `/api/v1`.
- `apps/api/src/services/` — per-module business logic.
- `apps/api/src/repositories/` — per-module data access.
- `apps/web/src/modules/*` — per-module frontend API clients (`api.ts`, `service.ts`, `types.ts`, `constants.ts`).

### 1.2 Module layering today

| Module | DB migration | API route(s) | Frontend routes | Repos/Services |
|---|---|---|---|---|
| Administration | core (`0012`) + `0028` RBAC | users, organizations, tenants, rbac, admin | `/admin/*`, `/settings/*` | rbac.service |
| Compliance | core + legacy bases | audits, capa, assessments, risks, policies, documents, standards, analytics | `/audits`, `/capa`, `/risk`, `/policies`, `/documents`, `/standards`, `/assessments` | compliance.service, report-generation.service |
| Supplier | `0024_suppliers` | suppliers, supplier-esg, supplier-risk, supplier-audits, supplier-scorecards, supplier-carbon, responsible-sourcing, certifications | `/suppliers`, `/supplier-esg`, `/supplier-risk`, `/supplier-audits`, `/supplier-scorecards`, `/supplier-carbon`, `/responsible-sourcing` | supplier-esg.service, supplier-carbon.service |
| Sustainability | `0020_sustainability` | sustainability | `/sustainability/*` | sustainability-reports.service |
| Carbon & GHG | `0021_carbon_ghg` + `0025_sprint7b` | carbon, sbti, ghg, carbon-settings, carbon-projects, carbon-offsets, carbon-executive | `/carbon/*` | carbon.service, sbti.service, unit-conversion.service, report-generation.service |
| Environment (ISO 14001) | `0022_environmental_management` + `0026_sprint7c` | environment, water, waste, air, chemicals, env-incidents, env-permits, biodiversity, env-objectives, env-reports, env-ai | `/environment/*` (under `(dashboard)`) | water/waste/air/chemicals/incidents/permits/biodiversity/objectives/reports services |
| ESG | `0023_esg_reporting_disclosure` | esg | `/esg/*` | esg via routes + supplier-esg |

### 1.3 Architectural anti-pattern in the code

Each sprint added a new vertical module with:
1. Its own set of tables (even when sharing `organization_id`).
2. Its own CRUD route file.
3. Its own service + repo.
4. Its own form pages (`new/page.tsx` + `[id]/page.tsx`).
5. No cross-module FK linkage except a few late `ALTER TABLE ... ADD COLUMN linked_goal_id` / `linked_program_id` patches in `0026`.

**Consequence:** `facilities`, `projects`, `targets`, `reports`, `goals`, `metrics`, `documents`, and `reporting_periods` are recreated per module with slightly different columns.

---

## 2. Current Database Flow

- Single PostgreSQL database managed by `apps/api/src/db/migrate.ts`, `pool.ts`.
- All tables carry a `organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE` — the only universal link.
- Most tables use `is_deleted BOOLEAN` soft-delete + partial indexes.
- Two parallelism bugs in the data model:

1. **Two facility concepts:**
   - `facilities` (migration `0021`) — used by Carbon, Environment.
   - `sites` (legacy Administration, referenced by `water_usage.site_id`, `waste_records.site_id`, `chemicals.site_id`, `environmental_incidents.site_id`, `environmental_risks.site_id`, `resource_usage.site_id`, `chemical_containers.site_id`, `biodiversity_records.site_id`) — no explicit relationship to `facilities`.

2. **Two supplier concepts:**
   - `suppliers` + `supplier_facilities` (migration `0024`).
   - But `chemicals.supplier_id` REFERENCES `users(id)` (wrong), `waste_records.vendor_id`/`recycler_id` REFERENCES `users(id)` (wrong).

### DB flow "as built" (facility example)

```
User creates facility in Carbon UI  →  POST /carbon/facilities  →  facilities table
User creates water usage            →  POST /water             →  water_usage(facility_id, site_id NULL)
User creates waste record           →  POST /waste             →  waste_records(facility_id, site_id NULL)
User creates emission record        →  POST /carbon/emissions  →  emission_records(facility_id)
User creates ESG data point         →  POST /esg/data-points   →  esg_data_points(facility_id)
```

The same physical location is entered **four times** (or linked by hand-typed facility UUIDs).

---

## 3. Current API Flow

- All routes mounted at `/api/v1` (see `server.ts:149–278`).
- Auth via JWT (`authRoutes`), permissions via `preHandler: requirePermission(...)`; carbon uses `carbonPermission(...)`.
- Standard CRUD pattern per entity: `GET /:entity`, `GET /:entity/:id`, `POST /:entity`, `PATCH /:entity/:id`, `DELETE /:entity/:id`.
- Compute endpoints: `POST /carbon/calculate`, `GET /carbon/dashboard`, `GET /carbon/executive/dashboard`, `GET /analytics/*`, `GET /assessments/:id/scores`.
- Import endpoints: `apps/api/src/modules/standards/import/framework.import.ts` (standards only); `POST /ai/knowledge/ingest` (AI knowledge).

**Key defect:** there is **no generic "data intake / import API"**. Every module has its own create endpoints with its own validation schema, so "enter once" has no enforcement point.

---

## 4. Current Frontend Routing

Routes are auto-grown per module; nav sections in `DashboardNav.tsx`:

| Nav section | Routes (identified from nav + page files) |
|---|---|
| Dashboard | `/dashboard`, `/search` |
| Sustainability | `/sustainability` (overview), `/sustainability/programs[/new|[id]]`, `/sustainability/goals[...]`, `/sustainability/kpis[...]`, `/sustainability/initiatives[...]`, `/sustainability/reports[...]`, `/sustainability/settings` |
| Carbon & GHG | `/carbon` (dashboard), `/carbon/emissions`, `/carbon/emission-factors`, `/carbon/scopes`, `/carbon/targets`, `/carbon/projects`, `/carbon/offsets`, `/carbon/reports`, `/carbon/calculator`, `/carbon/facilities` |
| Environmental | `/environment`, `/environment/water[/new|[id]]`, `/environment/waste[...]`, `/environment/air[...]`, `/environment/chemicals[...]`, `/environment/incidents[...]`, `/environment/permits[...]`, `/environment/risks[...]`, `/environment/objectives[...]`, `/environment/reports[...]`, `/environment/resources[...]`, `/environment/projects[...]`, `/environment/biodiversity[...]` |
| ESG | `/esg`, `/esg/frameworks[...]`, `/esg/metrics[...]`, `/esg/periods[...]`, `/esg/disclosures[...]`, `/esg/assurance[...]`, `/esg/data-points[...]`, `/esg/materiality[...]`, `/esg/reports[...]` |
| Suppliers | `/suppliers`, `/supplier-esg`, `/supplier-risk`, `/supplier-audits`, `/supplier-scorecards`, `/supplier-carbon`, `/responsible-sourcing` |
| Compliance | `/audits`, `/capa`, `/risk`, `/policies`, `/documents`, `/standards`, `/assessments` |
| Analytics | `/analytics`, `/executive`, `/compliance-score`, `/reports` |
| Administration | `/admin/organizations`, `/admin/sites`, `/admin/users`, `/admin/roles`, `/admin/audit`, `/settings/profile` |

**Defect:** There is **no route** for a central "Data Hub" / "Sustainability Workspace", confirming the intended product surface is missing.

---

## 5. Current Module Dependencies

As built:

- Carbon depends on: `facilities`, `emission_sources`, `ghg_scopes`, `emission_records`, `emission_factors`, `carbon_projects`, `carbon_offsets`, `reduction_targets`, `sbti_targets`, `carbon_reports`.
- Environment depends on: `facilities` (partial), `sites` (parallel), `departments`, plus its own water/waste/air/chemical/incident/risk/permit/project/biodiversity/objective/report tables.
- Supplier depends on: `suppliers`, `supplier_facilities`, `supplier_assessments`, `supplier_scorecards`, `supplier_risks`, `supplier_audits`, `supplier_certifications`, `supplier_carbon_records`.
- ESG depends on: `esg_frameworks`, `esg_metrics`, `esg_reporting_periods`, `esg_data_points`, `esg_materiality_*`, `esg_disclosures`, `esg_reports`, `esg_assurance`; plus `facilities` / `departments` via bare UUID arrays (`applicable_facilities UUID[]`, `applicable_departments UUID[]`).
- Sustainability depends on: `sustainability_programs`, `esg_goals`, `sustainability_kpis`, `sustainability_initiatives`, `sustainability_reports` (migration `0020`).
- Environment → Sustainability linkage is **patched only**: `environmental_objectives.linked_goal_id → esg_goals`, `linked_program_id → sustainability_programs` (`0026`).

There is **no code-level dependency** of Carbon on Supplier data (Scope 3 supplier emissions live in `supplier_carbon_records`, but `emission_records` has no `supplier_id` column), and **no dependency** of ESG on Carbon or Environment data (ESG data points are entered by hand, not pulled from `emission_records`/`water_usage`/`waste_records`).

---

## 6. Duplicate Data Entry Locations (UI)

Users are asked to re-enter the same information in these places:

| Data | Entered at (1) | Also entered at (2) | Also entered at (3) |
|---|---|---|---|
| Facility / Site | `/carbon/facilities` page | `/environment/*` forms (facility dropdown re-typed) | `/admin/sites` (Sites/Factories) |
| Project | `/sustainability/initiatives/new` | `/carbon/projects` | `/environment/projects/[id]` |
| Target/Goal | `/sustainability/goals/new` | `/carbon/targets` (reduction_targets) | `/sustainability/kpis/new` (KPI target_value) |
| SBTi target | `/carbon/targets` (SBTi Targets nav) | `/sustainability/goals/new` | ESG materiality |
| Report | `/sustainability/reports/new` | `/carbon/reports` | `/environment/reports/new` + `/esg/reports/new` |
| Reporting period | `/esg/periods/new` | Carbon `reporting_period` typed per emission record | Environment `reporting_period` typed per air/resource record |
| KPI/Progress % | `/sustainability/kpis/new` (progress_pct typed) | `reduction_targets.progress_pct` typed | `water_targets/waste_targets/environmental_objectives.progress_pct` typed |
| Vendor | `waste_records.vendor_id` (user pick) | `/waste-vendors` repo (waste_vendors table) | supplier management |
| Supplier of chemical | `/environment/chemicals/new` (supplier_id → users) | `/suppliers` module | — |
| Documents/evidence | `/documents` | `evidence_urls` JSONB in incidents/projects/biodiversity | `esg_disclosures.linked_documents UUID[]` |

---

## 7. Duplicate Database Tables

| Concept | Tables (module) | Migration(s) |
|---|---|---|
| Facility/Site | `facilities` (carbon), `sites` (admin), `supplier_facilities` (supplier) | `0021`, legacy/admin, `0024` |
| Project | `carbon_projects`, `environmental_projects`, `sustainability_initiatives` (initiative=project), `carbon_offsets.project_id` | `0021`, `0022`, `0020` |
| Target | `reduction_targets`, `sbti_targets`, `water_targets`, `waste_targets`, `air_emission_limits` (limit≈target), ESG `esg_metrics.target_value`, sustainability `esg_goals` | `0021`, `0025`, `0026`, `0023`, `0020` |
| Report | `carbon_reports`, `environmental_reports`, `esg_reports`, `sustainability_reports`, plus legacy `reports` (report.routes) | `0021`, `0026`, `0023`, `0020`, core |
| KPI/Metric | `esg_metrics`, sustainability KPIs, `v_environmental_kpis` view, supplier scorecard scores, `carbon_reports.chart_data` | `0023`, `0020`, `0026`, `0024` |
| Program/Objective | `sustainability_programs`, `environmental_objectives`, `esg_disclosures` (reporting programs) | `0020`, `0026`, `0023` |
| Milestone | `objective_milestones`, `sbti_milestones`, `reduction_targets.milestones JSONB` | `0026`, `0025`, `0021` |
| Vendor | `waste_vendors`, `waste_records.vendor_id/recycler_id → users`, `chemicals.supplier_id → users`, `suppliers` | `0026`, `0022`, `0024` |
| Score/Progress | `water_targets.progress_pct`, `waste_targets.progress_pct`, `reduction_targets.progress_pct`, `sbti_targets.progress_pct`, `environmental_objectives.progress_pct`, supplier `esg_score/carbon_score` stored on `suppliers` | `0026`, `0021`, `0025`, `0024` |

---

## 8. Duplicate Forms

Confirmed from page files (`*/new/page.tsx`):

- **Facility forms:** `/carbon/facilities` (create facility via carbon API), Environment forms embed facility dropdowns; `/admin/sites`.
- **Goal forms:** `/sustainability/goals/new` (esg_goals) vs `/carbon/targets` (reduction_targets) vs environment objectives `/environment/objectives/new` vs `/environment/water|waste` targets (part of water/waste forms).
- **KPI forms:** `/sustainability/kpis/new` vs `/esg/metrics/new` vs supplier scorecard entry.
- **Project forms:** `/sustainability/initiatives/new` vs `/carbon/projects` vs `/environment/projects` (detail only).
- **Report forms:** `/sustainability/reports/new` vs `/carbon/reports` vs `/environment/reports/new` vs `/esg/reports/new`.
- **Period forms:** `/esg/periods/new` (esg_reporting_periods) — carbon/environment ask reporting_period as a free-text field on every record.
- **Incident-like forms:** `/environment/incidents/new` vs Compliance `/capa` findings vs supplier audits findings (all capture title/description/severity/status/evidence).
- **Data-point forms:** `/esg/data-points/new` (value + period + metric) — the exact same data that carbon emission records, water usage, and waste records already hold.

---

## 9. Duplicate API Endpoints

Confirmed from route files:

| Function | Endpoint A | Endpoint B | Note |
|---|---|---|---|
| List/create facilities | `GET/POST /carbon/facilities` | `GET/POST /environment/...facilities?` (Environment routes embed facility refs) | `facilities` table shared, route split |
| Projects | `GET/POST /carbon/projects` | `GET/POST /carbon-projects` (separate route file `carbon-projects.routes.ts`) | **Both write to `carbon_projects`** |
| Offsets | `GET/POST /carbon/offsets` | `GET/POST /carbon-offsets` (separate route file) | **Both write to `carbon_offsets`** |
| Reports | `GET/POST /carbon/reports` | `GET/POST /environment/reports`, `GET/POST /esg/reports`, sustainability reports | 4 report create endpoints |
| Targets | `GET/POST /carbon/targets` | `GET/POST /sbti` targets, `water/targets`, `waste/targets` | 4 target sets |
| KPI/analytics | `GET /carbon/dashboard`, `GET /carbon/executive/dashboard` | `GET /analytics/*`, `GET /environment/kpis` (embedded `?/kpis` in water/air/biodiversity routes) | 4 analytics surfaces |
| Emission limits | `GET/POST /air/limits` (in air.routes) | `air_emission_limits` also referenced by permits | split |
| Supplier carbon | `GET/POST /supplier-carbon` | `supplier_carbon_records` (in `0024`) + `supplier-carbon.service` | scope-3 data meant for carbon module but never linked |

---

## 10. Pages That Should Become Read-Only Dashboards

In the central-hub design these pages should **consume** data, not collect it:

1. **Carbon module**
   - `/carbon/projects` → read-only list of projects entered once in Sustainability Workspace (or an initiatives form seeded from environmental projects).
   - `/carbon/offsets` → read-only registry that auto-populates from procurement/supplier records.
   - `/carbon/targets` → read-only SBTi/reduction targets computed from baseline data; editing only baseline inputs.
   - `/carbon/reports` → read-only generated report library (generation is automatic).
   - `/carbon/dashboard`, `/carbon/executive/dashboard` → pure analytics (already read-only; keep).

2. **Environment module**
   - `/environment/reports` and report forms → generated, not authored.
   - `/environment/objectives` and `/environment/objectives/new` → goals should roll up from actual performance data; form removed or reduced to "select linked goal + auto-track".
   - `/environment/projects/[id]` → read-only detail fed by central project data.
   - `/environment/permits`, `/environment/risks` → compliance status dashboards (editable only for status/evidence, not for re-entering facility/permit info).

3. **ESG module**
   - `/esg/data-points/new` and `[id]` → **the biggest offender**: should auto-pull from carbon emission records, water/waste/air records, HR metrics, and supplier records. Read-only aggregated data points.
   - `/esg/reports` → read-only generated report library.
   - `/esg/materiality` → dashboard + assessment workflow (scores derived), not raw data entry.
   - `/esg/disclosures` → compile from data points automatically; editing = narrative only.

4. **Supplier module**
   - `/supplier-scorecards` → computed scorecards (already numeric aggregation) — read-only.
   - `/supplier-carbon` → scope-3 data pulled from `supplier_carbon_records`, which itself should be auto-collected via supplier self-service portal; read-only here.

5. **Sustainability module**
   - `/sustainability/reports` → generated report library.
   - `/sustainability/initiatives` → roll up of environmental/carbon projects; read-only or single "create initiative" source.

6. **Compliance**
   - `/compliance-score`, `/analytics`, `/executive` → already read-only aggregation; keep.

---

## 11. Pages That Should Remain Editable (Single-Entry Points)

These are the ONLY places data should be entered/uploaded (the "Data Hub / Sustainability Workspace" plus true operational logs):

1. **New Central "Sustainability Workspace / Data Hub"** (to be built):
   - Facility/Site master register (one facility record; all modules reference it).
   - Organization master data (business units, departments, sites) — extend `/admin/sites` + `/admin/organizations`.
   - Supplier master register (`/suppliers` stays the single source for supplier master data).
   - Reference data: emission factors, waste vendors, chemical catalogue, permits, frameworks.
   - Bulk import/upload API (CSV/Excel/API/webhook) — the "upload once" surface.
   - Reporting-period calendar (one global periods table).

2. **Operational data-entry logs** (each should remain editable as the *only* place that data is captured):
   - Water usage, waste records, air emissions, resource usage, biodiversity records — the raw meter/tonnage logs. (These are true "enter once" input surfaces, feeding carbon + ESG downstream.)
   - Emission activity records (`/carbon/emissions` calculator) — remains the calculator UI.
   - Incidents, chemical spills, permits (operational/regulatory logs).
   - Documents library (`/documents`) — the single document/evidence store; all `evidence_urls`/`linked_documents` references point here.
   - Policies (`/policies`), users, roles — admin surfaces.
   - Supplier assessments, audits, certifications — supplier module as single source for that data.

3. **Governance/approval state fields** remain editable on detail pages (approve/reject/status) but never re-enter master data.

---

## 12. What Should Become Automatic

| Current manual action | Should become automatic |
|---|---|
| Typing `reporting_period` on every emission/air/water record | Global reporting-period calendar auto-fills via FK to `reporting_periods` |
| Entering facility on every record | Facility dropdown bound to central `facilities`/`sites` master register |
| Typing `progress_pct` on targets/KPIs/objectives | Computed from actuals (emission_records, water_usage, waste_records) |
| Scoring suppliers (esg_score, carbon_score, compliance_rate) | Computed by aggregation service from assessments, audits, supplier_carbon_records |
| Building ESG data points | Materialized/aggregated from carbon + environment + supplier + HR records |
| Generating reports (4 modules) | One `report-generation.service` scheduled per period; other modules consume generated artifacts |
| SBTi target progress | Derived from `emission_records` totals vs target baselines |
| Water/waste/air target progress | Derived from respective records tables |
| Compliance score | Derived from audit/capa/assessment data (existing `compliance.service`) |
| Offsets / credits retired | Derived from procurement records; auto-deducted |
| Materiality scores | Computed from quantitative data where available; manual only for qualitative drivers |

---

## 13. What Should Remain Manual

- **Operational transaction logs** — water/waste/air/energy/chemicals/incidents/spills (these are the *one-time* raw inputs).
- **Master-data decisions** — adding a facility, supplier, chemical, permit, framework, user (but each is entered once, then reused).
- **Narrative/qualitative content** — disclosure text, incident root-cause text, policy content, assessment answers, materiality stakeholder opinions.
- **Approvals/verification** — approve/reject/verify status toggles.
- **Document upload** — the act of uploading a file into the central document store.
- **Settings/config** — org branding, units, SBTi pathway selection, report branding.

---

## 14. Missing Relationships (Conceptual Links That Do Not Exist)

1. Facility ↔ Site: no relationship field; environment tables can hold both `facility_id` and `site_id`, ambiguous which is canonical.
2. Emission records ↔ Supplier (Scope 3): `emission_records` has no `supplier_id`; supplier carbon lives in a separate table with no join to the GHG inventory.
3. ESG metrics ↔ Source records: `esg_metrics.calculation_method` is a text field; nothing maps a metric to `emission_records`, `water_usage`, `waste_records`, etc.
4. ESG data points ↔ source record: `esg_data_points` has `source_system`/`source_reference` text, no FK to originating record.
5. Reports ↔ report content: `carbon_reports.params JSONB`, `environmental_reports.chart_data JSONB`, `esg_reports.params JSONB` — no structured link to which data drove them.
6. Sustainability goals ↔ reduction targets/SBTi targets: only `environmental_objectives` got `linked_goal_id`/`linked_program_id`; `esg_goals` has no link to `sbti_targets`/`reduction_targets`.
7. Waste vendor ↔ supplier: `waste_vendors` is separate from `suppliers`; `waste_records.vendor_id` points at `users`.
8. Chemical supplier ↔ supplier: `chemicals.supplier_id → users` (wrong table).
9. Periods ↔ all records: `reporting_period` is text everywhere; no FK to `esg_reporting_periods`.
10. Projects ↔ initiatives: `sustainability_initiatives` vs `carbon_projects` vs `environmental_projects` have no mutual FK.
11. KPIs ↔ goals ↔ programs: sustainability module tables have no stated FK chain visible in `0020`.
12. Documents ↔ everything: `documents` table has no FK from `evidence_urls`/`linked_documents` JSONB arrays.

---

## 15. Missing Foreign Keys

Confirmed from migration SQL:

| Column | Table | Referenced table | Status |
|---|---|---|---|
| `scope_id` | `emission_sources` | `ghg_scopes` | **Bare UUID, no FK** (`0021`) |
| `emission_factor_id` | `emission_records` | `emission_factors` | **Bare UUID, no FK** (`0021`) |
| `capa_id` | `environmental_incidents` | `capa` (compliance) | **Bare UUID, no FK** (`0022`) |
| `reviewer_id`, `approved_by_id` | `supplier_assessments` | `users` | **Bare UUID, no FK** (`0024`) |
| `owner_id` | `supplier_risks` | `users` | **Bare UUID, no FK** (`0024`) |
| `auditor_id` | `supplier_audits` | `users` | **Bare UUID, no FK** (`0024`) |
| `vendor_id`, `recycler_id` | `waste_records` | `users` (should be `waste_vendors`/`suppliers`) | **Wrong FK target** (`0022`) |
| `supplier_id` | `chemicals` | `users` (should be `suppliers`) | **Wrong FK target** (`0022`) |
| `applicable_facilities UUID[]`, `applicable_departments UUID[]` | `esg_metrics` | `facilities`/`departments` | Array, no FK possible |
| `frameworks UUID[]` | `esg_reporting_periods` | `esg_frameworks` | Array, no FK |
| `linked_documents UUID[]`, `data_points UUID[]` | `esg_disclosures` | `documents`/`esg_data_points` | Array, no FK |
| `facility_id`/`site_id` coexistence | many env tables | both optional, ambiguous | Missing canonical FK to one master |
| `supplier_id` | `emission_records` | `suppliers` | Column does not exist |

---

## 16. Missing Services

Central-hub architecture requires services that do not exist today:

1. **Reference/Master Data Service** — single API for facilities, sites, departments, periods, units, frameworks.
2. **Bulk Ingestion/Import Service** — CSV/Excel/JSON upload with staging, validation, dedup, and mapping to canonical entities (only framework import exists today in `standards/import/framework.import.ts`).
3. **Cross-Module Propagation / Materialization Service** — after a facility/log/period is created, push/refresh downstream tables (ESG data points, report caches, targets progress, scorecards) via events.
4. **Unified Reporting Service** — one report generator (today: `report-generation.service.ts` exists for carbon; environment/esg/sustainability each have their own report repos/services).
5. **Unified KPI/Progress Engine** — compute `progress_pct` for all target types from actuals (replaces manual typing in 5+ tables).
6. **Scope-3 Aggregation Service** — join `supplier_carbon_records` into `emission_records` scope-3 totals by period.
7. **Verification/Workflow Service** — shared approve/review/verify state machine across modules (RBAC exists; workflow doesn't).
8. **Document Linking Service** — attach documents by FK to any entity, replacing `evidence_urls`/`linked_documents` JSONB arrays.
9. **Notification/Alert Service for compliance triggers** — permit expiry, limit exceeded (`air_emissions.limit_exceeded`), target at-risk (currently per-module fields with no shared engine).
10. **Mapping Service for ESG frameworks** — map raw records → `esg_metrics` (currently `applicable_*` arrays and manual data-point entry).

---

## 17. Proposed New Architecture

### 17.1 Target topology: hub-and-spoke

```
                        ┌──────────────────────────────────────┐
                        │      SUSTAINABILITY WORKSPACE         │
                        │         (Central Data Hub)           │
                        │   Master data + Bulk intake +        │
                        │   Reference data + Global calendar   │
                        └───────┬───────────────┬──────────────┘
                                │  publishes    │  publishes
            ┌───────────────────▼──┐      ┌─────▼─────────────────┐
            │   Master Entities     │      │  Raw Transactional   │
            │ (facilities, sites,   │      │  Logs (enter once):  │
            │ suppliers, chemicals, │      │  water, waste, air,  │
            │ permits, periods,     │      │  energy, emissions,  │
            │ frameworks, vendors)  │      │  incidents, spills   │
            └───────────────────┬───┘      └─────┬───────────────┘
                                │                │
        ┌───────────────────────┼────────────────┼────────────────────────┐
        ▼                       ▼                ▼                        ▼
   ┌─────────┐           ┌──────────┐      ┌──────────┐            ┌──────────┐
   │ CARBON  │           │ ENV (ISO │      │   ESG    │            │ SUPPLIER │
   │ GHG     │           │ 14001)   │      │ Disclos. │            │ ESG/Carbon│
   │ (calc,  │           │ (targets,│      │ (auto    │            │ (auto     │
   │ reports,│           │  reports)│      │  rollup) │            │  score)   │
   │ targets)│           │          │      │          │            │          │
   └─────────┘           └──────────┘      └──────────┘            └──────────┘
        ▲                      ▲                 ▲                       ▲
        └────────────── all READ aggregations / dashboards ─────────────┘
```

### 17.2 Single source of truth per shared entity

| Shared entity | Canonical table (keep) | Consuming tables that must reference it (FK) | Action |
|---|---|---|---|
| Organization | `organizations` | all | already OK |
| Facility/Site | **merge `sites` into `facilities`** (or add `facilities.site_id` + migrate env data) | `water_usage`, `waste_records`, `air_emissions`, `chemicals`, `incidents`, `risks`, `permits`, `resource_usage`, `biodiversity`, `esg_data_points`, `emission_records`, `carbon_projects`, `targets`, `reporting_periods` | Migration: unify + FK |
| Department/Business unit | `departments` (admin) | env tables, `emission_records.department_id`, `esg_data_points` | add missing FKs |
| Supplier | `suppliers` | `chemicals.supplier_id`, `waste_records.vendor_id`/`recycler_id` → `waste_vendors` or `suppliers`; `supplier_carbon_records`; `emission_records.supplier_id` (new) | fix FK targets |
| Reporting period | `esg_reporting_periods` → **rename concept to `reporting_periods`** | all `reporting_period TEXT` columns → FK | migration + service |
| Project/Initiative | **one** `projects` table (unify `carbon_projects`, `environmental_projects`, `sustainability_initiatives`) with `project_type` | offsets, targets, reports | unify tables |
| Target/Goal | **one** `targets` table with `target_type` enum (unify `reduction_targets`, `sbti_targets`, `water_targets`, `waste_targets`, `environmental_objectives`, `esg_goals`) | milestones | unify tables |
| Report | **one** `reports` table (unify `carbon_reports`, `environmental_reports`, `esg_reports`, `sustainability_reports`) | assurance | unify tables |
| Metric/KPI | `esg_metrics` (canonical metric catalogue) + sustainability KPIs merged | `esg_data_points` | unify |
| Document | `documents` | all `evidence_urls`/`linked_documents` arrays → `document_links` join table | new join table + FK |
| Vendor | `waste_vendors` ∪ `suppliers` (one registry, `vendor_type`) | waste_records, chemical approvals | unify or link |

### 17.3 New database migration plan (single consolidated migration `0029_data_hub`)

1. **Master data:**
   - Add `facilities.site_id UUID NULL` + migrate data; drop redundant `site_id` columns on env tables after backfill (or keep as deprecated + FK).
   - Create `reporting_periods` (merge `esg_reporting_periods`).
   - Create unified `projects`, `targets`, `reports` tables (or add union views `v_projects`, `v_targets`, `v_reports` if unification is staged).
2. **FK fixes:**
   - `FK emission_sources.scope_id → ghg_scopes`, `FK emission_records.emission_factor_id → emission_factors`.
   - `FK environmental_incidents.capa_id → capa`.
   - `FK supplier_assessments.reviewer_id/approved_by_id → users`, `supplier_risks.owner_id → users`, `supplier_audits.auditor_id → users`.
   - `FK chemicals.supplier_id → suppliers`, `waste_records.vendor_id/recycler_id → waste_vendors`.
   - Add `FK emission_records.supplier_id → suppliers` (nullable, for scope-3).
   - Add `FK esg_data_points.source_record_id → polymorphic (entity_type, entity_id)` or explicit `source_table TEXT + source_id UUID` + CHECK.
3. **Join tables:**
   - `document_links(entity_type, entity_id, document_id, role)`.
   - `metric_source_mappings(esg_metric_id, source_type, source_query)` (define which table/columns feed each metric).
   - `framework_metric_mappings(framework_id, metric_id)` to replace `frameworks UUID[]` arrays.
4. **Materialized consumption tables (computed, not entered):**
   - `esg_data_points` remains, but rows are **generated** by the propagation service from source records (add `_generated`/`source_record_id`/`last_auto_sync_at`).
   - `supplier_scorecards` refreshed by service.
   - `targets.progress_pct` refreshed by service.

### 17.4 New API surface

- **`POST /api/v1/hub/import`** — generic bulk intake endpoint (multipart CSV/Excel/JSON) with per-row validation report.
- **`GET/PUT /api/v1/hub/master/{entity}`** — reference-data CRUD (facilities, suppliers, periods, frameworks, vendors, chemicals).
- **`POST /api/v1/hub/propagate`** (or event-based) — triggers materialization of ESG data points, target progress, scorecards, reports.
- **`GET /api/v1/hub/sync-status`** — shows which modules are up-to-date vs stale.
- Keep existing CRUD for **raw logs only** (water, waste, air, emissions, incidents) as write endpoints.
- Convert read-side endpoints to **aggregated/read-only** responses for targets/reports/scorecards/disclosures.

### 17.5 New frontend structure

- **New nav section `Sustainability Workspace (Data Hub)`** at top of nav:
  - Overview dashboard (all modules' health + data coverage).
  - Master Data: Facilities, Suppliers, Periods, Frameworks, Vendors, Chemicals.
  - Bulk Import wizard (upload once, preview validation, confirm).
  - Sync & Data Coverage page (per-module % auto-populated).
- Keep existing module pages but convert to **read-only dashboards** (sections 10 & 11 above): remove `new/page.tsx` forms for targets/reports/scorecards/data-points; replace with auto-refresh tables + drill-downs.
- The **calculator** remains interactive in Carbon (it produces the raw emission activity record — a one-time input).

### 17.6 Service layer

- New core services: `master-data.service`, `ingestion.service`, `propagation.service`, `kpi-engine.service`, `scope3-aggregation.service`, `document-linking.service`, `workflow.service`, `unified-reporting.service`.
- Existing services (`carbon.service`, `water.service`, etc.) become thin adapters that call core services.
- All `reporting_period`, `progress_pct`, `score`, `reduction` computations route through the KPI engine; remove manual writes.

### 17.7 Phased implementation roadmap

| Phase | Scope | Exit criteria |
|---|---|---|
| **P1 — Foundations** | Create `reporting_periods`, fix all missing FKs (section 15), unify `sites→facilities` | DB reachable with FK validation; zero bare UUID references to shared concepts |
| **P2 — Master Data Hub** | `master-data.service`, master-data CRUD endpoints, central Facility/Supplier/Period registers | Any module's form can auto-fill facility/period/supplier from one source |
| **P3 — Bulk Intake** | `ingestion.service`, `/hub/import` endpoint, upload wizard UI | Upload one CSV of water usage → creates water_records + auto-creates ESG data points + refreshes KPI progress |
| **P4 — Propagation Engine** | `propagation.service` + `metric_source_mappings` + auto-generated `esg_data_points` + auto target progress | Carbon/environment/ESG dashboards all reflect the same single-entry data without manual entry |
| **P5 — Read-Only Conversion** | Remove/replace `new/page.tsx` forms for targets, reports, scorecards, data-points, disclosures; add read-only dashboards | Users can no longer re-enter data for those entities from any UI |
| **P6 — Unified Reporting** | Merge 4 report tables into one; schedule generation; single report library | One report generation job serves all modules |
| **P7 — Hardening** | Document linking FK, scope-3 rollup, compliance score from auto KPIs, RBAC on new hub roles | Full audit passes: no duplicate entry points, no orphan tables, no missing FKs |

---

## Appendix A — Table inventory quick reference (module split)

| Module | Tables |
|---|---|
| Shared/Admin | `organizations`, `users`, `departments`, `sites`, `documents`, RBAC tables |
| Sustainability | `sustainability_programs`, `sustainability_kpis`, `sustainability_initiatives`, `sustainability_reports`, `esg_goals` |
| Carbon & GHG | `facilities`, `emission_sources`, `ghg_scopes`, `emission_records`, `emission_factors`, `carbon_projects`, `carbon_offsets`, `reduction_targets`, `carbon_reports`, `calculation_history`, `sbti_targets`, `sbti_milestones`, `carbon_settings` |
| Environment | `water_usage`, `waste_records`, `waste_vendors`, `water_targets`, `waste_targets`, `air_emissions`, `air_emission_limits`, `chemicals`, `chemical_containers`, `chemical_spill_records`, `environmental_incidents`, `environmental_risks`, `permits`, `resource_usage`, `environmental_projects`, `biodiversity_records`, `environmental_objectives`, `objective_milestones`, `environmental_reports`, `environmental_insights` |
| ESG | `esg_frameworks`, `esg_metrics`, `esg_reporting_periods`, `esg_data_points`, `esg_materiality_topics`, `esg_materiality_assessments`, `esg_disclosures`, `esg_reports`, `esg_assurance` |
| Supplier | `suppliers`, `supplier_facilities`, `supplier_assessments`, `supplier_scorecards`, `supplier_risks`, `supplier_audits`, `supplier_certifications`, `responsible_materials`, `supply_chain_nodes`, `supplier_carbon_records` |

---

## Appendix B — Evidence file references

| Claim | Evidence |
|---|---|
| Carbon+Env share `facilities`; Env also uses `sites` | `0021_carbon_ghg.sql` (facilities), `0022_environmental_management.sql` (site_id on 8 tables), migration `0026` |
| Wrong supplier FKs | `0022`: `chemicals.supplier_id REFERENCES users(id)`, `waste_records.vendor_id/recycler_id REFERENCES users(id)` |
| Bare FKs | `0021`: `emission_sources.scope_id UUID`, `emission_records.emission_factor_id UUID`; `0022`: `environmental_incidents.capa_id UUID`; `0024`: reviewer/owner/auditor bare UUIDs |
| Duplicate target tables | `0021` (reduction_targets), `0025` (sbti_targets), `0026` (water_targets, waste_targets, air_emission_limits) |
| Duplicate report tables | `0021` (carbon_reports), `0026` (environmental_reports), `0023` (esg_reports), `0020` (sustainability_reports) |
| Duplicate project tables | `0021` (carbon_projects), `0022` (environmental_projects), `0020` (sustainability_initiatives) |
| Duplicate API endpoints | `carbon.routes.ts` (`/carbon/projects`, `/carbon/offsets`) AND `carbon-projects.routes.ts` / `carbon-offsets.routes.ts` |
| No data-hub route | `DashboardNav.tsx` NAV_SECTIONS (no Workspace/Data Hub section) |
| Intended 1-time entry is technically missing | No `/hub/*` endpoints; only per-module CRUD |

---

## Conclusion

ComplianceOS AI has a rich, well-organized vertically per-module schema and UI, but it is structurally a set of **six parallel CRUD apps**. The audit found no central data hub, no shared master-data service, no bulk ingestion pipeline, and no cross-module propagation engine. The blueprint above re-uses the existing (correct) tables as single sources of truth, adds the missing FK/relationship layer, introduces the five core shared services (master-data, ingestion, propagation, kpi-engine, unified-reporting), converts 25+ consumer pages to read-only dashboards, and keeps only the true operational logs and master-data registers editable. This achieves the intended workflow: **enter or upload information once; every other module consumes it automatically.**