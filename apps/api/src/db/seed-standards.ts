import { pool } from './pool.js';
import { frameworkImport } from '../modules/standards/import/framework.import.js';

/**
 * Seed the built-in sustainability standards library + a couple of full frameworks.
 * Idempotent (import is keyed by standard code + framework version).
 */
export async function seedStandards(): Promise<void> {
  const standards = [
    { name: 'ISO 9001', code: 'ISO9001', publisher: 'ISO', category: 'quality', description: 'Quality Management Systems' },
    { name: 'ISO 14001', code: 'ISO14001', publisher: 'ISO', category: 'environment', description: 'Environmental Management Systems' },
    { name: 'ISO 45001', code: 'ISO45001', publisher: 'ISO', category: 'social', description: 'Occupational Health & Safety' },
    { name: 'ISO 50001', code: 'ISO50001', publisher: 'ISO', category: 'energy', description: 'Energy Management Systems' },
    { name: 'SA8000', code: 'SA8000', publisher: 'SAI', category: 'social', description: 'Social Accountability' },
    { name: 'SMETA', code: 'SMETA', publisher: 'Sedex', category: 'social', description: 'Sedex Members Ethical Trade Audit' },
    { name: 'BSCI', code: 'BSCI', publisher: 'amfori', category: 'social', description: 'Business Social Compliance Initiative' },
    { name: 'GRI', code: 'GRI', publisher: 'GRI', category: 'esg', description: 'Global Reporting Initiative' },
    { name: 'SBTi', code: 'SBTi', publisher: 'SBTi', category: 'environment', description: 'Science Based Targets initiative' },
    { name: 'UN Global Compact', code: 'UNGC', publisher: 'UN', category: 'esg', description: 'UN Global Compact' },
    { name: 'CDP', code: 'CDP', publisher: 'CDP', category: 'esg', description: 'Carbon Disclosure Project' },
    { name: 'ESG', code: 'ESG', publisher: 'Custom', category: 'esg', description: 'Environmental, Social & Governance' },
    { name: 'Custom Standard', code: 'CUSTOM', publisher: 'Custom', category: 'custom', description: 'Organization-defined standard' },
  ];

  for (const s of standards) {
    await frameworkImport({
      standard: s,
      framework: { version: 'default', title: `${s.name} (default)`, status: 'published' },
      categories: [
        { code: 'A', name: 'General' },
        { code: 'B', name: 'Implementation' },
      ],
      clauses: [
        {
          code: '4',
          title: 'Context of the Organization',
          requirements: [
            { code: '4.1', title: 'Understanding the organization and its context', controls: [{ title: 'Context analysis', controlType: 'preventive' }] },
            { code: '4.2', title: 'Understanding the needs and expectations of interested parties', controls: [{ title: 'Stakeholder register', controlType: 'preventive' }] },
          ],
        },
        {
          code: '5',
          title: 'Leadership',
          requirements: [
            { code: '5.1', title: 'Leadership and commitment', controls: [{ title: 'Leadership commitment evidence', controlType: 'preventive' }] },
          ],
        },
        {
          code: '6',
          title: 'Planning',
          requirements: [
            { code: '6.1', title: 'Actions to address risks and opportunities', controls: [{ title: 'Risk assessment', controlType: 'preventive' }] },
            { code: '6.2', title: 'Objectives and planning to achieve them', controls: [{ title: 'Objective setting', controlType: 'preventive' }] },
          ],
        },
        {
          code: '9',
          title: 'Performance Evaluation',
          requirements: [
            { code: '9.1', title: 'Monitoring, measurement and evaluation', controls: [{ title: 'Performance metrics', controlType: 'detective' }] },
            { code: '9.2', title: 'Internal audit', controls: [{ title: 'Audit program', controlType: 'detective' }] },
          ],
        },
        {
          code: '10',
          title: 'Improvement',
          requirements: [
            { code: '10.1', title: 'Continual improvement', controls: [{ title: 'Improvement log', controlType: 'corrective' }] },
          ],
        },
      ],
    });
  }
  console.log('[seed] standards library seeded');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seedStandards()
    .then(() => pool.end())
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
