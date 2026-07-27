'use client';

import { create } from 'zustand';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { workerPlatformService } from './service.js';

interface WorkerPlatformUiState {
  searchDirectory: string;
  filterCategory: string;
  filterTaskStatus: string;
  filterDocCategory: string;
  filterFormStatus: string;
  filterTaskType: string;
  setSearchDirectory: (v: string) => void;
  setFilterCategory: (v: string) => void;
  setFilterTaskStatus: (v: string) => void;
  setFilterDocCategory: (v: string) => void;
  setFilterFormStatus: (v: string) => void;
  setFilterTaskType: (v: string) => void;
  reset: () => void;
}

export const useWorkerPlatformUiStore = create<WorkerPlatformUiState>((set) => ({
  searchDirectory: '',
  filterCategory: '',
  filterTaskStatus: '',
  filterDocCategory: '',
  filterFormStatus: '',
  filterTaskType: '',
  setSearchDirectory: (v) => set({ searchDirectory: v }),
  setFilterCategory: (v) => set({ filterCategory: v }),
  setFilterTaskStatus: (v) => set({ filterTaskStatus: v }),
  setFilterDocCategory: (v) => set({ filterDocCategory: v }),
  setFilterFormStatus: (v) => set({ filterFormStatus: v }),
  setFilterTaskType: (v) => set({ filterTaskType: v }),
  reset: () => set({ searchDirectory: '', filterCategory: '', filterTaskStatus: '', filterDocCategory: '', filterFormStatus: '', filterTaskType: '' }),
}));

export function useWorkerProfile() {
  return useQuery({ queryKey: ['worker-profile'], queryFn: () => workerPlatformService.getProfile() });
}

export function useWorkerDirectory(params?: Record<string, string | undefined>) {
  return useQuery({ queryKey: ['worker-directory', params], queryFn: () => workerPlatformService.searchDirectory(params) });
}

export function useAnnouncements(params?: Record<string, string | undefined>) {
  return useQuery({ queryKey: ['worker-announcements', params], queryFn: () => workerPlatformService.listAnnouncements(params) });
}

export function useAnnouncement(id: string) {
  return useQuery({ queryKey: ['worker-announcement', id], queryFn: () => workerPlatformService.getAnnouncement(id), enabled: !!id });
}

export function useTasks() {
  return useQuery({ queryKey: ['worker-tasks'], queryFn: () => workerPlatformService.listTasks() });
}

export function useDocuments() {
  return useQuery({ queryKey: ['worker-documents'], queryFn: () => workerPlatformService.listDocuments() });
}

export function useForms() {
  return useQuery({ queryKey: ['worker-forms'], queryFn: () => workerPlatformService.listForms() });
}

export function useLearning() {
  return useQuery({ queryKey: ['worker-learning'], queryFn: () => workerPlatformService.listLearning() });
}

export function useCreateProfile() {
  const qc = useQueryClient();
  return {
    mutateAsync: (data: Record<string, unknown>) => workerPlatformService.updateProfile(data),
    invalidate: () => qc.invalidateQueries({ queryKey: ['worker-profile'] }),
  };
}

export function useSubmitForm() {
  const qc = useQueryClient();
  return {
    mutateAsync: (data: Record<string, unknown>) => workerPlatformService.submitForm(data),
    invalidate: () => qc.invalidateQueries({ queryKey: ['worker-forms'] }),
  };
}

export function useCompleteTask() {
  const qc = useQueryClient();
  return {
    mutateAsync: (id: string) => workerPlatformService.completeTask(id),
    invalidate: () => qc.invalidateQueries({ queryKey: ['worker-tasks'] }),
  };
}
