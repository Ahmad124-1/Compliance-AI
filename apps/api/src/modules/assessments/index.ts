// Assessment Framework Engine — module entry.
export * from './types.js';
export { assessmentService } from './services/assessment.service.js';
export { evaluateCondition, isVisible, validateConditionTree } from './engine/conditional.logic.js';
export { computeQuestionScore, aggregateSection, aggregateOverall, scoreForOption } from './engine/scoring.js';
export { validateResponse, hasBlockingErrors } from './engine/validation.js';
export { templateRepo } from './repositories/template.repo.js';
export { assessmentRepo } from './repositories/assessment.repo.js';
export { answerTypeRepo, categoryRepo, tagRepo, assessmentTypeRepo } from './repositories/catalogue.repo.js';
