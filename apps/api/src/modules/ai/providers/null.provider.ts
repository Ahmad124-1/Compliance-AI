/**
 * Null / no-op AI provider.
 *
 * Used as the default when no AI provider is configured. All capabilities
 * are reported as unsupported so the orchestrator returns gracefully without
 * performing any model inference.
 */

import type { AiProvider } from '../interfaces.js';
import type { AiCapabilityMap } from '../types.js';
import type { AiProviderKind } from '../types.js';

export class NullAiProvider implements AiProvider {
  readonly kind: AiProviderKind = 'null';
  readonly displayName = 'Disabled';

  capabilities(): AiCapabilityMap {
    return {
      categorize: false,
      detectPriority: false,
      detectSeverity: false,
      analyzeSentiment: false,
      scoreRisk: false,
      detectLanguage: false,
      translate: false,
      summarize: false,
      detectDuplicates: false,
      mapFrameworks: false,
      recommend: false,
    };
  }
}
