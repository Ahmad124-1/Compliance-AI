import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { AiConfig } from './types.js';

export interface AiProviderState {
  kind: string;
  label: string;
  chatConfigured: boolean;
  embeddingConfigured: boolean;
}

export interface AiState {
  config: AiConfig | null;
  providers: AiProviderState[];
  loadedAt: number | null;
  setConfig: (config: AiConfig) => void;
  setProviders: (providers: AiProviderState[]) => void;
  reset: () => void;
}

export const useAiStore = create<AiState>()(
  persist(
    (set) => ({
      config: null,
      providers: [],
      loadedAt: null,
      setConfig: (config) => set({ config, loadedAt: Date.now() }),
      setProviders: (providers) => set({ providers }),
      reset: () => set({ config: null, providers: [], loadedAt: null }),
    }),
    { name: 'complianceos-ai-state' },
  ),
);
