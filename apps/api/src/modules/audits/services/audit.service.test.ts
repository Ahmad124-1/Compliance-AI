import { describe, expect, it } from 'vitest';

import { buildAuditSectionsFromTemplate } from './audit.service.js';

describe('buildAuditSectionsFromTemplate', () => {
  it('maps template sections and questions into audit sections and responses', () => {
    const result = buildAuditSectionsFromTemplate({
      template: {
        id: 'template-1',
        title: 'Factory Audit',
        type: 'factory',
      } as any,
      sections: [
        { id: 'sec-1', title: 'Site Overview', position: 1 },
        { id: 'sec-2', title: 'Worker Voice', position: 2 },
      ],
      questions: [
        { id: 'q-1', sectionId: 'sec-1', label: 'Factory name', answerTypeKey: 'short_text', position: 1 },
        { id: 'q-2', sectionId: 'sec-2', label: 'Any concerns?', answerTypeKey: 'long_text', position: 1 },
      ],
    });

    expect(result.sections).toHaveLength(2);
    expect(result.questionResponses).toHaveLength(2);
    expect(result.sections[0].title).toBe('Site Overview');
    expect(result.questionResponses[0].questionId).toBe('q-1');
  });
});
