'use client';

import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';
import { autoPopulateApi, type AutoFillResult } from '../api.js';

const empty: AutoFillResult = {
  facilityId: null, facilityName: null, supplierIds: [], projectId: null, projectName: null,
  kpiId: null, kpiName: null, reportingPeriodId: null, reportingPeriodName: null, documentIds: [],
  programId: null, programName: null, goalId: null, goalName: null,
  departmentId: null, departmentName: null, siteId: null, siteName: null, userId: null, userName: null,
};

export function useAutoFill<TForm>(params: Record<string, string> = {}) {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['auto-populate', 'fill', params],
    queryFn: () => autoPopulateApi.fill(params),
    staleTime: 60_000,
  });

  const fill = data ?? empty;

  const useSetDefaults = (
    setValue: (name: any, value: any, options?: any) => void,
    fields: Array<{ name: string; fillKey: keyof AutoFillResult }>,
  ) => {
    useEffect(() => {
      if (!fill) return;
      for (const f of fields) {
        const v = fill[f.fillKey];
        if (v != null && v !== '') setValue(f.name as keyof TForm, v);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fill, isLoading]);
  };


  const autoFillState = useCallback(
    (
      setForm: (updater: (prev: any) => any) => void,
      mapping: Array<{
        stateKey: string;
        fillKey: keyof AutoFillResult;
        transform?: (value: unknown) => unknown;
      }>,
    ) => {
      if (isLoading) return;
      const patch: Record<string, unknown> = {};
      for (const m of mapping) {
        const v = fill[m.fillKey];
        if (v != null && v !== '') patch[m.stateKey] = m.transform ? m.transform(v) : v;
      }
      if (Object.keys(patch).length > 0) setForm((prev) => ({ ...prev, ...patch }));
    },
    [fill, isLoading],
  );

  return { fill, isLoading, refetch, useSetDefaults, autoFillState };
}