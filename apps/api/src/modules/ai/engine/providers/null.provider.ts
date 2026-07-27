/**
 * Null chat provider — used when AI is disabled or no provider is configured.
 *
 * Every method throws `AiDisabledError` so callers can surface a clear message
 * instead of hitting the network. This keeps the orchestrator's control flow
 * uniform across provider kinds.
 */
import type {
  AiProviderKind,
  ChatMessage,
  ChatProvider,
  CompletionOptions,
  CompletionResult,
  StreamHandler,
} from '../types.js';

export class AiDisabledError extends Error {
  constructor(message = 'AI provider is not configured. Enable a provider in AI settings.') {
    super(message);
    this.name = 'AiDisabledError';
  }
}

export class NullChatProvider implements ChatProvider {
  readonly kind: AiProviderKind = 'null';
  readonly displayName = 'Disabled';

  isConfigured(): boolean {
    return false;
  }

  async complete(_m: ChatMessage[], _o: CompletionOptions): Promise<CompletionResult> {
    throw new AiDisabledError();
  }

  async stream(_m: ChatMessage[], _o: CompletionOptions, _h: StreamHandler): Promise<CompletionResult> {
    throw new AiDisabledError();
  }
}
