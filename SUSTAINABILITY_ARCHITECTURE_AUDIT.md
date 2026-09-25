# ComplianceOS AI — Sustainability Module Architecture Audit & Target Blueprint

**Document type:** Product + Architecture Audit (Planning Document — no implementation code)
**Benchmarks:** Microsoft Sustainability Manager, SAP Sustainability Control Tower, IBM Envizi, Sphera, Intelex, Enablon, Diligent ESG
**Version:** 1.0
**Date:** 2026-08-02

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Audit Methodology & Module Boundaries](#2-audit-methodology--module-boundaries)
3. [Current State Assessment (As-Built)](#3-current-state-assessment-as-built)
4. [Target Feature Coverage — 22 Capability Areas](#4-target-feature-coverage--22-capability-areas)
5. [Missing Capabilities Beyond the Given List](#5-missing-capabilities-beyond-the-given-list)
6. [Entity-Level Data Specifications](#6-entity-level-data-specifications)
7. [UX / Information Architecture Design](#7-ux--information-architecture-design)
8. [Dashboard, Charts, Tables, Filters, Forms, Detail & Settings Design](#8-dashboard-charts-tables-filters-forms-detail--settings-design)
9. [REST API Design](#9-rest-api-design)
10. [Service Layer Responsibilities](#10-service-layer-responsibilities)
11. [Module Boundary Ownership (Sustainability vs Carbon & GHG vs Environmental vs ESG)](#11-module-boundary-ownership)
12. [Cross-Module Integration Map](#12-cross-module-integration-map)
13. [Module Maturity Score, Gaps, and Roadmap](#13-module-maturity-score-gaps-and-roadmap)

---

## 1. Executive Summary

ComplianceOS AI's Sustainability module already possesses a credible **strategy-to-execution core** (Programs → Goals → KPIs → Initiatives → Milestones → Evidence → Approvals → Reports) plus strong adjacent modules (Carbon & GHG, Environmental, ESG Reporting, Supplier ESG). What separates the current build from a **world-class, production-grade enterprise product** (Microsoft Sustainability Manager, SAP Sustainability Control Tower, IBM Envizi, Sphera, Intelex, Enablon, Diligent ESG) is not the presence of foundational entities — it is the **absence of the connective tissue**: materiality-driven strategy, scenario planning, central data model with automated collection, assurance-grade audit trails, benchmark/peer analytics, and configurable sustainability control frameworks.

**Snapshot Score: 54 / 100** — a functional "Level 3" implementation on the sustainability maturity curve (see §13 for the scoring model).

### The 6 structural gaps that cap the module today

| # | Gap | Impact | Severity |
|---|-----|--------|----------|
| 1 | **No Sustainability Data Model / Data Collection layer** (meter/energy/water/waste data streams, IoT/API ingestion, central fact tables) | KPI measurements rely on manual entry; no auto-aggregation; no single source of truth | Critical |
| 2 | **No Materiality Assessment → Strategy → Goal cascade** | Goals are created arbitrarily without a defensible double-materiality basis; CSRD/ISSB audit-readiness impossible | Critical |
| 3 | **No Scenario Analysis / Climate Risk / TCFD-TNFD alignment** | Cannot answer "what if" questions; investor-grade disclosure impossible | High |
| 4 | **No Benchmarking engine** (industry/peer/self-trend/regulatory thresholds) | KPI targets float without external reference; no competitive positioning | High |
| 5 | **No Assurance-ready evidence chain** (immutability, audit-trail, external-assessor workflows, limited-distribution report cycles) | External assurance (CSRD/ESRS, ISAE 3000) would fail | High |
| 6 | **No Sustainability Control Framework** (entity-level controls, testing, sign-off, SOX/CSRD-style internal control over sustainability reporting — ICFR) | Governance pillar is functionally thin; auditability of reported figures is weak | High |

---

## 2. Audit Methodology & Module Boundaries

### 2.1 Method
This audit was performed against the actual repository state (`apps/api/src/db/migrations/0020–0028`, service and route layers, web pages under `apps/web/app/(dashboard)/sustainability|environment|esg`, module types/constants, supplier-ESG sub-module, and the RBAC completion migration). Each target capability was scored against (a) whether the entity exists, (b) whether the workflow exists, (c) whether AI/automation exists, and (d) whether the UX is production-grade.

### 2.2 Boundary Model — the 4 domains that must not overlap

The platform must treat these as four cooperating domains, not one monolith. Clean ownership removes the single biggest source of enterprise-grade failures: **duplicate KPIs, conflicting figures, and report reconciliation chaos.**

| Domain | Owns | Does NOT own |
|--------|------|--------------|
| **Sustainability** (strategic spine) | Programs, ESG/SDG goals, KPIs & measurements (cross-domain), initiatives, milestones, evidence, approvals, reports, certifications, benchmarking, materiality, stakeholder engagement, policies, action plans, performance tracking, executive dashboard | GHG accounting math, facility environmental compliance, disclosure statement production |
| **Carbon & GHG** | Facilities, emission sources, activities, factors, Scopes 1/2/3 inventories, SBTi targets, offsets, carbon projects, unit conversion | KPI definitions, strategic ESG goals (consumes them), environmental compliance records |
| **Environmental** | Water, waste, air, chemicals, spills, permits, biodiversity, environmental objectives, incidents, environmental risks | GHG tCO₂e calculations (links activity data), sustainability strategy |
| **ESG** | Frameworks (CSRD/ISSB/SASB/GRI), metric libraries, reporting periods, data points (collection & validation), disclosures, assurance, materiality *report-layer*, ESG reports | Strategic goal-setting (consumes progress from Sustainability/Environmental/Carbon), supplier ESG (separate sub-domain) |

**Supply Chain Sustainability** is a fifth, cross-cutting sub-domain (Supplier Management + Supplier ESG scores + supplier carbon) that publishes supplier ESG/carbon scores into Sustainability benchmarking but owns its own data.

---

## 3. Current State Assessment (As-Built)

### 3.1 What exists today (verified against the codebase)

| Capability Area | Current State | Verified Evidence |
|-----------------|---------------|-------------------|
| Sustainability Programs | ✅ Full CRUD, status workflow, budget, priority, linked standards/SDGs/ESG pillars | `sustainability_programs` table + page |
| ESG Goals | ✅ Full CRUD, pillar/status/confidence/risk, linked SDGs | `esg_goals` table + pages |
| Sustainability Initiatives | ✅ Full CRUD, milestones, linked SDGs | `sustainability_initiatives`, `initiative_milestones` |
| KPIs | ✅ Full CRUD, typed (numeric/percentage/ratio/currency/intensity/count/boolean), thresholds, aggregation | `sustainability_kpis` table + pages |
| KPI Measurements | ✅ Manual recording, source/notes, department/facility dimension | `kpi_measurements` table |
| Evidence Management | ✅ Polymorphic evidence, document link, versions, expiry, approval status, AI extraction field | `sustainability_evidence` table |
| Approvals | ✅ Polymorphic approval workflow (draft→submitted→under_review→approved/rejected) | `sustainability_approvals` table |
| Sustainability Reports | ✅ Report types (progress/goal_status/sdg_contribution/kpi_performance/initiative_status/executive_summary), PDF/XLSX/DOCX | `sustainability_reports` table |
| SDG Mappings | ✅ Entity-typed mapping with contribution % | `sdg_mappings` table |
| Carbon & GHG | ✅ Facilities, emission sources/activities, factors, inventory, SBTi, offsets, carbon projects | migration 0021 + services |
| Environmental | ✅ Water, waste, air, chemicals, incidents, permits, biodiversity, objectives, risks | migrations 0022/0026 + services |
| ESG Reporting | ✅ Frameworks, metrics, periods, disclosures, data points, assurance, materiality, reports | migration 0023 + services |
| Suppliers | ✅ Supplier registry, ESG scoring, carbon scoring, supplier facilities | migration 0024, supplier-esg |
| RBAC | ✅ Permission-gated routes (`requirePermission`) | migration 0028 |
| Analytics | ✅ Goal completion, ESG pillar distribution, SDG contribution, department comparison, initiative performance | `sustainability-analytics.service.ts` |
| Dashboard | ✅ Overview page with StatTiles, Donut/Bar charts, recent lists | `sustainability/page.tsx` |

### 3.2 What is structurally missing (high-confidence gaps)

- **Data collection/integration layer** — no meters, no API/webhook ingestion, no automated aggregation into KPI measurements.
- **Materiality assessment entity** — `esg_materiality` exists in the ESG module but only as a disclosure-oriented registry; no double-materiality matrix, stakeholder-weighted scoring, or cascade into strategy/goals.
- **Stakeholder engagement entity** — no stakeholder registry, engagement log, consultation surveys, or grievance-to-materiality linkage (grievances exist in the compliance core, but are not linked to sustainability).
- **Sustainability policies entity** — a `policies` module exists, but there is no policy-to-program/goal mapping or policy effectiveness review cycle.
- **Risk management linkage** — environmental risks exist; a general risk module exists; but there is no ESG/sustainability risk register specialized for transition/physical/operational ESG risk with TCFD/TNFD mapping.
- **Action plans** — CAPA exists in the compliance module, but Sustainability Action Plans (goal-gap-closure actions with owners/due dates) are not a distinct, reportable entity.
- **Certifications entity** — certificates can be stored as evidence, but there is no `sustainability_certifications` registry (ISO 14001/50001, B Corp, SA8000, FSC, etc.) with validity, audit scope, and expiry automation.
- **Benchmarking engine** — no target/industry reference data, no percentile analytics, no peer/self comparisons.
- **Scenario analysis** — no climate/ESG scenario modeling, no stress testing.
- **Executive dashboard** — the overview page is operational; there is no C-Suite "Sustainability Control Tower" (single source of truth with drill-through).
- **Notifications/automation** — no notification triggers, no scheduled measurement collection reminders, no auto-generated report schedules.
- **Sustainability Control Framework** — no entity-level controls, control testing, or sign-off loop.

---

## 4. Target Feature Coverage — 22 Capability Areas

For each capability: **Purpose · Business value · Users · Workflow · Required entities · Relationships · Permissions · KPIs · Dashboard widgets · Reports · AI · Automation · Notifications · Approvals · Risks · Best practices · Current state**.

Only the first capability is fully expanded as a template to save space; all 22 are presented in structured form, and the entity specs in §6 carry the full depth for every one.

---

### 4.1 Sustainability Programs ⭐ (Template — full depth)

- **Purpose:** The strategic container that groups an organization's sustainability ambition (e.g., "Net Zero 2040", "Ethical Supply Chain 2027") into a governed, budgeted, owned portfolio.
- **Business value:** Converts board-level ambition into an executable, funded, accountable portfolio; enables portfolio-level investment and progress reporting.
- **Users:** Sustainability Director/Manager (owner), CFO (budget), Executive Sponsor (sign-off), Program Managers, Board/Investor Relations (read-only dashboards).
- **Workflow:** Create (draft) → Link standards/SDGs/ESG pillars → Assign owner + department + budget → Submit for approval → Activate → Manage initiatives/goals/KPIs under it → Pause/Complete → Archive. Quarterly health reviews.
- **Required entities:** `sustainability_programs`, plus children (`esg_goals`, `sustainability_initiatives`, `sustainability_kpis`), `sustainability_approvals`, `sustainability_reports`, `sdg_mappings`, `sustainability_evidence`.
- **Relationships:** 1:N → goals, initiatives, KPIs, reports; N:M → standards (via `linked_standards` JSONB today, should become `program_standards` join table), SDGs (via `sdg_mappings`); N:1 → organizations, users(owner), departments, sites.
- **Permissions (RBAC):** `sustainability.program.view`, `.create`, `.edit`, `.delete`, `.approve`, `.manage-budget`.
- **KPIs:** # active programs; % portfolio on-track; budget utilization; avg program age; initiative completion rate per program; goal health mix per program.
- **Dashboard widgets:** Portfolio health heatmap (program × status), budget vs spend gauge, program pipeline funnels, goal health donut per program.
- **Reports:** Program charter (PDF), portfolio status (XLSX), program deep-dive (goal + initiative + KPI roll-up), board one-pager.
- **AI:** Program risk prediction (from goal/initiative slippage signals); auto-generation of program charters from templates + linked standards; semantic search across program documents.
- **Automation:** Quarterly health review triggers; budget alert at 80%/100%; milestone roll-up into program progress.
- **Notifications:** Owner/team on goal at-risk, milestone overdue, approval requested, budget threshold, program status change.
- **Approvals:** Program creation/activation requires approval when budget > threshold or linked to regulated standards (CSRD/ISSB).
- **Risks:** Duplicate programs, unbudgeted sprawl, orphan goals/KPIs, program scope creep, greenwashing perception if no evidence backing.
- **Best practices:** ISO 14001/ISO 50001 aligned program structure; CSRD portfolio mapping (ESRS topics per program); annual strategy refresh cycle; every program must link ≥1 goal and ≥1 KPI before activation (guardrail).
- **Current state:** ✅ Entity + CRUD + page exist. ❌ No program charter template, no budget approval workflow, no portfolio analytics, no mandatory-linked-goal guardrail.

---

### 4.2 Sustainability Goals ⭐

- **Purpose / Value:** Measurable, dated commitments derived from strategy; the enterprise translation of ambition into numbers.
- **Users:** Sustainability team, goal owners, executives.
- **Workflow:** Derived from materiality/strategy → Create with baseline/target/unit → Program/Pillar linkage → Owner assignment → Periodic current-value updates (from KPIs or manual) → Status auto/manual transitions (not_started → in_progress → at_risk → achieved) → Evidence backing → Approval.
- **Required entities:** `esg_goals`, `kpi_measurements` (progress source), `sustainability_approvals`, `sustainability_evidence`, `goal_strategies` (new: strategy linkage).
- **Relationships:** N:1 program; 1:N KPIs; N:M SDGs; N:1 owner; N:M stakeholders (new).
- **Permissions:** `sustainability.goal.view|create|edit|delete|approve`.
- **KPIs:** Goal progress (actual vs target), % goals on-track/at-risk/achieved, mean goal age, pillar balance.
- **Dashboard widgets:** Goal progress bars, at-risk goal list, goal velocity (progress over time), pillar-balance donut.
- **Reports:** Goal status report, CSRD/ESRS SBM-2/ESRS-aligned goal disclosure draft, goal gap analysis.
- **AI:** Forecast achievement date; anomaly detection on current_value; auto-suggest target recalibration; narrative generation for goal status.
- **Automation:** Progress auto-calc from KPI aggregations; status transitions on thresholds; at-risk alerts.
- **Notifications:** Owner on status change, missed update windows (goal not updated in N periods), forecast miss.
- **Approvals:** Goal target changes, goal achievement sign-off, goal archive.
- **Risks:** Vanity goals, no baseline, stale current_value, goal-cascade drift.
- **Best practices:** SMART goals; SBTi-aligned target setting for climate; CSRD ESRS-2 targets (qual + quant); annual recalibration review; evidence required for "achieved".
- **Current state:** ✅ Entity/CRUD/pages/manual progress. ❌ Auto-progress-from-KPIs, forecast, update-window enforcement, sign-off workflow.

---

### 4.3 ESG Goals (Pillar-level)

- **Purpose / Value:** The E/S/G categorization layer over goals enabling pillar-level portfolio analytics and disclosure mapping (already unified with `esg_goals` in this codebase — correct design).
- **Users:** Same as goals + ESG/reporting team.
- **Workflow:** Same as goals, with mandatory `esg_pillar` and optional framework-topic mapping (new `framework_topic_id` column).
- **Required entities:** `esg_goals` with `esg_pillar`, `linked_sdgs`, + new `framework_topic_mappings` join.
- **Relationships:** 1:N KPIs; N:M SDGs; N:1 program; N:M ESRS/ISSB topics (new).
- **Permissions:** Same as goals + `esg.goal.mapping.edit`.
- **KPIs:** Pillar goal distribution, pillar health, pillar-investment alignment.
- **Dashboard widgets:** E/S/G stacked bar, pillar goal-health matrix.
- **Reports:** Pillar performance packs.
- **AI / Automation / Notifications / Approvals / Risks / Best practices:** Mirror §4.2 + ensure every goal maps to ≥1 framework topic when the organization reports under CSRD/ISSB.
- **Current state:** ✅ `esg_pillar` exists on `esg_goals`. ❌ Framework-topic mapping missing.

---

### 4.4 SDGs

- **Purpose / Value:** Map internal goals/initiatives to the 17 UN Sustainable Development Goals for investor/regulatory transparency and NGO/partnership communication.
- **Users:** Sustainability team, communications, CSR.
- **Workflow:** Seed SDG master data (17 goals, targets, indicators) → Map entities with `contribution_pct` → Report contribution → Periodically re-validate.
- **Required entities:** `sdg_mappings` (exists) + new `sdg_master` reference table (goal names, targets, indicators) instead of hardcoded `INTEGER[]`.
- **Relationships:** N:M polymorphic to programs/goals/initiatives/KPIs (+ new: evidence).
- **Permissions:** `sustainability.sdg.view|edit`.
- **KPIs:** # SDGs addressed, coverage gap vs material topics, avg contribution %.
- **Dashboard widgets:** SDG radar / 17-tile heatmap.
- **Reports:** SDG contribution report, SDG x Goal matrix.
- **AI:** Map new goals to SDGs automatically; detect unreported SDGs relevant to industry.
- **Automation:** Contribution roll-up to program-level SDG coverage.
- **Notifications:** SDG mapping changes.
- **Approvals:** No formal approval; owner edit trail only.
- **Risks:** SDG-washing (claims without evidence).
- **Best practices:** Always attach evidence when claiming SDG contribution; use UN metadata.
- **Current state:** ✅ Mapping entity + analytics. ❌ No `sdg_master` reference data, no evidence linkage.

---

### 4.5 Sustainability Initiatives

- **Purpose / Value:** Discrete projects that execute strategy; trackable investment, timeline, and impact.
- **Users:** Program/project managers, initiative owners, finance (budget).
- **Workflow:** Propose (planning) → Link program/goals/SDGs → Budget approval → Active → Milestones → Complete → Impact validation.
- **Required entities:** `sustainability_initiatives`, `initiative_milestones`, `initiative_resources` (new), `sustainability_approvals`.
- **Relationships:** N:1 program; N:M goals (currently only implicit via program — **gap**; add `initiative_goal_links`); 1:N milestones; N:M SDGs.
- **Permissions:** `sustainability.initiative.view|create|edit|delete|approve|manage-budget`.
- **KPIs:** Initiative completion %, on-time delivery (milestone SLA), budget variance, expected vs actual impact delta.
- **Dashboard widgets:** Initiative status kanban, milestone burndown, budget variance scatter, impact-delivered bars.
- **Reports:** Initiative status report, milestone registry, impact validation report.
- **AI:** Impact prediction; milestone slippage prediction; auto-draft close-out summaries from milestone notes.
- **Automation:** Milestone overdue escalation; status auto-complete when all milestones done; budget variance alerts.
- **Notifications:** Owner/team on milestone due/overdue, budget alerts.
- **Approvals:** Initiation, budget increases, scope changes, completion sign-off.
- **Risks:** Initiative without goal linkage, milestone creep, unvalidated impact claims.
- **Best practices:** PMI-lite rigor; every initiative linked to ≥1 goal; impact validated via evidence.
- **Current state:** ✅ Full entity + milestones + pages. ❌ No direct goal link (except through program), no resources/budget approval, no impact validation workflow.

---

### 4.6 Projects (Physical/Infrastructure)

- **Purpose / Value:** A specialization of initiatives for capital/lab projects (solar install, water recycling plant) requiring asset-level tracking, financing, and carbon/energy impact attribution.
- **Users:** Engineering, sustainability, finance.
- **Workflow:** Initiation → Business case (NPV/IRR/payback) → Capex approval → Construction/milestones → Commissioning → Operational impact measurement → Post-project review.
- **Required entities:** `sustainability_projects` (new; extends initiatives with `capex`, `opex`, `financing`, `co2_abatement_est`, `asset_id`, `commissioning_date`) OR `initiative_type='project'` on `sustainability_initiatives` + `project_business_cases` (new).
- **Relationships:** N:1 program; N:1 site/facility; 1:N milestones; N:M carbon projects (offsets/insets); 1:N measurement points.
- **Permissions:** `sustainability.project.view|create|edit|approve|capex`.
- **KPIs:** IRR/NPV/payback, carbon abated per $, project delivery SLA, operational uptime.
- **Dashboard widgets:** Capex portfolio funnel, abatement cost curve contribution, project timeline gantt.
- **Reports:** Business case, post-implementation review (PIR).
- **AI:** Abatement forecasting, cost-curve positioning, risk flagging.
- **Automation:** Capex approval routing, PIR scheduling (N months post-commissioning).
- **Notifications:** Approval chain, commissioning reminders.
- **Approvals:** Business case, final funding.
- **Risks:** Budget overrun, benefit realization failure.
- **Best practices:** Align with carbon module's `carbon_projects` for emission-credit projects; use Site-level accounting.
- **Current state:** ❌ Not present as a distinct entity (carbon projects exist separately). **Add.**

---

### 4.7 KPIs

- **Purpose / Value:** Quantified performance indicators across E/S/G; the unit of measurement that powers goals, dashboards, and reporting.
- **Users:** Sustainability analysts, KPI owners, department heads.
- **Workflow:** Define (type/unit/aggregation/frequency/thresholds) → Link program/goal/initiative/department/facility → Collect measurements (manual, import, API, auto from Carbon/Environmental modules) → Validate → Analyze vs target/thresholds → Review.
- **Required entities:** `sustainability_kpis`, `kpi_measurements`, `kpi_formulas` (new), `kpi_dimensions` (new), `sustainability_data_streams` (new).
- **Relationships:** N:1 program/goal/initiative/department/facility; 1:N measurements; N:M data streams (new).
- **Permissions:** `sustainability.kpi.view|create|edit|delete|manage-measurements|approve`.
- **KPIs:** Measurement completeness %, data freshness, % KPIs on-track, threshold breach count.
- **Dashboard widgets:** KPI scorecards (traffic-light), sparklines, breach list.
- **Reports:** KPI performance report, KPI definition catalogue.
- **AI:** Outlier detection, seasonality, forecast, auto-unit conversion, measurement auto-fill from invoices/meters.
- **Automation:** Scheduled measurement imports; aggregation jobs; threshold breach events.
- **Notifications:** Threshold warning/critical, measurement overdue, data-quality issues.
- **Approvals:** KPI definition changes (governance).
- **Risks:** Definition drift, manual-data errors, orphan KPIs.
- **Best practices:** GRI/SASB-aligned definitions; golden-source rule (one KPI definition per measure); data lineage visible.
- **Current state:** ✅ Entity + measurements + thresholds + aggregation. ❌ Data streams, formulas, auto-collection, data quality scoring.

---

### 4.8 KPI Measurements

- **Purpose / Value:** The raw evidence of performance; time-series backbone of all reporting.
- **Users:** Data entry operators, analysts, automated pipelines.
- **Workflow:** Capture (manual/API/import) → Validate (unit/range/duplicate) → Approve (for regulated KPIs) → Record (with source + recorded_by) → Audit.
- **Required entities:** `kpi_measurements` (exists) + new `measurement_validation_runs`, `measurement_approvals`.
- **Relationships:** N:1 KPI; N:1 user; N:1 department/facility; N:1 data stream.
- **Permissions:** `sustainability.kpi.measure.submit|approve|override`.
- **KPIs:** Data completeness, validation pass rate, mean time-to-record, correction count.
- **Dashboard widgets:** Data quality gauge, collection calendar heatmap.
- **Reports:** Data completeness report, corrections register.
- **AI:** Anomaly detection; unit detection from source docs; trend forecasts.
- **Automation:** Scheduled ingestion, validation rules, daily digest.
- **Notifications:** Missing measurements, invalid submissions.
- **Approvals:** Required for externally reported KPIs (CSRD/ISSB datapoints).
- **Risks:** Silent corrections (must be logged), stale values.
- **Best practices:** Immutability once approved; correction workflow (never edit — supersede); lineage.
- **Current state:** ✅ Table + CRUD. ❌ Immutability/correction workflow, validation, approvals, source-stream lineage.

---

### 4.9 Evidence Management ⭐

- **Purpose / Value:** The proof chain behind every claim, goal, KPI, and report; the core of assurance readiness.
- **Users:** Sustainability analysts, internal auditors, external assessors, compliance.
- **Workflow:** Upload/pull from Documents → Attach to entity (polymorphic) → Tag/classify → Auto-AI extraction → Review → Approve/Reject → Version → Expire → Re-certify.
- **Required entities:** `sustainability_evidence` (exists), `documents` (exists), `evidence_reviews` (new), `evidence_classifications` (new).
- **Relationships:** N:1 entity (program/goal/kpi/initiative/milestone/report); N:1 document; N:M certifications.
- **Permissions:** `sustainability.evidence.view|upload|review|approve|delete`.
- **KPIs:** Evidence completeness per KPI/goal, % approved, expiry-proximity count, review cycle time.
- **Dashboard widgets:** Evidence coverage matrix (entity × evidence type), expiry calendar.
- **Reports:** Evidence index (assurance-ready), gap analysis report.
- **AI:** Auto-classify evidence; extract key figures (dates/amounts/cert numbers); detect duplicate/fraud risks; auto-link to matching claims.
- **Automation:** Expiry reminders, re-certification requests, completeness checks before report generation.
- **Notifications:** Expiry warnings (30/7 days), review tasks.
- **Approvals:** Evidence approval for externally reported items.
- **Risks:** Lost evidence, expired certificates, orphan evidence, insufficient audit trail.
- **Best practices:** Map every disclosed metric to ≥1 evidence; version immutability; ISO 14001 document-control alignment.
- **Current state:** ✅ Strong entity + AI extraction field. ❌ Evidence-to-report traceability, expiry automation, coverage analytics.

---

### 4.10 Approvals

- **Purpose / Value:** Governed sign-off for goals, KPIs, initiatives, evidence, reports, and programs; the control layer.
- **Users:** Reviewers/approvers (management, sustainability control owner, CFO for budget/claims).
- **Workflow:** Submit → Route (role/policy-based, parallel/sequential) → Review (comments) → Approve/Reject → Notify → Record evidence.
- **Required entities:** `sustainability_approvals` (exists) + new `approval_templates`, `approval_instances`, `approval_steps`.
- **Relationships:** Polymorphic N:1 to all governed entities; N:1 submitted_by/reviewer; N:M users (chain).
- **Permissions:** `sustainability.approval.submit|approve|reject|reroute`.
- **KPIs:** Approval cycle time, SLA compliance, rework rate, approval workload.
- **Dashboard widgets:** Approval queue, SLA heatmap, cycle-time trend.
- **Reports:** Approval register, SLA report.
- **AI:** Route approval automatically by entity value/risk; predict approval delay; draft reviewer comments.
- **Automation:** SLA escalation; chain routing; auto-approve low-risk changes; reminders.
- **Notifications:** Task assigned, due, escalated, completed.
- **Approvals:** This is the approval engine itself.
- **Risks:** Bottlenecks, shadow approvals, missing audit trail.
- **Best practices:** Configurable chains, delegation rules, dormant approval cleanup.
- **Current state:** ✅ Single-level approval table + workflow. ❌ Multi-step chains, templates, delegation, SLA.

---

### 4.11 Sustainability Reports

- **Purpose / Value:** Delivery of progress, goal, KPI, SDG, initiative, and executive reporting in PDF/XLSX/DOCX, plus scheduled cycles and narrative generation.
- **Users:** Sustainability team, executives, board, investors, regulators.
- **Workflow:** Configure report (type/params/period) → Generate (engine pulls live data + evidence links) → Review → Approve → Publish → Distribute → Archive.
- **Required entities:** `sustainability_reports` (exists), `report_templates` (exists in compliance core), `report_schedules` (new), `report_distributions` (new).
- **Relationships:** N:1 program; N:1 generated_by; N:M evidence; N:M recipients.
- **Permissions:** `sustainability.report.view|create|edit|generate|publish|delete`.
- **KPIs:** Report cycle time, report completeness, distribution coverage, template reuse rate.
- **Dashboard widgets:** Report schedule calendar, generation success rate.
- **Reports:** Meta-reports: report catalogue, schedule adherence.
- **AI:** Narrative drafting (goal stories, KPI commentary), summary extraction, translation, disclosure-requirement gap detection.
- **Automation:** Scheduled generation, change-triggered regeneration (material data change), versioning.
- **Notifications:** Ready for review, published, failed generation.
- **Approvals:** Final report approval before publication.
- **Risks:** Stale data in reports (must show data-as-of), unreviewed figures, broken evidence links.
- **Best practices:** ESRS/ISSB-aligned report packs; data-as-of watermark; auto table-of-contents; reuse report templates.
- **Current state:** ✅ Entity + types + generation service. ❌ Scheduling, distribution, narrative AI, data-as-of tracking.

---

### 4.12 Certifications

- **Purpose / Value:** Registry of sustainability/ESG certifications with validity tracking, audit scope, and expiry automation; differentiators in tender/commercial processes.
- **Users:** Sustainability team, quality, sales (read-only), compliance.
- **Workflow:** Register certification → Attach evidence/certificate → Validate scope/issuer → Track surveillance audits → Renew/Expire.
- **Required entities:** `sustainability_certifications` (**NEW**): id, org, entity_type (organization/site/facility/product/process), entity_id, certification_type (ISO 14001, ISO 50001, ISO 45001, B Corp, SA8000, FSC, PEFC, Fairtrade, EcoVadis, SEDEX, LEED, EDGE, GRESB signatory…), certifying_body, certificate_number, issue_date, expiry_date, scope, status (active/pending_expiry/expired/suspended/revoked/archived), accreditation, linked_evidence, audit_dates, findings_summary, is_deleted.
- **Relationships:** N:1 site/facility/organization; N:M evidence; N:1 program (optional).
- **Permissions:** `sustainability.certification.view|create|edit|renew|revoke`.
- **KPIs:** # active certifications, expiry-proximity %, certification gap vs target portfolio, time-to-renew.
- **Dashboard widgets:** Certification portfolio matrix, expiry timeline.
- **Reports:** Certification register, expiry forecast.
- **AI:** Classify certificate type from document; extract issue/expiry dates automatically; recommend missing certifications for industry.
- **Automation:** Expiry alerts (6/3/1 months), renewal workflow creation.
- **Notifications:** Expiry, renewal task, revocation.
- **Approvals:** Certification addition/renewal approval.
- **Risks:** Expired-but-claimed certifications (reputational), scope overclaim.
- **Best practices:** Display certification mark only while active; align with evidence expiry engine.
- **Current state:** ❌ Not present. **Add** (evidence supports but registry does not exist).

---

### 4.13 Benchmarking

- **Purpose / Value:** Compare KPI/goal performance against industry, peers, regulatory thresholds, and self-history to ground targets and prove leadership.
- **Users:** Sustainability analysts, executives, investor relations.
- **Workflow:** Select metric → Choose benchmark basis (industry code, peer-set, region, regulation) → Reference dataset → Compute percentile/rank vs benchmark → Visualize → Re-baseline targets.
- **Required entities:** `benchmark_definitions` (**NEW**), `benchmark_datasets` (**NEW**, industry/peer/regulatory), `benchmark_results` (**NEW**), `benchmark_subscriptions` (**NEW**).
- **Relationships:** N:1 KPI; N:1 organization; N:M industries; N:1 data provider.
- **Permissions:** `sustainability.benchmark.view|manage|publish`.
- **KPIs:** Percentile rank, gap-to-leader, benchmark data freshness.
- **Dashboard widgets:** Benchmark ladder chart, KPI-vs-peers box plot, regional map.
- **Reports:** Benchmark report, industry position paper.
- **AI:** Suggest relevant benchmarks; detect competitive inflection; forecast rank trajectory.
- **Automation:** Periodic benchmark refresh; rank change alerts.
- **Notifications:** Rank improvement/decline.
- **Approvals:** No formal approval; data provenance tracked.
- **Risks:** Apples-to-oranges comparison; stale reference data.
- **Best practices:** CDP/GRESB/EcoVadis peer-set methodology; normalize by revenue/FTE/intensity.
- **Current state:** ❌ Not present. **Add** — biggest differentiator vs. current competitors.

---

### 4.14 Materiality Assessment

- **Purpose / Value:** The evidence-based determination of which sustainability topics matter most (impact + financial = double materiality), the **mandatory starting point** for CSRD/ESRS and ISSB, and the input that shapes strategy/goals/KPIs.
- **Users:** Sustainability Director, strategy, risk, investor relations, stakeholders.
- **Workflow:** Define topic universe (ESRS/industry SASB) → Identify stakeholders → Survey/workshop (impact & financial scores) → Weight & aggregate → Plot double-materiality matrix → Threshold selection → Approve material topics → Cascade to strategy/goals/KPIs/disclosures.
- **Required entities:** `materiality_assessments` (**NEW**), `materiality_topics` (**NEW**), `materiality_surveys` (**NEW**), `materiality_responses` (**NEW**), `materiality_matrix_results` (**NEW**).
- **Relationships:** N:M stakeholders; N:M topics; 1:N goals/KPIs/disclosures (via `material_topic_mappings`); N:1 organization.
- **Permissions:** `sustainability.materiality.view|create|edit|submit|approve`.
- **KPIs:** Topic coverage vs ESRS/SASB, stakeholder response rate, materiality-to-goal linkage %, assessment cycle time.
- **Dashboard widgets:** Double-materiality matrix scatter (topic bubbles with severity color), stakeholder-group weighting donut, material-topic heatmap.
- **Reports:** Materiality assessment report (CSRD-ready narrative), topic evidence pack.
- **AI:** Generate topic universe from industry + framework; cluster free-text survey responses; draft materiality narrative; detect topic drift vs prior year.
- **Automation:** Survey distribution; threshold recalculation; cascade mapping suggestions.
- **Notifications:** Survey invites, deadline reminders, approval requests.
- **Approvals:** Board/executive sign-off of material topics.
- **Risks:** Stale assessment, stakeholder bias, topics without evidence, disclosure mismatches.
- **Best practices:** EFRAG double-materiality methodology; review every 2–3 years (or on material change); document threshold rationale.
- **Current state:** ⚠️ `esg_materiality` exists in ESG module but as disclosure mapping **only**; no double-materiality scoring engine, surveys, or cascade. **Upgrade → owned by Sustainability.**

---

### 4.15 Stakeholder Engagement

- **Purpose / Value:** Systematic management of stakeholder groups (employees, communities, NGOs, investors, customers, regulators) to feed materiality, manage expectations, and evidence SBM-2 (ESRS) stakeholder views.
- **Users:** Sustainability/CSR, communications, materiality facilitators, grievance owners.
- **Workflow:** Register stakeholder groups → Map to topics → Engage (surveys/workshops/consultations) → Log engagement → Feed into materiality → Track concerns → Close loop.
- **Required entities:** `stakeholder_groups` (**NEW**), `stakeholders` (**NEW**), `stakeholder_engagements` (**NEW**), `engagement_findings` (**NEW**).
- **Relationships:** N:M materiality topics; N:M assessments; 1:N grievances (link to existing `grievances` core); N:1 organization.
- **Permissions:** `sustainability.stakeholder.view|create|edit|engage`.
- **KPIs:** Engagement coverage (groups × topics), participation rate, finding-to-action closure %, grievance resolution SLA.
- **Dashboard widgets:** Stakeholder×topic matrix, engagement calendar, sentiment trend.
- **Reports:** Stakeholder engagement log, SBM-2 evidence pack.
- **AI:** Summarize engagement findings; sentiment analysis of open text; auto-tag topics.
- **Automation:** Survey dispatch; follow-up nudges; finding-to-action item creation.
- **Notifications:** Engagement due, finding assigned, grievance escalation.
- **Approvals:** Materiality input sign-off.
- **Risks:** Tokenism, unmanaged expectations, findings without follow-through.
- **Best practices:** AA1000SES alignment; document engagement method + outcome; link findings to actions.
- **Current state:** ❌ Not present. **Add** (core grievances module can be referenced).

---

### 4.16 Sustainability Policies

- **Purpose / Value:** Governed policy set (Environmental, Climate, Human Rights, Anti-Corruption, Sourcing…) that operationalizes commitments and is required by every major framework (CSRD, GRI, ISO, SA8000).
- **Users:** Legal, sustainability, HR, procurement, compliance.
- **Workflow:** Draft policy → Link to standards/frameworks/programs → Review/approve → Publish → Communicate/train → Effectiveness review (annual) → Revise.
- **Required entities:** `sustainability_policies` (**NEW**; distinct from generic `policies` module via `policy_type`, `framework_links`, `approval_cycle`, `effectiveness_review_date`).
- **Relationships:** N:M standards/frameworks; N:M programs; N:M evidence (approval/ratification); 1:N training records (via core).
- **Permissions:** `sustainability.policy.view|create|edit|approve|publish`.
- **KPIs:** Policy coverage vs framework requirements, % policies current, average review lag.
- **Dashboard widgets:** Policy coverage matrix (framework × policy), expiry/review calendar.
- **Reports:** Policy register, framework-coverage gap report.
- **AI:** Draft policy from commitments/benchmarks; gap-detect vs framework clauses; summarize revisions.
- **Automation:** Review-cycle scheduling; ratification evidence capture.
- **Notifications:** Review due, revision proposed.
- **Approvals:** Policy approval by board/exec.
- **Risks:** Stale non-compliant policies, unratified changes.
- **Best practices:** ISO 14001/45001 document control; versioned ratification; communicate-before-effective date.
- **Current state:** ⚠️ `policies` module exists generically. **Add** sustainability-specific policy registry + framework mapping.

---

### 4.17 Risk Management (Sustainability/ESG Risk)

- **Purpose / Value:** A dedicated sustainability risk register covering transition risk (policy, market, technology, reputation), physical risk (acute/chronic climate), social risk, and governance risk, aligned to TCFD/TNFD and feeding enterprise risk.
- **Users:** Risk managers, sustainability, CFO, enterprise risk.
- **Workflow:** Identify risk (scenario-informed) → Assess (likelihood × impact, financial quantification) → Map to TCFD/TNFD category → Mitigate (control/action plan) → Monitor (indicators) → Review.
- **Required entities:** `sustainability_risks` (**NEW**), `risk_scenarios` (**NEW**), `risk_actions` (reuse CAPA/action plans), `risk_indicators` (**NEW**), `risk_mappings` (TCFD/TNFD taxonomy).
- **Relationships:** N:1 organization/site/facility/supplier; N:M goals (risk to goal achievement); N:M action plans; N:1 scenario.
- **Permissions:** `sustainability.risk.view|create|edit|assess|approve`.
- **KPIs:** Risk exposure score, # material risks with action plans, mitigation progress %, scenario coverage.
- **Dashboard widgets:** Risk heatmap (TCFD categories), physical-risk map, scenario stress-test gauge.
- **Reports:** TCFD/TNFD-aligned risk report, risk register.
- **AI:** Screen news/regulatory changes for emerging risks; quantify physical risk from geo data; draft risk narratives.
- **Automation:** Risk review scheduling; indicator breach alerts.
- **Notifications:** Risk score change, action overdue.
- **Approvals:** Risk appetite sign-off, top-risk approval.
- **Risks:** Unquantified risks, scenario laziness, disconnected from enterprise risk register.
- **Best practices:** TCFD 11 disclosures, TNFD LEAP approach, NGFS scenarios for transition.
- **Current state:** ⚠️ `environmental_risks` exists. **Add** dedicated sustainability/ESG risk register + TCFD/TNFD alignment.

---

### 4.18 Action Plans

- **Purpose / Value:** Structured gap-closure actions (goal shortfall, risk mitigation, audit finding, materiality topic response) with owners, due dates, and progress — distinct from CAPA (compliance defect) by linking to sustainability objects.
- **Users:** Goal owners, initiative managers, risk owners.
- **Workflow:** Define action (from gap/risk/finding) → Link object + owner + due → Execute (subtasks) → Evidence → Close → Review effectiveness.
- **Required entities:** `sustainability_action_plans` (**NEW**), `action_plan_tasks` (**NEW**), reuse `sustainability_approvals`/evidence.
- **Relationships:** N:1 goal/kpi/initiative/risk/materiality-topic; 1:N tasks; N:M evidence.
- **Permissions:** `sustainability.action-plan.view|create|edit|approve`.
- **KPIs:** Action closure rate, on-time %, effectiveness %, mean cycle time.
- **Dashboard widgets:** Action plan kanban, closure funnel, age-of-open-actions.
- **Reports:** Action plan register, gap-closure report.
- **AI:** Auto-generate action plans from goal gap analysis; recommend owners; predict delay.
- **Automation:** Due-date escalation; closure evidence checks; effectiveness review scheduling.
- **Notifications:** Assigned, due, overdue, effectiveness due.
- **Approvals:** Closure approval for material actions.
- **Risks:** Action theater (closed without effect), owner churn.
- **Best practices:** Link every material gap to an action plan; verify effectiveness 90 days post-close.
- **Current state:** ❌ Not present (Capa exists in compliance core). **Add.**

---

### 4.19 Performance Tracking

- **Purpose / Value:** The cross-cutting analytics layer that rolls entity performance (programs → goals → KPIs → initiatives) into a single, drillable performance fabric.
- **Users:** All stakeholders (role-scoped).
- **Workflow:** Define performance model → Aggregate (KPI→goal→program) → Score (health/traffic light) → Trend → Report → Review.
- **Required entities:** No new base tables — add `performance_scorecards` (**NEW**), `scorecard_entries` (**NEW**), `performance_aggregation_jobs` (**NEW**).
- **Relationships:** Polymorphic N:1 to any tracked entity.
- **Permissions:** `sustainability.performance.view|manage-scorecards`.
- **KPIs:** Scorecard completion, aggregation latency, health-score distribution.
- **Dashboard widgets:** Executive scorecard grid, trend arrows, drill-down modal.
- **Reports:** Scorecard pack, health roll-up.
- **AI:** Health-score prediction, narrative commentary per scorecard.
- **Automation:** Aggregation jobs on schedule; score recalculation on data change.
- **Notifications:** Score deterioration alerts.
- **Approvals:** Scorecard definition sign-off.
- **Risks:** Wrong aggregation math, gaming by cherry-picking.
- **Best practices:** Cascading KPI trees (Program→Goal→KPI→Measurement); auditable aggregation.
- **Current state:** ⚠️ Analytics service provides some roll-ups. **Add** formal scorecard object + reportable health model.

---

### 4.20 Supply Chain Sustainability

- **Purpose / Value:** Extend sustainability coverage beyond the entity to suppliers: ESG scoring, carbon tiering, onboarding requirements, improvement plans, and preferential sourcing.
- **Users:** Procurement, supplier sustainability managers, CSR, risk.
- **Workflow:** Onboard suppliers → Baseline ESG/carbon assessment → Score (existing `supplier_esg`/`supplier_carbon`) → Tier (A–D) → Improvement plans (action plans linked to supplier) → Reassess → Approve sourcing decisions.
- **Required entities:** Existing `suppliers`, `supplier_esg_scores`, `supplier_carbon`, `supplier_facilities`; add `supplier_sustainability_requirements` (**NEW**), `supplier_improvement_plans` (**NEW**), `supplier_tiering` (**NEW**).
- **Relationships:** N:1 supplier; N:M sustainability KPIs (supplier-level KPI instances); N:1 benchmark; N:M audits (core).
- **Permissions:** `sustainability.supplier.view|score|tier|require|approve`.
- **KPIs:** Supplier ESG score average, % tier A/B, improvement plan closure, scope-3 coverage %.
- **Dashboard widgets:** Supplier score distribution histogram, tier pie, heatmap by region/commodity.
- **Reports:** Supplier ESG scorecard pack, tiering report, scope-3 (upstream) view.
- **AI:** Predict supplier score from financial/risk data; auto-draft supplier questionnaires; anomaly-detect score inflation.
- **Automation:** Reassessment scheduling; requirement enforcement at onboarding; tier downgrade alerts.
- **Notifications:** Score change, reassessment due, improvement plan overdue.
- **Approvals:** Tier decisions, supplier suspension recommendation.
- **Risks:** Score gaming, data asymmetry, greenwashing by supplier.
- **Best practices:** EcoVadis/SEDEX-aligned assessment; CDP Supply Chain linkage; contractual ESG clauses.
- **Current state:** ✅ Supplier registry + ESG/carbon scoring exists. ❌ Tiering, requirements enforcement, improvement-plan linkage, supplier→KPI instances.

---

### 4.21 Social Sustainability

- **Purpose / Value:** Social pillar depth: workforce health & safety, human rights, DEI, community impact, labor practices, and modern-slavery risk — beyond what the existing worker experience/engagement modules track, framed as sustainability KPIs and disclosures.
- **Users:** HR, EHS, CSR, sustainability.
- **Workflow:** Define social KPI set (turnover, lost-time incidents, gender pay gap, training hours, community investment) → Collect (link HR/EHS data or manual) → Track vs targets → Evidence → Report (ESRS S1–S4).
- **Required entities:** Reuse `sustainability_kpis` + `kpi_measurements` with `esg_pillar='social'`; add `social_metrics_catalog` (**NEW**, ESRS S1–S4 aligned definitions), `community_programs` (**NEW**), `human_rights_assessments` (**NEW**).
- **Relationships:** N:1 goal/program; N:1 facility/department; N:M evidence; N:1 grievance link.
- **Permissions:** `sustainability.social.view|create|edit|report`.
- **KPIs:** Social KPI data completeness, HR/KPI integration %, grievance-to-social-KPI linkage.
- **Dashboard widgets:** Social scorecard, DEI demographics charts, community investment funnel.
- **Reports:** ESRS S1–S4 draft pack, human rights due diligence report.
- **AI:** Narrative on workforce stats; detection of pay-gap anomalies; flag modern-slavery risk by country/sector.
- **Automation:** HR data integration jobs (anonymized); community program milestone tracking.
- **Notifications:** Data due, KPIs missing.
- **Approvals:** Sensitive social disclosures (pay gap, incidents) require exec approval.
- **Risks:** Privacy (anonymization mandatory), under-reporting, cultural bias.
- **Best practices:** GRI 400s/ESRS S-series alignment; anonymize; respect local labor law.
- **Current state:** ⚠️ `esg_pillar='social'` supported; worker modules exist. ❌ Social metric catalog, human-rights assessments, community programs.

---

### 4.22 Environmental Sustainability

- **Purpose / Value:** Environmental pillar depth beyond carbon: water, waste, biodiversity, circularity, air quality, chemicals, and environmental compliance — already largely covered by the Environmental module.
- **Users:** EHS managers, site engineers, sustainability analysts.
- **Workflow:** (Owned by Environmental module) Collect activity data → Track KPIs/objectives → Evidence/permits → Benchmark → Contribute to sustainability KPI roll-up.
- **Required entities:** Existing water/waste/air/chemicals/biodiversity/permits/incidents/risks/objectives tables; add `circularity_metrics` (**NEW**, recycled content, repairability, take-back), `biodiversity_indicators` (extend existing biodiversity), `environmental_kpi_catalog` (**NEW**).
- **Relationships:** N:1 site/facility; N:1 sustainability goal/KPI (link); N:M evidence.
- **Permissions:** `environment.*` (existing) + `sustainability.environmental.rollup`.
- **KPIs:** Environmental KPI coverage, compliance-rate linkage, circularity index.
- **Dashboard widgets:** Environmental ledger summary, permit-status matrix, biodiversity net-gain tracker.
- **Reports:** Environmental performance pack (water/waste/air/biodiversity), regulatory compliance summary.
- **AI:** Predictive waste generation, water-stress risk, biodiversity impact estimation.
- **Automation:** Permit expiry, incident-to-KPI flag auto-link.
- **Notifications:** Permit/incident/limit breaches (existing), KPI roll-up changes.
- **Approvals:** Environmental KPI definition sign-off (shared).
- **Risks:** Siloed data not rolling into sustainability KPIs (integration risk #1).
- **Best practices:** CDSB/TNFD-aligned metrics; circularity per ISO 59000 series; **auto-roll environmental KPIs into the Sustainability KPI tree**.
- **Current state:** ✅ Strong environmental module. ❌ Circularity metrics, automatic roll-up into sustainability KPI tree.

---

## 5. Missing Capabilities Beyond the Given List

1. **Sustainability Data Model & Ingestion Layer** (meters, sensors, API/webhook, CSV/manual templates, data streams, unit normalization, aggregation engine). *The #1 enterprise requirement.*
2. **Greenhouse-gas-data linkage** — Sustainability KPI auto-consuming Carbon module inventory results (tCO₂e scopes) as KPI measurements.
3. **Scenario Analysis & Climate Stress Testing** (NGFS/SSP scenarios, financial quantification, internal carbon price).
4. **Sustainability Control Framework (ICFR-for-sustainability)** — controls, testing, sign-off, SOX-style; required by CSRD assurance.
5. **Double Materiality Engine** (impact + financial scoring, thresholds, board sign-off) — as distinct from simple disclosure mapping.
6. **Internal Carbon Pricing (ICP)** — shadow price in business cases; could reuse `sustainability_projects`.
7. **Sustainability Data Quality / Completeness Score** per KPI, goal, report.
8. **Peer & Industry Data Import** (CSV/Excel of benchmark datasets; GRESB/CDP/CSA questionnaire prefill bridge).
9. **GHG Verification & Limited/Reasonable Assurance workflow bridge** — hand evidence to external assurance pack.
10. **Board/Investor "Sustainability Control Tower"** with disclosure-grade export (ESRS/ISSB/GRI/TCFD packs).
11. **Regulatory Obligation Mapping** (EU CSRD/ESRS, UK SDR, SEC climate disclosure, ISSB — obligations → framework → data requirements).
12. **Target Governance & Science-Based Validation tracking** (SBTi validation status, commit→validate→achieve stages) — partially in SBTi service, but not as a governed workflow.
13. **Natural Capital / Biodiversity Net Gain accounting** (TNFD-aligned) — beyond the current biodiversity registry.
14. **Circular Economy module** (material flows, recycled content, take-back, EU CSRD E5).
15. **Sustainability Training & Competency** (EN ISO 14001/45001 requirement) linked to policies.
16. **Sustainability Calendar** (disclosures, CDP/GRESB due dates, certifications, reviews).
17. **Document-based "Claim Registry"** — every public sustainability claim with evidence link (anti-greenwashing + EU Green Claims Directive readiness).
18. **Supplier ESG Questionnaire Automation** (send, track, score, flag) — partial; formalize.
19. **Localization/Granularity** — per-site/facility KPI instances with roll-up (partially present via facility_id).
20. **Sustainability API & Webhook Exports** for external ESG platforms (GRESB, CDP, EcoVadis, ratings agencies).

---

## 6. Entity-Level Data Specifications

Legend: ✅ exists · 🔧 extend · 🆕 new

### 6.1 sustainability_programs ✅
- **Required fields:** id, organization_id, name, category, status, priority, start_date, owner_id.
- **Optional fields:** description, end_date, budget, department_id, linked_standards JSONB → 🔧 normalize to join table `program_standards(program_id, standard_id, role)`, linked_sdgs INTEGER[] → keep (denormalized, mirrored in `sdg_mappings`), linked_esg_pillars TEXT[], evidence_count, attachment_count, is_deleted, timestamps.
- **Relationships:** N:1 org/user/department; 1:N goals/initiatives/KPIs/reports; N:M standards, SDGs; N:M stakeholders.
- **Lifecycle:** draft → submitted → active → paused → completed → archived.
- **CRUD:** standard; deletes are soft; archive preserves history.
- **Search/filter:** org, status, category, priority, owner, department, date-range, SDG, standard, text (name/description), budget range.
- **AI:** charter drafting, health-prediction, semantic document search.
- **Reporting:** portfolio status, program charter, board pack, budget utilization.

### 6.2 esg_goals ✅ (🔧 extend)
- **Required:** id, org, name, esg_pillar, target_value, unit, owner_id.
- **Optional:** program_id, description, baseline, current_value, deadline, progress_pct, status, confidence, risk_level, linked_sdgs (→ keep + `sdg_mappings`), **🔧 new:** `framework_topic_id` (ESRS/ISSB), `goal_strategy_id` (link to materiality cascade), `update_frequency`, `last_updated_at`, `signoff_date`, `evidence_required` boolean.
- **Lifecycle:** not_started → in_progress → at_risk → achieved | paused | archived.
- **Search/filter:** pillar, status, program, owner, deadline window, SDG, framework topic, risk.
- **AI:** achievement forecast, anomaly detection, target recalibration suggestion, narrative generation.
- **Reporting:** goal status pack, ESRS targets disclosure draft, gap analysis.

### 6.3 sustainability_initiatives ✅ (🔧 extend)
- **Required:** id, org, name, owner_id, status.
- **Optional:** program_id, description, team, dates, budget, expected/actual_impact, milestones_count, evidence_count, risk_level, linked_sdgs; **🔧 new:** `initiative_goal_links (initiative_id, goal_id, weight)` join table; `initiative_type` ('project','initiative','program_action') — or dedicated `sustainability_projects` 🆕.
- **Lifecycle:** planning → active → on_hold → completed → cancelled → archived (existing).
- **Search/filter:** program, status, owner, milestone-slippage, budget variance, SDG.
- **AI:** impact prediction, slippage forecast, close-out drafting.
- **Reporting:** initiative registry, milestone gantt, impact validation.

### 6.4 sustainability_kpis ✅ (🔧 extend)
- **Required:** id, org, name, kpi_type, unit.
- **Optional:** existing program/goal/initiative/department/facility/owner, thresholds, aggregation, frequency; **🔧 new:** `data_stream_id` (link ingestion), `formula_id` (computed KPIs), `framework_datapoint_id` (CSRD/ISSB/GRI datapoint mapping), `data_quality_score` (computed), `is_externally_reported` boolean.
- **Lifecycle:** draft → active → paused → retired; measurement lifecycle separate.
- **Search/filter:** type, frequency, program/goal, dept/facility, owner, threshold-breach, external-report flag, framework datapoint.
- **AI:** outlier detection, forecast, auto-unit conversion, definition suggestions from framework catalogs.
- **Reporting:** KPI catalogue, performance report, disclosure datapoint mapping.

### 6.5 kpi_measurements ✅ (🔧 extend)
- **Required:** id, org, kpi_id, value.
- **Optional:** existing recorded_at/by, source, notes, dept/facility; **🔧 new:** `data_stream_id`, `batch_id`, `validation_status` (pending/passed/failed/approved/superseded), `superseded_by_id`, `lineage_json`.
- **Lifecycle:** submitted → validated → approved → superseded (immutable once approved; corrections create superseding rows).
- **Search/filter:** kpi, date-range, source, stream, validation status, recorded_by.
- **AI:** anomaly flagging, auto-classify source, duplicate detection.
- **Reporting:** data-completeness, corrections register, collection audit.

### 6.6 initiative_milestones ✅
- **Required:** id, org, initiative_id, name, due_date, status, owner_id.
- **Lifecycle:** pending → in_progress → completed | overdue | cancelled.
- **Search/filter:** initiative, status, due window, owner.
- **AI:** slippage prediction; **Automation:** overdue escalation.
- **Reporting:** milestone registry (rolls into initiative reports).

### 6.7 sdg_mappings ✅ (🔧 extend)
- **Required:** id, org, sdg_id, entity_type, entity_id, contribution_pct.
- **🔧 new:** `sdg_master` reference table (17 SDGs + targets + indicators) to avoid hardcoded id-only semantics; add `evidence_id` link.
- **Search/filter:** sdg_id, entity_type, contribution threshold.
- **Reporting:** SDG contribution matrix.

### 6.8 sustainability_evidence ✅ (🔧 extend)
- **Required:** id, org, entity_type, entity_id, title, evidence_type, uploaded_by.
- **Optional:** existing document_id, description, tags, version, expiry_date, approval_status, ai_extracted_data; **🔧 new:** `classification_model_version`, `hash_sha256` (integrity), `review_history_json`, `linked_report_ids TEXT[]`, `evidence_reviews` 🆕 (reviewer, verdict, comments, date).
- **Lifecycle:** draft → submitted → under_review → approved | rejected → archived; version increments on resubmit.
- **Search/filter:** entity, type, tag, status, expiry window, uploader, AI-extracted fields.
- **AI:** classification, field extraction, duplicate/fraud detection, coverage-gap suggestions.
- **Reporting:** evidence index (assurance pack), coverage matrix, expiry forecast.

### 6.9 sustainability_approvals ✅ (🔧 upgrade to multi-step)
- **Required:** id, org, entity_type, entity_id, status, submitted_by.
- **🔧 new:** `approval_templates` 🆕 (entity_type, steps JSON, conditions, SLAs), `approval_instances` (template_id, current_step), `approval_steps` (approver, sequence, decision, comments, completed_at, delegation), `approval_reroutes` (audit).
- **Lifecycle:** draft → submitted → in_review → approved | rejected (per chain).
- **Search/filter:** entity, status, approver, due, SLA-breach.
- **AI:** smart routing, delay prediction, draft comments.
- **Reporting:** approval register, SLA metrics.

### 6.10 sustainability_reports ✅ (🔧 extend)
- **Required:** id, org, name, report_type, format, status.
- **🔧 new:** `report_schedules` 🆕 (report_id, cadence, recipients, next_run, enabled), `report_distributions` 🆕 (rendered_file_url, distributed_to, distributed_at, version), `data_as_of` timestamp on generated pack; `content_snapshot_json` for regeneration consistency; `disclosure_pack_id` (ESRS/ISSB/GRI/TCFD).
- **Lifecycle:** draft → generated → under_review → approved → published → archived.
- **Search/filter:** type, program, status, period, format, schedule.
- **AI:** narrative drafting, executive summary, translation, gap detection.
- **Reporting:** meta-report catalogue + schedule adherence.

### 6.11 sustainability_certifications 🆕 (NEW)
- **Required:** id, org, entity_type, entity_id, certification_type, certifying_body, certificate_number, issue_date, expiry_date, scope, status, owner_id.
- **Optional:** accreditation, surveillance_audit_dates, findings_summary, linked_evidence, renewal_fee, notes.
- **Lifecycle:** active → pending_expiry → expired | suspended | revoked | archived (renewal creates new instance).
- **Search/filter:** type, body, entity, status, expiry window, scope text.
- **AI:** certificate classification, date extraction, renewal-cost forecast, gap recommendation.
- **Reporting:** certification register, expiry forecast, portfolio matrix.

### 6.12 benchmark_definitions / benchmark_datasets / benchmark_results 🆕 (NEW)
- **Required (definition):** id, org, kpi_id, basis (industry/peer/regulatory/self), methodology, status, source_dataset_id.
- **Required (dataset):** id, org, provider, industry_code, region, period, metric_key, value, unit, source_url/attribution, is_verified.
- **Required (result):** id, org, benchmark_id, period, entity_value, percentile_rank, gap_to_median, gap_to_leader, computed_at.
- **Lifecycle:** definition draft→active→retired; results regenerated on refresh.
- **Search/filter:** kpi, basis, industry, region, period, provider.
- **AI:** benchmark recommendation, rank forecast, anomaly vs peers.
- **Reporting:** benchmark ladder, position paper, KPI-vs-peers.

### 6.13 materiality_assessments + materiality_topics + materiality_surveys + materiality_responses 🆕 (NEW)
- **Required (assessment):** id, org, name, methodology (double_materiality/impact_only/financial_only), status, assessment_period, approved_by, approval_date.
- **Required (topic):** id, assessment_id, topic_key (ESRS/SASB/industry), impact_score, financial_score, weighted_impact, weighted_financial, materiality_verdict, evidence_id.
- **Required (survey):** id, assessment_id, stakeholder_group_id, survey_type, status, open_at, close_at.
- **Required (response):** id, survey_id, stakeholder_id, topic_scores_json, open_feedback, submitted_at.
- **Lifecycle:** draft → surveying → scoring → thresholding → approved → archived.
- **Search/filter:** assessment, status, topic, stakeholder group, verdict.
- **AI:** topic-universe generation, free-text clustering, narrative drafting.
- **Reporting:** double-materiality matrix (bubble chart), CSRD-ready narrative, evidence pack.

### 6.14 stakeholder_groups / stakeholders / stakeholder_engagements / engagement_findings 🆕 (NEW)
- **Required (group):** id, org, group_type (investor/customer/employee/community/ngos/regulator/supplier), name, description, salience.
- **Required (stakeholder):** id, org, group_id, name (or pseudonym), contact_methods, consent_status.
- **Required (engagement):** id, org, stakeholder_group_id, engagement_type, status, dates, method, outcome_summary, materiality_assessment_id.
- **Required (finding):** id, engagement_id, finding_text, topic_key, action_plan_id, status.
- **Lifecycle:** planned → invited → active → completed → analyzed.
- **Search/filter:** group, type, status, date-range, topic.
- **AI:** sentiment, topic clustering, outcome summarization.
- **Reporting:** engagement log, SBM-2 evidence pack, sentiment trend.

### 6.15 sustainability_policies 🆕 (NEW)
- **Required:** id, org, title, policy_type (climate/environment/social/governance/sourcing), version, status, effective_date, owner_id, approval_date.
- **Optional:** review_frequency, next_review_date, framework_links, program_id, scope_entities, ratification_evidence_id.
- **Lifecycle:** draft → under_review → approved → published → under_revision → retired.
- **Search/filter:** type, status, framework, review-due window, owner.
- **AI:** drafting, framework-clause gap detection, revision summarization.
- **Reporting:** policy register, coverage gap report.

### 6.16 sustainability_risks + risk_scenarios + risk_indicators 🆕 (NEW)
- **Required (risk):** id, org, title, risk_category (transition/physical/social/governance), risk_subcategory (TCFD: policy/legal/tech/market/reputation; acute/chronic; TNFD…), likelihood, impact_score, financial_impact_estimate, status, owner_id, scenario_id.
- **Required (scenario):** id, org, scenario_type (ngfs-1.5/2/net-zero/current-policies/ssp), horizon, qualitative_narrative, key_assumptions_json.
- **Required (indicator):** id, org, risk_id, kpi_id, threshold_warning, threshold_critical.
- **Lifecycle:** identify → assess → mitigate → monitor → review; status: open/mitigating/monitoring/closed.
- **Search/filter:** category, TCFD/TNFD tag, scenario, owner, status, likelihood×impact.
- **AI:** emerging-risk screening, geo-physical-risk quantification, narrative drafting.
- **Reporting:** TCFD/TNFD-aligned risk report, risk register, heatmap.

### 6.17 sustainability_action_plans + action_plan_tasks 🆕 (NEW)
- **Required (plan):** id, org, title, source_type (goal_gap/risk_materiality/audit_finding/benchmark_gap), source_entity_id, owner_id, due_date, status.
- **Required (task):** id, plan_id, title, assignee_id, due_date, status, evidence_id.
- **Lifecycle:** open → in_progress → under_review → closed → verified (effectiveness).
- **Search/filter:** source, owner, status, due window, effectiveness due.
- **AI:** plan generation from gap analysis, owner recommendation, delay forecast.
- **Reporting:** plan register, gap-closure report.

### 6.18 performance_scorecards + scorecard_entries 🆕 (NEW)
- **Required (scorecard):** id, org, name, scope (entity_type list or program), owner_id, definition_json (weights), status.
- **Required (entry):** id, scorecard_id, target_entity_id, score, trend, period, calculated_at.
- **Lifecycle:** draft → active → archived; entries recomputed by job.
- **Search/filter:** scorecard, entity, period, score band.
- **AI:** score prediction, commentary, deterioration alerts.
- **Reporting:** scorecard pack, health roll-up.

### 6.19 Supplier Sustainability additions 🆕 (on top of existing supplier_esg/carbon)
- `supplier_sustainability_requirements` (supplier_id, requirement_id, standard, effective_from, status)
- `supplier_improvement_plans` (supplier_id, plan_id, target_score, reassessment_date, status)
- `supplier_tiering` (supplier_id, period, tier A–D, score_component_breakdown, rationale, approved_by)
- **Search/filter:** tier, score range, region, commodity, improvement status.
- **AI:** score prediction, questionnaire drafting, anomaly detection.

### 6.20 New supporting infrastructure entities
- `sustainability_data_streams` 🆕 (id, org, name, stream_type (meter/api/webhook/import/manual), provider, config_json, scheduling, status, last_ingested_at, unit_normalization_json)
- `sustainability_data_points` 🆕 (id, org, stream_id, kpi_id, facility_id, captured_at, raw_value, normalized_value, unit, quality_flags, validation_status)
- `sustainability_control_framework` 🆕 (id, org, control_id, name, entity_type, entity_id, control_type, frequency, owner_id, evidence_requirement, testing_due_date, status)
- `sustainability_control_tests` 🆕 (id, org, control_id, test_date, tested_by, result, finding, evidence_id, approved_by)
- `sustainability_calendar_events` 🆕 (id, org, event_type (disclosure_cdp/gresb/certification_renewal/policy_review/assessment), title, due_date, owner_id, linked_entity_id, status)
- `sustainability_obligation_mappings` 🆕 (id, org, regulation (csrd/issb/sec/uk_sdr/cdp), datapoint_key, kpi_id, evidence_requirement, due_date, status)

---

## 7. UX / Information Architecture Design

### 7.1 Complete Sidebar Navigation (Sustainability section)

```
SUSTAINABILITY (icon: Leaf)
├── Overview                       /sustainability                    [Dashboard]
├── Programs                       /sustainability/programs
├── Goals                          /sustainability/goals
├── KPIs                           /sustainability/kpis
├── Initiatives                    /sustainability/initiatives
├── Materiality                    /sustainability/materiality        (NEW)
├── Stakeholders                   /sustainability/stakeholders       (NEW)
├── Action Plans                   /sustainability/action-plans       (NEW)
├── Risks                          /sustainability/risks              (NEW)
├── Certifications                 /sustainability/certifications     (NEW)
├── Evidence                       /sustainability/evidence
├── Approvals                      /sustainability/approvals
├── Reports                        /sustainability/reports
├── Benchmarking                   /sustainability/benchmarking       (NEW)
├── Policies                       /sustainability/policies           (NEW)
├── Data Collection                /sustainability/data               (NEW — streams/ingestion)
├── Sustainability Calendar        /sustainability/calendar           (NEW)
└── Settings                       /sustainability/settings
```

**Contextual cross-links (not duplicates):** Carbon & GHG, Environmental, ESG, and Supplier Sustainability remain top-level modules; Sustainability links into them (e.g., a Goal's detail page has tabs surfacing Carbon module Scope emissions and Environmental water/waste KPI data).

### 7.2 Complete Page Hierarchy

```
/sustainability
├── /overview (alias of /sustainability)
├── /programs
│   ├── /new
│   └── /[id]  (tabs: Overview | Goals | Initiatives | KPIs | Evidence | Reports | Timeline)
├── /goals
│   ├── /new
│   └── /[id]  (tabs: Progress | KPIs | Evidence | Risks | Action Plans | History)
├── /kpis
│   ├── /new
│   ├── /[id]  (tabs: Trend | Measurements | Thresholds | Evidence | Lineage)
│   ├── /[id]/measurements/new
│   └── /[id]/measurements/import
├── /initiatives
│   ├── /new
│   └── /[id]  (tabs: Overview | Milestones | Impact | Budget | Evidence | Team)
├── /materiality
│   ├── /new
│   ├── /[id]  (tabs: Matrix | Topics | Surveys | Stakeholders | Approval | Report)
│   └── /[id]/surveys/[surveyId]
├── /stakeholders
│   ├── /groups
│   ├── /engagements
│   └── /[id]
├── /action-plans
│   ├── /new
│   └── /[id]  (tabs: Tasks | Evidence | Effectiveness)
├── /risks
│   ├── /new
│   ├── /[id]  (tabs: Assessment | Indicators | Mitigations | Scenarios | History)
│   └── /scenarios
├── /certifications
│   ├── /new
│   └── /[id]
├── /evidence
│   ├── /new
│   └── /[id]
├── /approvals (worklist + my-approvals)
├── /reports
│   ├── /new
│   ├── /[id]
│   └── /schedules
├── /benchmarking
│   ├── /kpivsindustry
│   ├── /peer-sets
│   └── /[benchmarkId]
├── /policies
│   ├── /new
│   └── /[id]
├── /data
│   ├── /streams
│   ├── /imports
│   └── /quality
├── /calendar
└── /settings
    ├── /general
    ├── /approvals (templates)
    ├── /notifications
    ├── /benchmarks
    ├── /frameworks
    ├── /sdg-master
    ├── /permissions
    └── /integrations
```

---

## 8. Dashboard, Charts, Tables, Filters, Forms, Detail & Settings Design

### 8.1 Executive/Overview Dashboard Layout (Sustainability Control Tower)

```
┌──────────────────────────────────────────────────────────────────────────┐
│ Header:  Sustainability Overview   [Period] [Site/Facility] [Search] [AI] │
├───────────────────────┬──────────────────────────────────────────────────┤
│ Stat Tiles (KPI roll) │ Row 1: Goals Health Donut + Programs Status Bar  │
│ • Goal health %       │                                                  │
│ • KPIs on-track %     │──────────────────────────────────────────────────│
│ • Initiatives on-track│ Row 2: SDG Radar | Materiality Top Topics |      │
│ • Certifications valid│        Benchmark Position (KPI vs peers)         │
│ • Scope 1+2 (tCO₂e)   │──────────────────────────────────────────────────│
│                       │ Row 3: At-Risk Goals list | Action Plan funnel | │
│                       │        Data Quality gauge | Approval queue       │
└───────────────────────┴──────────────────────────────────────────────────┘
```

### 8.2 Cards
- **Program Card:** name, category, status pill, priority, progress %, budget bar, goal count, mini sparkline.
- **Goal Card:** name, pillar icon, progress ring, status, owner, deadline, risk pill, forecast flag (AI).
- **KPI Card:** name, unit, current/target, trend arrow, threshold traffic light, data-quality dot.
- **Initiative Card:** name, status, milestone progress, budget variance, timeline.
- **Evidence Card:** title, type, entity link, status, expiry, AI-extracted summary preview.
- **Certification Card:** type, body, certificate no, issue/expiry, status, days-to-expiry.
- **Materiality Topic Card:** topic, impact/financial scores, verdict, stakeholders consulted.
- **Action Plan Card:** source, owner, due, progress, effectiveness-due date.
- **Risk Card:** category/subcategory, likelihood×impact, owner, mitigation status.

### 8.3 Charts
- **Donut:** Goal health (achieved/in_progress/at_risk/not_started) — exists.
- **Bar:** Program status distribution; pillar goal distribution — exists.
- **Stacked Bar:** E/S/G performance over time.
- **Line/Area:** KPI trend vs target, forecast band (AI).
- **Scatter/Bubble:** Double-materiality matrix (topic bubbles sized by stakeholder salience).
- **Radar:** SDG contribution coverage.
- **Heatmap:** KPI × facility/department performance; benchmark regional map.
- **Funnel:** Initiative pipeline; action-plan closure.
- **Gauge:** Data completeness, budget utilization, goal achievement likelihood.
- **Timeline/Gantt:** Initiative milestones; certification/review calendar.
- **Box Plot / Ladder:** KPI vs industry/peer benchmarks.

### 8.4 Tables
- Programs/Goals/KPIs/Initiatives tables with multi-select, inline status edit, sortable columns, CSV export.
- Measurements table (time-series view with sparkline in row).
- Evidence table (entity, type, status, expiry, version).
- Approvals worklist (entity, submitted, due, SLA, step).
- Certifications register (type, body, entity, issue/expiry, status).
- Stakeholder engagements log.
- Action plans register.
- Risk register (category, L×I, owner, status).
- Benchmark results table (metric, entity value, percentile, gap-to-leader).
- Data-streams/imports table (stream, provider, last ingest, status, quality).

### 8.5 Filters (shared Filter Bar)
Entity filter (program/goal/kpi), Pillar (E/S/G), Status, Priority, Owner, Department, Facility/Site, Date range, SDG, Framework topic (ESRS/ISSB/SASB/GRI), Benchmark basis, Data-quality band, Expiry window, Search text (+ semantic AI search).

### 8.6 Forms
- **Program:** name, description, category, owner, department, dates, budget, priority, linked standards, SDGs, ESG pillars.
- **Goal:** name, program, pillar, baseline/target/unit, deadline, owner, confidence, risk, linked SDGs, framework topic, evidence requirement.
- **KPI:** name, type, unit, frequency, aggregation, thresholds, program/goal/initiative, department/facility, owner, data stream link, framework datapoint, externally-reported flag.
- **Measurement:** value, recorded_at, source, notes, dept/facility (+ bulk import wizard: CSV/Excel template, validation preview, error report).
- **Initiative:** name, program, owner, team, dates, budget, expected/actual impact, linked goals.
- **Materiality Assessment:** name, methodology, period, stakeholders, topic universe, threshold settings.
- **Materiality Topic:** topic key, impact score, financial score, evidence, rationale.
- **Stakeholder Engagement:** group, type, method, dates, outcome, findings.
- **Action Plan:** title, source, source entity, owner, due, tasks.
- **Risk:** category, subcategory, scenario, likelihood, impact, financial estimate, owner, indicators.
- **Certification:** type, body, number, entity, issue/expiry, scope, evidence.
- **Benchmark Definition:** KPI, basis, industry, region, dataset source, refresh cadence.
- **Policy:** title, type, version, effective date, review frequency, framework links, evidence.
- **Approval Template:** entity type, steps (approver role/user, sequence, condition), SLA.
- **Data Stream:** type, provider, config, scheduling, normalization, target KPI.

### 8.7 Detail Pages (tabbed, consistent pattern)
Header (name, status, owner, quick actions → Edit/Approve/Archive) → Overview summary → Performance/KPI tab → Linked entities → Evidence → Activity/History → AI Insights panel (forecast, risks, narrative) → Related module links (e.g., carbon emissions, supplier scores, environmental data).

### 8.8 Settings Pages
- **General:** fiscal year, materiality defaults, KPI update-window defaults, report defaults, currency/units, internal-carbon-price input, data-as-of policy.
- **Approval Templates:** entity-type chain configuration, SLAs, delegation, auto-approve rules.
- **Notifications:** per-role and per-entity-type toggles, digest frequency, escalation rules.
- **Benchmarks:** industry mappings for org sites, provider datasets, refresh cadence.
- **Frameworks:** enable/configure ESRS/ISSB/SASB/GRI/TCFD/TNFD/CDP; datapoint→KPI mapping table.
- **SDG Master:** reference data maintenance.
- **Permissions:** role×permission matrix for all `sustainability.*` permissions.
- **Integrations:** data-stream connectors (API/webhook/IoT/CSV), GRESB/CDP/EcoVadis export bridges, calendar sync.

---

## 9. REST API Design

Conventions follow existing platform: `/api/v1/...`, `requirePermission`, Zod validation, JSON, pagination via `limit/offset/cursor`.

### 9.1 Core Sustainability (existing — extend)
| Method | Endpoint | Permission | Purpose |
|---|---|---|---|
| GET/POST | `/sustainability/programs` | `sustainability.program.view/create` | List/Create |
| GET/PUT/DELETE | `/sustainability/programs/:id` | `view/edit/delete` | Detail/Update/Archive |
| POST | `/sustainability/programs/:id/approvals` | `approve` | Program approval workflow |
| GET | `/sustainability/programs/:id/rollup` | `view` | Goal/KPI/Initiative roll-up |
| GET/POST | `/sustainability/goals` | `goal.view/create` | List/Create |
| GET/PUT/DELETE | `/sustainability/goals/:id` | `view/edit/delete` | Detail/Update |
| POST | `/sustainability/goals/:id/progress` | `goal.edit` | Record progress (current_value) |
| POST | `/sustainability/goals/:id/approvals` | `approve` | Sign-off |
| GET | `/sustainability/goals/:id/forecast` | `view` | AI achievement forecast |
| GET/POST | `/sustainability/kpis` | `kpi.view/create` | List/Create |
| GET/PUT/DELETE | `/sustainability/kpis/:id` | `view/edit/delete` | Detail/Update |
| GET/POST | `/sustainability/kpis/:id/measurements` | `kpi.manage-measurements` | List/Add measurement |
| POST | `/sustainability/kpis/:id/measurements/import` | `kpi.manage-measurements` | Bulk import |
| POST | `/sustainability/kpis/:id/measurements/:mId/supersede` | `approve` | Correction workflow |
| GET | `/sustainability/kpis/:id/analytics` | `view` | Trend/forecast/outliers |
| GET/POST | `/sustainability/initiatives` | `initiative.view/create` | List/Create |
| GET/PUT/DELETE | `/sustainability/initiatives/:id` | `view/edit/delete` | Detail/Update |
| GET/POST/PUT | `/sustainability/initiatives/:id/milestones` | `initiative.edit` | Milestones |

### 9.2 Evidence & Approvals (extend existing)
| Method | Endpoint | Permission |
|---|---|---|
| GET/POST | `/sustainability/evidence` | `sustainability.evidence.view/upload` |
| GET/PUT/DELETE | `/sustainability/evidence/:id` | `view/edit/delete` |
| POST | `/sustainability/evidence/:id/reviews` | `review` |
| POST | `/sustainability/evidence/:id/approve` · `/reject` | `approve` |
| GET | `/sustainability/evidence/coverage?entityType=&entityId=` | `view` |
| GET | `/sustainability/approvals?status=&entityType=&assignedTo=` | `approval.*` |
| POST | `/sustainability/approvals/:id/step/:stepId/decide` | `approve` / `reject` |
| GET/POST/PUT | `/sustainability/approval-templates` | `approval.manage` |

### 9.3 Reports & Schedules
| Method | Endpoint | Permission |
|---|---|---|
| GET/POST | `/sustainability/reports` | `sustainability.report.view/create` |
| POST | `/sustainability/reports/:id/generate` | `generate` |
| POST | `/sustainability/reports/:id/publish` | `publish` |
| GET/POST/PUT | `/sustainability/report-schedules` | `report.manage` |

### 9.4 Materiality, Stakeholders, Action Plans, Risks (NEW)
| Method | Endpoint | Permission |
|---|---|---|
| GET/POST | `/sustainability/materiality` | `materiality.view/create` |
| GET/PUT | `/sustainability/materiality/:id` | `view/edit` |
| POST | `/sustainability/materiality/:id/submit` / `:id/approve` | `submit/approve` |
| GET/POST | `/sustainability/materiality/:id/topics` · `:id/surveys` · `:id/surveys/:sid/responses` | `view/edit` |
| GET/POST | `/sustainability/stakeholders` · `/stakeholder-groups` · `/stakeholder-engagements` | `stakeholder.*` |
| GET/POST | `/sustainability/action-plans` · `/action-plans/:id` · `/action-plans/:id/tasks` | `action-plan.*` |
| GET/POST/PUT | `/sustainability/risks` · `/risks/:id` · `/risks/:id/indicators` · `/risk-scenarios` | `risk.*` |

### 9.5 Certifications, Benchmarking, Policies, Data (NEW)
| Method | Endpoint | Permission |
|---|---|---|
| GET/POST | `/sustainability/certifications` · `/:id` · `/:id/renew` · `/:id/revoke` | `certification.*` |
| GET/POST | `/sustainability/benchmarks` · `/benchmark-datasets` · `/benchmarks/:id/results` · `/benchmarks/:id/refresh` | `benchmark.*` |
| GET/POST | `/sustainability/policies` · `/:id` · `/:id/approve` | `policy.*` |
| GET/POST/PUT | `/sustainability/data-streams` · `/data-streams/:id/ingest` · `/data-streams/:id/test` | `sustainability.data.*` |
| GET | `/sustainability/data-points?streamId=&kpiId=&facilityId=&dateFrom=&dateTo=` | `data.view` |
| GET | `/sustainability/data-quality?entityType=&entityId=` | `data.view` |
| GET/POST | `/sustainability/controls` · `/controls/:id/tests` | `sustainability.control.*` |
| GET/POST | `/sustainability/calendar-events` · `/obligation-mappings` | `view/manage` |
| GET/POST | `/sustainability/imports` · `/imports/:id/validate` · `/imports/:id/commit` | `data.import` |
| POST | `/sustainability/exports/gresb` · `/exports/cdp` · `/exports/ecovadis` | `report.publish` (write JSON packs) |

### 9.6 Performance Scorecards (NEW)
| Method | Endpoint | Permission |
|---|---|---|
| GET/POST/PUT | `/sustainability/scorecards` · `/:id/entries` · `/:id/recalculate` | `sustainability.performance.*` |

---

## 10. Service Layer Responsibilities

Follows existing pattern (`services/ + repositories/ + routes/`). New/evolved services:

| Service | Responsibilities |
|---|---|
| `sustainability-programs.service` ✅ | Program CRUD, portfolio roll-up, charter generation, budget guardrails |
| `esg-goals.service` ✅ | Goal CRUD, progress engine (auto from KPIs), status transitions, forecast integration |
| `kpi-engine.service` ✅ | KPI CRUD, measurement ingestion, aggregation (latest/sum/avg/min/max/count), threshold breach detection |
| `kpi-data-collection.service` 🆕 | Data-stream registration, scheduling, ingestion (API/IoT/CSV/manual), normalization, dedupe, quality scoring |
| `kpi-data-quality.service` 🆕 | Completeness, freshness, outlier flags, validation rules, correction/supersede workflow |
| `initiatives.service` ✅ | Initiative + milestone CRUD, slippage detection, impact tracking |
| `sdg-mapper.service` ✅ | SDG mapping, contribution roll-up, SDG master data |
| `sustainability-evidence.service` ✅ | Evidence CRUD, classification, expiry engine, coverage analytics, integrity hashing |
| `sustainability-workflows.service` ✅ | Approval orchestration (upgrade: templates, steps, SLAs, delegation, rerouting) |
| `sustainability-reports.service` ✅ | Report generation, scheduling, distribution, data-as-of snapshot, disclosure packs |
| `sustainability-analytics.service` ✅ | Cross-entity analytics, scorecards, health model |
| `materiality.service` 🆕 | Assessment lifecycle, surveys, double-materiality scoring, thresholding, cascade mapping |
| `stakeholder-engagement.service` 🆕 | Groups, stakeholders, engagements, findings → action links |
| `sustainability-risks.service` 🆕 | Risk register, scenarios, TCFD/TNFD mapping, indicators, quantification |
| `sustainability-action-plans.service` 🆕 | Plan/task lifecycle, effectiveness verification |
| `sustainability-certifications.service` 🆕 | Certification registry, renewal, expiry, evidence linkage |
| `benchmarking.service` 🆕 | Definitions, datasets, computation (percentile/rank/gaps), refresh |
| `sustainability-policies.service` 🆕 | Policy registry, framework coverage, review cycles |
| `sustainability-controls.service` 🆕 | Control framework, test scheduling, sign-off |
| `sustainability-calendar.service` 🆕 | Disclosure/certification/review calendar, obligation mapping |
| `sustainability-ai.service` 🆕 (orchestrates) | Forecasts, outlier/anomaly, narrative generation, semantic search, classification, gap detection — calling the existing AI Foundation |
| `sustainability-notifications.service` 🆕 | Event → notification rules → channels (in-app, email, slack/webhook) |
| `sustainability-permissions.service` | Maps RBAC matrix for all `sustainability.*` permissions |
| `supplier-sustainability.service` 🔧 | Tiering, requirements enforcement, improvement plans, questionnaire automation (extends existing supplier-esg/carbon services) |
| `environmental-rollup.service` 🆕 | Idempotent job: Environmental/Carbon module data → sustainability KPI measurements (golden-source integration) |

**Cross-cutting service contracts:** Every service exposes `list/create/get/update/softDelete` plus module-specific commands; analytics are computed in service layer, not raw SQL in routes; AI operations call the AI Foundation service via typed contracts; integrations live behind a `connector` abstraction.

---

## 11. Module Boundary Ownership (Avoiding Overlap)

| Capability | Owner | Why (guardrail) |
|---|---|---|
| Programs, Goals, KPIs, Initiatives, Evidence, Approvals, Reports | **Sustainability** | Strategic spine; nothing else may define goals/KPIs |
| GHG inventories, Scopes 1/2/3, factors, SBTi, offsets | **Carbon & GHG** | Physics/accounting rules; Sustainability consumes results as KPI measurements |
| Water/waste/air/chemicals/permits/biodiversity/incidents | **Environmental** | Regulatory + site-level compliance; Sustainability consumes roll-up |
| Frameworks, metric libraries, data points, disclosures, assurance | **ESG** | Disclosure production; consumes KPI/measurement data |
| Supplier ESG scores, supplier carbon, tiering | **Supply Chain Sustainability** | Supplier domain expertise; publishes scores |
| Materiality, stakeholder engagement, benchmarking, policies, risks, action plans, certifications, performance scorecards | **Sustainability** | Strategy/portfolio nature; ESG module maps disclosure from these |
| Data streams, imports, normalization | **Sustainability (Data Collection)** | One shared ingestion fabric feeding all four domains |
| Obligation mapping (CSRD/ISSB/SEC/SDR) | **ESG (as "Regulatory Reporting")** | Disclosure obligation owner; Sustainability receives requirements |

**Overlap prevention rules:**
1. **One golden KPI definition** per measurement concept — no duplicate definitions across modules. ESG `esg_metrics` serve as the disclosure metric catalogue; `sustainability_kpis` are operational KPIs; a mapping table links them.
2. **No duplicate data collection** — ingestion feeds `sustainability_data_points` once; domains subscribe to normalized points.
3. **No duplicate risk registers** — enterprise risk owns taxonomy; Sustainability owns ESG risk subset with TCFD/TNFD mapping.
4. **Reports:** each domain produces its own reports; the Sustainability module produces cross-domain integrated reports (executive/board) that compose module data via read-only queries.

---

## 12. Cross-Module Integration Map

```
┌──────────────┐   data points    ┌──────────────────────────┐
│  Data Streams│ ───────────────▶ │ Sustainability Data Layer │
│ (IoT/API/CSV)│                  │ (normalize + validate)    │
└──────────────┘                  └───────────┬──────────────┘
                                              │ normalized points
        ┌─────────────────────────────────────┼─────────────────────────┐
        ▼                                     ▼                         ▼
┌───────────────┐   KPI measurements   ┌──────────────┐   scope results ┌───────────────┐
│ Environmental  │ ───────────────────▶ │ Sustainability│◀──────────────── │  Carbon & GHG  │
│ (water/waste…) │   KPI tree          │   (Goals,    │   tCO₂e, SBTi    │  (Scopes 1-3)  │
└───────────────┘                      │   Programs)  │                  └───────────────┘
                                       └──────┬───────┘
                                              │ progress + evidence
                                              ▼
                                       ┌───────────────┐   disclosure packs   ┌───────────────┐
                                       │   ESG module   │ ──────────────────▶ │  External:     │
                                       │ (frameworks,   │                     │ CSRD/ISSB/GRI  │
                                       │ data points,   │                     │ CDP/GRESB/     │
                                       │ assurance)     │                     │ EcoVadis/rating│
                                       └───────────────┘                     └───────────────┘
                                              ▲
                                              │ material topics + KPI feeds
                                       ┌──────┴───────┐
                                       │ Supply Chain │  supplier ESG/carbon scores + tiering
                                       │ Sustainability│ ───────────────────────▶ Benchmarking
                                       └──────────────┘
```

---

## 13. Module Maturity Score, Gaps, and Roadmap

### 13.1 Maturity Scorecard — **54 / 100**

Scoring: 0–10 per dimension, weighted. Criteria: entity exists, workflow exists, production UX, AI/automation, enterprise controls.

| Dimension | Weight | Raw | Weighted | Rationale |
|---|---|-----|----------|-----------|
| Strategy & Goal Management (programs/goals/SDGs) | 15% | 8 | 12.0 | Strong core, lacks strategy-cascade & framework-topic mapping |
| KPIs & Measurements | 15% | 6 | 9.0 | Manual collection, no ingestion fabric, no immutability |
| Evidence & Assurance readiness | 10% | 6 | 6.0 | Good entity; no traceability/coverage engine/hashing |
| Approvals & Workflows | 10% | 5 | 5.0 | Single-level only; no chains/templates/SLA |
| Reporting | 10% | 5 | 5.0 | Types + generation exist; no scheduling/distribution/narrative AI |
| Materiality & Stakeholders | 10% | 1 | 1.0 | Disclosure mapping only; no double-materiality engine |
| Certifications & Policies | 5% | 2 | 1.0 | Only via evidence/policies generic module |
| Benchmarking | 10% | 0 | 0.0 | Absent |
| Risk & Action Plans | 5% | 2 | 1.0 | Environmental risks only; no ESG risk/scenarios/action plans |
| AI & Automation | 10% | 4 | 4.0 | Evidence extraction + some analytics; no narrative/forecast |
| **Total** | **100%** | | **54 / 100** | **Level 3: "Managed Core, Unintegrated Edge"** |

### 13.2 Missing Features (Must-have, prioritized)
1. Sustainability Data Model + Ingestion (streams, imports, normalization) — P0
2. Double Materiality Assessment engine + cascade — P0
3. Evidence→Report traceability + coverage analytics + integrity — P0
4. Multi-step approval templates + SLAs — P0
5. KPI measurement immutability/corrections/approvals — P0
6. Benchmarking engine (industry/peer/regulatory/self) — P1
7. ESG Risk register + TCFD/TNFD scenarios — P1
8. Action Plans (goal/risk-gap closure) — P1
9. Certification registry + expiry automation — P1
10. Sustainability Policies registry + framework coverage — P1
11. Stakeholder engagement + SBM-2 evidence — P1
12. Report scheduling + distribution + data-as-of — P1
13. Environmental/Carbon → KPI auto-roll-up jobs — P1
14. Sustainability Control Framework (ICFR-for-ESG) — P1
15. Executive scorecards + health model — P2

### 13.3 Nice-to-Have Features
- Semantic/AI natural-language query over sustainability data ("show me water intensity trend vs target for Karachi site").
- Green Claims Registry (every public claim + evidence, EU Green Claims Directive readiness).
- Internal Carbon Price (ICP) shadow pricing embedded in project/program business cases.
- Sustainability Calendar with CDP/GRESB/disclosure deadlines.
- Digital twin / IoT meter dashboards for energy/water live streams.
- Translation of report narratives (multi-language export).
- PDF fingerprinting/watermark for report distribution control.
- Supplier questionnaire automation with AI scoring.
- Biodiversity net-gain accounting (TNFD LEAP).
- Circularity metrics (recycled content, take-back rate).
- "What-if" goal-simulator (change target → forecast KPI path).
- Peer-set collaboration spaces for consortium sustainability programs.

### 13.4 Enterprise Features (differentiating at scale)
- **Multi-entity governance:** site/facility/subsidiary-level KPI instances with configurable roll-up rules and intercompany eliminations.
- **Granular RBAC + data-scoping** on every entity (region/site/function), with delegated admin.
- **Assurance workspace:** external-assessor read-only access, sealed evidence sets, limited-distribution report cycles, ISAE 3000/ESRS-aligned workbenches.
- **Audit-grade change control:** full entity history, diff views, "who changed what when" on all governed objects.
- **Configurable control framework** with testing cycles and management sign-off (SOX-style for sustainability reporting).
- **Regulatory obligation library** (CSRD/ESRS datapoints, ISSB S1/S2, SEC, UK SDR, EU Taxonomy) with automated requirement → datapoint → KPI → evidence mapping.
- **API-first exports** (REST + webhooks) for GRESB, CDP, EcoVadis, ratings agencies, Power BI/Tableau.
- **Multi-currency/multi-unit normalization** with audit-grade conversion log.
- **Scheduled ETL jobs with observability** (job logs, retries, SLA monitoring).
- **Tenancy isolation + data residency** options for global roll-out.

### 13.5 Future Roadmap (phased)

| Phase | Focus | Key deliveries | Target impact |
|---|---|---|---|
| **Phase 1 (0–3 mo) — Trust & Data Foundation** | Close the data loop | Data streams + import engine; KPI measurement immutability + approvals; evidence integrity + coverage; report scheduling + data-as-of | Raises score to ~68; assurance-ready data |
| **Phase 2 (3–6 mo) — Strategy & Governance** | Materiality-led strategy | Double-materiality engine + surveys; stakeholder engagement; framework-topic mapping; goal cascade; multi-step approvals; ESG risk register + TCFD scenarios; action plans | Raises score to ~80; CSRD/ISSB-credible |
| **Phase 3 (6–12 mo) — Differentiation** | Insight & position | Benchmarking engine; certification registry; policies + coverage; executive scorecards; environmental/carbon auto-roll-up; control framework | Raises score to ~90; investor-grade |
| **Phase 4 (12–18 mo) — Enterprise Scale** | Scale & integrate | Obligation library; assurance workspace & external assessor portal; API/webhook export bridges (GRESB/CDP/EcoVadis); ICP; circularity & TNFD; multi-entity governance | Raises score to ~95+; comparable to MS Sustainability Manager / IBM Envizi |

---

*End of document. This is a planning artifact only — no implementation code is included. All new entities and services are named for forward-planning and are consistent with the existing repository conventions (multi-tenant UUID PKs, `is_deleted` soft-delete, `requirePermission` RBAC guards, service/repo/routes layering, Zod validation on routes).*