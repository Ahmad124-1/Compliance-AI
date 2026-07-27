/**
 * Compliance knowledge base seed data.
 *
 * Loads the 15 mandated standards with representative clauses and indexed
 * knowledge entries. Idempotent: keyed by (organization_id, code) and
 * (standard_id, clause code). Runs at startup after migrations so the
 * vector/RAG pipeline always has content to retrieve.
 */
import { query } from '../../../db/pool.js';
import { knowledgeRepo } from './repository.js';
import { SUPPORTED_STANDARDS } from './types.js';

interface ClauseSeed {
  code: string;
  title: string;
  body: string;
  category?: string;
  children?: ClauseSeed[];
}

interface StandardSeed {
  code: string;
  clauses: ClauseSeed[];
  /** Extra indexed knowledge entries beyond structured clauses. */
  extraEntries?: Array<{ domain: any; title: string; content: string; metadata?: Record<string, unknown> }>;
}

const SEED: StandardSeed[] = [
  {
    code: 'SA8000',
    clauses: [
      { code: '1', title: 'Child Labour', body: 'No use or support of child labour. Employment of young workers must comply with ILO standards; workers under 18 must not perform night or hazardous work.' },
      { code: '2', title: 'Forced and Compulsory Labour', body: 'No use or support of forced, bonded or involuntary prison labour. No withholding of identity documents or wages as a retention mechanism.' },
      { code: '3', title: 'Health and Safety', body: 'Provide a safe and healthy working environment, including COVID-19 measures, hygiene, and access to personal protective equipment.' },
      { code: '4', title: 'Freedom of Association & Right to Collective Bargaining', body: 'Respect the right of all personnel to form and join trade unions and bargain collectively without harassment or intimidation.' },
      { code: '5', title: 'Discrimination', body: 'No discrimination in hiring, remuneration, access to training, promotion, or termination based on race, caste, national origin, religion, disability, gender, or other protected status.' },
      { code: '6', title: 'Disciplinary Practices', body: 'No corporal punishment, mental or physical coercion, or verbal abuse. Disciplinary procedures must be documented and applied consistently.' },
      { code: '7', title: 'Working Hours', body: 'Comply with applicable laws on working hours. Overtime is voluntary, not to exceed 48 hours per week regular and 12 hours overtime, with at least one rest day every 7 days.' },
      { code: '8', title: 'Remuneration', body: 'Wages paid for a standard working week meet legal or industry minimum standards and are sufficient to meet basic needs. Deductions as disciplinary measure are prohibited.' },
      { code: '9', title: 'Management Systems', body: 'Establish policies, documented procedures, worker representation, and corrective action processes to implement the standard.' },
    ],
    extraEntries: [
      { domain: 'policy', title: 'SA8000 Management System Requirements', content: 'Organizations must appoint a senior manager, conduct internal audits at least every 6 months, and management reviews at least annually to maintain SA8000 certification.', metadata: { section: 'Management Systems' } },
    ],
  },
  {
    code: 'SMETA',
    clauses: [
      { code: 'A', title: 'Labour Standards', body: 'SMETA 7.0 pillar covering SA8000-style labour standards: child labour, forced labour, health & safety, freedom of association, discrimination, working hours, and wages.' },
      { code: 'B', title: 'Health & Safety', body: 'Assessment of workplace health and safety management against local law and recognized standards (e.g. ISO 45001, OHSAS).' },
      { code: 'C', title: 'Environment', body: 'Environmental performance review aligned to ISO 14001 including permits, emissions, waste, and resource use.' },
      { code: 'D', title: 'Business Ethics', body: 'Anti-bribery, anti-corruption, transparency, and responsible business conduct, integrating UNGP expectations.' },
      { code: 'E', title: 'Data Security & Cybersecurity', body: 'SMETA 7.0 introduces a new pillar on data security and cybersecurity maturity for the supply chain.' },
    ],
    extraEntries: [
      { domain: 'audit', title: 'SMETA 7.0 Two-Pillar vs Four-Pillar', content: 'A SMETA audit may be two-pillar (Labour Standards + Health & Safety) or four-pillar (adding Environment and Business Ethics). A measurement approach compares sites against a benchmark.', metadata: { auditType: 'smeta' } },
    ],
  },
  {
    code: 'SEDEX',
    clauses: [
      { code: '1', title: 'Member Compliance', body: 'SEDEX members commit to continuous improvement of working conditions and ethical business practices, sharing audits via the SAQ and SMETA.' },
      { code: '2', title: 'Self-Assessment Questionnaire (SAQ)', body: 'Suppliers complete the SAQ covering labour, health & safety, environment, and business ethics to signal transparency.' },
    ],
  },
  {
    code: 'BSCI',
    clauses: [
      { code: '1', title: 'Social Compliance', body: 'amfori BSCI Code based on international labour standards including ILO and UN declarations. Covers 11 performance areas.' },
      { code: '2', title: '11 Performance Areas', body: 'The BSCI code addresses: social management system, workers involvement, no discrimination, fair remuneration, decent working hours, occupational health & safety, no child labour, young workers protection, no precarious employment, no bonded labour, and environmental protection.' },
    ],
  },
  {
    code: 'ISO9001',
    clauses: [
      { code: '4', title: 'Context of the Organization', body: 'Determine internal and external issues and the needs of interested parties relevant to quality objectives.' },
      { code: '5', title: 'Leadership', body: 'Top management must demonstrate leadership and commitment to the quality management system and customer focus.' },
      { code: '6', title: 'Planning', body: 'Address risks and opportunities, set quality objectives, and plan changes.' },
      { code: '7', title: 'Support', body: 'Provide resources, competence, awareness, communication, and documented information.' },
      { code: '8', title: 'Operation', body: 'Plan, control, and produce conforming products/services; manage externally provided processes.' },
      { code: '9', title: 'Performance Evaluation', body: 'Monitor, measure, audit, and review QMS performance.' },
      { code: '10', title: 'Improvement', body: 'Continually improve through corrective action and opportunity evaluation.' },
    ],
  },
  {
    code: 'ISO14001',
    clauses: [
      { code: '4', title: 'Context & Environmental Aspects', body: 'Identify environmental aspects and impacts of activities, products, and services.' },
      { code: '5', title: 'Leadership & Environmental Policy', body: 'Top management commitment and a documented environmental policy.' },
      { code: '6', title: 'Planning for Environmental Risks', body: 'Plan actions to address significant environmental aspects and compliance obligations.' },
      { code: '7', title: 'Support', body: 'Competence, awareness, communication, and documented information for the EMS.' },
      { code: '8', title: 'Operational Planning & Control', body: 'Control operations that can have significant environmental impact, including emergency preparedness.' },
      { code: '9', title: 'Performance Evaluation', body: 'Monitor and measure environmental performance and evaluate compliance.' },
      { code: '10', title: 'Improvement', body: 'Address nonconformities and continually improve the EMS.' },
    ],
  },
  {
    code: 'ISO45001',
    clauses: [
      { code: '6', title: 'Planning & Hazard Identification', body: 'Identify hazards, assess OH&S risks and opportunities, and determine legal/other requirements.' },
      { code: '8', title: 'Operational Control & Emergency Preparedness', body: 'Eliminate hazards through hierarchy of controls; prepare for and respond to emergencies.' },
      { code: '9', title: 'Performance Evaluation', body: 'Monitor OH&S performance, conduct internal audits, and management review.' },
      { code: '10', title: 'Incident Investigation & Improvement', body: 'Investigate incidents, implement corrective actions, and continually improve worker safety.' },
    ],
  },
  {
    code: 'WRAP',
    clauses: [
      { code: '1', title: 'Compliance with Laws', body: 'Facilities must comply with all applicable local and national laws and regulations.' },
      { code: '2', title: 'Prohibition of Forced Labour', body: 'No forced, bonded, or involuntary labour in any form.' },
      { code: '3', title: 'Prohibition of Child Labour', body: 'No employment of workers below the legal minimum age.' },
      { code: '4', title: 'Prohibition of Harassment & Abuse', body: 'No harsh or inhumane treatment, including corporal punishment or verbal abuse.' },
      { code: '5', title: 'Compensation & Benefits', body: 'Pay at least the legal minimum wage and provide legally mandated benefits.' },
      { code: '6', title: 'Hours of Work', body: 'Hours of work must not exceed legal limits; overtime is voluntary and compensated.' },
      { code: '7', title: 'Prohibition of Discrimination', body: 'No discrimination in hiring, compensation, or promotion.' },
      { code: '8', title: 'Health & Safety', body: 'Provide a safe and healthy workplace meeting legal standards.' },
      { code: '9', title: 'Freedom of Association', body: 'Respect workers right to associate freely and bargain collectively.' },
      { code: '10', title: 'Environment', body: 'Comply with environmental laws and minimize negative environmental impact.' },
      { code: '11', title: 'Customs Compliance', body: 'Comply with customs laws and prevent illegal transshipment.' },
      { code: '12', title: 'Security', body: 'Maintain facility security to prevent unauthorized entry and contraband.' },
    ],
  },
  {
    code: 'SLCP',
    clauses: [
      { code: '1', title: 'Recruitment & Hiring', body: 'No abusive recruitment practices; transparent hiring and no recruitment fees charged to workers.' },
      { code: '2', title: 'Working Conditions', body: 'Safe, healthy, and humane working conditions per the SLCP Converged Assessment Framework.' },
      { code: '3', title: 'Terms of Employment', body: 'Clear written contracts, lawful wages, and predictable working hours.' },
      { code: '4', title: 'Worker Wellbeing', body: 'Freedom of association, no discrimination, and grievance mechanisms available to all workers.' },
    ],
  },
  {
    code: 'HIGG_FEM',
    clauses: [
      { code: '1', title: 'Environmental Management System', body: 'Facility-level environmental management including objectives, targets, and training.' },
      { code: '2', title: 'Energy & GHG Emissions', body: 'Measure energy use and greenhouse gas emissions; set reduction targets aligned to SBTi where applicable.' },
      { code: '3', title: 'Water Use', body: 'Quantify water withdrawal, discharge, and implement conservation measures.' },
      { code: '4', title: 'Waste & Chemicals', body: 'Track waste streams and chemical management; prioritize reduction and safe disposal.' },
      { code: '5', title: 'Effluents & Emissions to Air', body: 'Monitor and control air emissions and wastewater discharge against permits.' },
    ],
  },
  {
    code: 'GOTS',
    clauses: [
      { code: '1', title: 'Organic Fibre Content', body: 'Minimum 70% organic fibres for GOTS-labelled products; 95% for "organic" claim.' },
      { code: '2', title: 'Environmental Processing Criteria', body: 'Restrictions on hazardous inputs; wastewater treatment required before discharge.' },
      { code: '3', title: 'Social Criteria', body: 'Based on ILO conventions: no forced/child labour, safe working conditions, living wages encouraged.' },
      { code: '4', title: 'Chemical Inputs', body: 'Approved substance list; banned inputs including azo dyes and heavy metals.' },
    ],
  },
  {
    code: 'SBTI',
    clauses: [
      { code: '1', title: 'Near-Term Targets', body: 'Set science-based emissions reduction targets for Scopes 1, 2, and relevant Scope 3 consistent with 1.5C pathways.' },
      { code: '2', title: 'Net-Zero Commitment', body: 'Commit to net-zero by 2050 and interim targets validated by the SBTi.' },
      { code: '3', title: 'Scope 3 & Value Chain', body: 'Address value-chain emissions, including supplier engagement for financed and purchased goods emissions.' },
    ],
  },
  {
    code: 'UNGP',
    clauses: [
      { code: '1', title: 'State Duty to Protect', body: 'States must protect against human rights abuse by business through regulation, policy, and adjudication.' },
      { code: '2', title: 'Corporate Responsibility to Respect', body: 'Businesses must avoid infringing on human rights and address adverse impacts through a human rights policy, due diligence, and remediation.' },
      { code: '3', title: 'Access to Remedy', body: 'Both state judicial and non-judicial grievance mechanisms and operational-level grievance mechanisms for those impacted.' },
    ],
  },
  {
    code: 'ILO',
    clauses: [
      { code: 'C029', title: 'ILO C029 Forced Labour Convention', body: 'Suppression of forced or compulsory labour; no exaction of labour under menace of penalty.' },
      { code: 'C087', title: 'ILO C087 Freedom of Association', body: 'Workers and employers have the right to establish and join organizations of their choosing.' },
      { code: 'C098', title: 'ILO C098 Right to Collective Bargaining', body: 'Protect workers against anti-union discrimination and promote voluntary collective bargaining.' },
      { code: 'C100', title: 'ILO C100 Equal Remuneration', body: 'Equal remuneration for work of equal value regardless of sex.' },
      { code: 'C111', title: 'ILO C111 Discrimination', body: 'Elimination of discrimination in employment and occupation.' },
      { code: 'C138', title: 'ILO C138 Minimum Age', body: 'Minimum age for admission to employment, aligned to the end of compulsory schooling.' },
      { code: 'C182', title: 'ILO C182 Worst Forms of Child Labour', body: 'Immediate and comprehensive action to eliminate the worst forms of child labour.' },
    ],
    extraEntries: [
      { domain: 'policy', title: 'ILO Declaration on Fundamental Principles', content: 'The eight fundamental conventions cover child labour, forced labour, discrimination, and freedom of association, forming the core of international labour standards.', metadata: { type: 'declaration' } },
    ],
  },
  {
    code: 'LOCAL_LABOUR',
    clauses: [
      { code: '1', title: 'National Minimum Wage', body: 'Compliance with applicable national or regional minimum wage legislation and timely payment of wages.' },
      { code: '2', title: 'Working Time Regulations', body: 'Adhere to national limits on daily and weekly working hours, rest periods, and overtime premiums.' },
      { code: '3', title: 'Statutory Benefits', body: 'Provide legally mandated benefits: social security, paid leave, maternity protection, and severance where applicable.' },
      { code: '4', title: 'Occupational Safety Law', body: 'Comply with national occupational safety and health statutes, inspections, and reporting obligations.' },
    ],
    extraEntries: [
      { domain: 'policy', title: 'Local Labour Law Alignment', content: 'Suppliers must meet the stricter of local labour law or the applicable international standard (SA8000/ILO). Conflicts should be escalated for legal review.', metadata: { note: 'conflict-resolution' } },
    ],
  },
];

