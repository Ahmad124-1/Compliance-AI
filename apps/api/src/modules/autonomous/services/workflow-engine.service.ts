import { audit } from '../../../core/audit.js';
import { automationService } from './automation.service.js';
import { actionQueueService } from './action-queue.service.js';
import type { QueuedAction } from '../types.js';

export const workflowEngineService = {
  async executeWorkflow(workflowId: string, organizationId: string, inputParams: Record<string, unknown>, executedBy?: string): Promise<QueuedAction[]> {
    const workflow = await automationService.getWorkflowDefinition(workflowId);
    if (!workflow) throw new Error('Workflow not found');

    const steps = workflow.steps as Array<{ type: string; config: Record<string, unknown> }>;
    const enqueuedActions: QueuedAction[] = [];

    for (const step of steps) {
      const action = await actionQueueService.enqueue({
        organizationId,
        ruleId: undefined,
        actionType: step.type as any,
        title: `Workflow step: ${step.type}`,
        description: `Executed from workflow ${workflow.name}`,
        reason: `Automated workflow execution`,
        confidenceScore: 80,
        dataUsed: { workflowId, step, inputParams },
        payload: { workflowId, step, inputParams },
        priority: 'high',
        createdBy: executedBy,
        metadata: { source: 'workflow_engine', workflowId, workflowName: workflow.name },
      });
      enqueuedActions.push(action);
    }

    await audit({ organizationId, actorId: executedBy ?? null, action: 'workflow.execute', entity: 'workflow_definition', entityId: workflowId, metadata: { stepsExecuted: steps.length } });
    return enqueuedActions;
  },

  async getWorkflowSteps(workflowId: string): Promise<Array<{ type: string; config: Record<string, unknown> }>> {
    const workflow = await automationService.getWorkflowDefinition(workflowId);
    if (!workflow) return [];
    return workflow.steps as Array<{ type: string; config: Record<string, unknown> }>;
  },

  async validateWorkflow(workflow: { steps: Array<{ type: string; config: Record<string, unknown> }> }): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];
    if (!workflow.steps || workflow.steps.length === 0) {
      errors.push('Workflow must have at least one step');
    }
    for (let i = 0; i < (workflow.steps ?? []).length; i++) {
      const step = workflow.steps[i];
      if (!step.type) errors.push(`Step ${i + 1}: missing type`);
      if (!step.config) errors.push(`Step ${i + 1}: missing config`);
    }
    return { valid: errors.length === 0, errors };
  },
};
