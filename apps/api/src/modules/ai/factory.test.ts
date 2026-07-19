import { describe, expect, it } from 'vitest';

import { createAiProvider, defaultAiProvider, providerCapabilities } from './factory.js';
import { aiContainer } from './container.js';
import { NullAiProvider } from './providers/null.provider.js';
import { aiService } from './service.js';

describe('ai factory', () => {
  it('returns a null provider when AI is not enabled', () => {
    const provider = createAiProvider({ provider: 'openai', enabled: false });
    expect(provider.kind).toBe('null');
    expect(provider).toBeInstanceOf(NullAiProvider);
  });

  it('builds a configured future adapter when enabled', () => {
    const provider = createAiProvider({ provider: 'openai', enabled: true });
    expect(provider.kind).toBe('openai');
    expect(provider.capabilities().categorize).toBe(false);
  });

  it('singleton default provider is usable', () => {
    expect(defaultAiProvider).toBeDefined();
    expect(typeof defaultAiProvider.capabilities).toBe('function');
  });
});

describe('ai container (DI)', () => {
  it('resolves providers by kind', () => {
    const p = aiContainer.resolve('gemini');
    expect(p.kind).toBe('gemini');
  });

  it('allows swapping the active provider', () => {
    const before = aiContainer.getProvider();
    const replacement = new NullAiProvider();
    aiContainer.setProvider(replacement);
    expect(aiContainer.getProvider()).toBe(replacement);
    aiContainer.setProvider(before);
  });
});

describe('ai service', () => {
  it('reports capabilities without throwing', () => {
    const caps = providerCapabilities();
    expect(caps).toHaveProperty('categorize');
  });

  it('analyze returns an insight with the active provider kind', async () => {
    const insight = await aiService.analyze({ text: 'I was not paid for overtime.' });
    expect(insight).toHaveProperty('provider');
    expect(insight.provider).toBe(defaultAiProvider.kind);
  });
});