function findSeed(code: string): StandardSeed | undefined {
  return SEED.find((s) => s.code === code);
}

export async function seedKnowledgeBase(): Promise<void> {
  console.log('[seed] compliance knowledge base');
  for (const meta of SUPPORTED_STANDARDS) {
    const standard = await knowledgeRepo.upsertStandard({ ...meta, isBuiltin: true });
    const seed = findSeed(meta.code);
    if (!seed) continue;
    // Skip re-inserting clauses/entries if already seeded.
    const existingClauses = await knowledgeRepo.listClauses(standard.id);
    if (existingClauses.length) continue;

    const insertClauses = async (clauses: ClauseSeed[], parentId: string | null): Promise<void> => {
      for (const c of clauses) {
        const created = await knowledgeRepo.insertClause({
          standardId: standard.id,
          parentId,
          code: c.code,
          title: c.title,
          body: c.body,
          category: c.category ?? null,
        });
        await knowledgeRepo.insertEntry({
          standardId: standard.id,
          clauseId: created.id,
          domain: 'policy',
          title: `${meta.code} ${c.code ?? ''} ${c.title}`.trim(),
          content: c.body,
          metadata: { standard: meta.code, clause: c.code, category: c.category ?? null },
        });
        if (c.children?.length) await insertClauses(c.children, created.id);
      }
    };
    await insertClauses(seed.clauses, null);

    for (const e of seed.extraEntries ?? []) {
      await knowledgeRepo.insertEntry({
        standardId: standard.id,
        domain: e.domain,
        title: e.title,
        content: e.content,
        metadata: { standard: meta.code, ...(e.metadata ?? {}) },
      });
    }
  }
  // Ensure the global null org entries exist for retrieval even when an org has none.
  const { rows } = await query<{ count: string }>(`SELECT COUNT(*) AS count FROM knowledge_entries`);
  console.log(`[seed] knowledge entries total: ${rows[0]?.count ?? 0}`);
}
