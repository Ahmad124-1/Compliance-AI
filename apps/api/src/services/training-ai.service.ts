import { query } from '../db/pool.js';

export const trainingAiService = {
  async getTrainingRecommendations(organizationId: string, userId: string): Promise<Array<{ id: string; title: string; type: string; progress: number; dueDate?: string }>> {
    const { rows } = await query(
      'SELECT id, course_title as title, learning_type as type, progress, due_date as "dueDate" FROM worker_learning WHERE organization_id = $1 AND user_id = $2 AND status != \'completed\'',
      [organizationId, userId],
    );
    return rows.map((r: any) => ({ id: r.id, title: r.title, type: r.type, progress: r.progress, dueDate: r.dueDate }));
  },

  async generatePracticeQuestions(_topic: string, _count = 5, _difficulty = 'medium'): Promise<Array<{ question: string; options: string[]; answer: string }>> {
    return Array.from({ length: _count }).map((_, i) => ({
      question: `${_topic} practice question ${i + 1}`,
      options: ['A', 'B', 'C', 'D'],
      answer: 'A',
    }));
  },

  async explainConcept(_concept: string, _language: string): Promise<{ explanation: string; examples: string[] }> {
    return {
      explanation: `${_concept} is an important topic. Below is a detailed explanation tailored for workers.`,
      examples: ['Example 1', 'Example 2', 'Example 3'],
    };
  },

  async getProgress(organizationId: string, userId: string): Promise<{ completed: number; total: number; overallProgress: number }> {
    const { rows } = await query(
      'SELECT COUNT(*) as total, SUM(CASE WHEN status = \'completed\' THEN 1 ELSE 0 END) as completed FROM worker_learning WHERE organization_id = $1 AND user_id = $2',
      [organizationId, userId],
    );
    const total = parseInt(rows[0]?.total || '0', 10);
    const completed = parseInt(rows[0]?.completed || '0', 10);
    return { completed, total, overallProgress: total > 0 ? Math.round((completed / total) * 100) : 0 };
  },
};
