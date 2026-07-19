import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { AiCapabilityMap, AiProviderInfo } from './types.js';

export interface AiState {
  provider: AiProviderInfo | null;
  capabilities: AiCapabilityMap | null;
  loadedAt: number | null;
  setCapabilities: (provider: AiProviderInfo, capabilities: AiCapabilityMap) => void;
  reset: () => void;
}

const emptyCapabilities: AiCapabilityMap = {
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

export const useAiStore = create<AiState>()(
  persist(
    (set) => ({
      provider: null,
      capabilities: null,
      loadedAt: null,
      setCapabilities: (provider, capabilities) => set({ provider, capabilities, loadedAt: Date.now() }),
      reset: () => set({ provider: null, capabilities: emptyCapabilities, loadedAt: null }),
    }),
    { name: 'complianceos-ai-state' },
  ),
);
