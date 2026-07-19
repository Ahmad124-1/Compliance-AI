/**
 * AI dependency injection container.
 *
 * Centralizes construction and lifetime of the AI provider and configuration so
 * route handlers and services depend on the container rather than constructing
 * adapters directly. This keeps the architecture testable and provider-swappable.
 */

import { aiConfig } from './config.js';
import { createAiProvider, defaultAiProvider } from './factory.js';
import type { AiProvider } from './interfaces.js';
import type { AiProviderKind } from './types.js';

export interface AiContainer {
  config: typeof aiConfig;
  getProvider(): AiProvider;
  setProvider(next: AiProvider): void;
  /** Build a fresh provider of the given kind (enabled, for inspection/testing). */
  resolve(kind: AiProviderKind): AiProvider;
}

function buildContainer(): AiContainer {
  let current: AiProvider = defaultAiProvider;

  return {
    config: aiConfig,
    getProvider() {
      return current;
    },
    setProvider(next: AiProvider) {
      current = next;
    },
    resolve(kind: AiProviderKind) {
      return createAiProvider({ provider: kind, enabled: true });
    },
  };
}

export const aiContainer: AiContainer = buildContainer();
