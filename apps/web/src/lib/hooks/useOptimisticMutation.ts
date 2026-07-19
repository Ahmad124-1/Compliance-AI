'use client';

import { useQueryClient } from '@tanstack/react-query';

/**
 * Performs an optimistic update against a cached react-query list, rolling
 * back automatically on error. `idSelector` identifies the affected item.
 */
export function useOptimisticMutation<TVariables, TData, TItem>(options: {
  queryKey: unknown[];
  mutationFn: (variables: TVariables) => Promise<TData>;
  idSelector: (vars: TVariables) => string;
  update: (item: TItem, vars: TVariables) => TItem;
  onSuccessInvalidate?: unknown[];
}) {
  const qc = useQueryClient();
  return {
    mutate: async (variables: TVariables) => {
      const key = options.queryKey;
      const id = options.idSelector(variables);
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<{ hits?: TItem[]; notifications?: TItem[]; logs?: TItem[] }>(key);

      const patchList = (list?: TItem[], getId?: (i: TItem) => string) => {
        if (!list || !getId) return list;
        return list.map((item) => (getId(item) === id ? options.update(item, variables) : item));
      };
      const prevAny = previous as any;
      if (prevAny) {
        qc.setQueryData(key, {
          ...prevAny,
          hits: patchList(prevAny.hits, (i: any) => i.id),
          notifications: patchList(prevAny.notifications, (i: any) => i.id),
          logs: patchList(prevAny.logs, (i: any) => i.id),
        });
      }

      try {
        const result = await options.mutationFn(variables);
        if (options.onSuccessInvalidate) qc.invalidateQueries({ queryKey: options.onSuccessInvalidate });
        return result;
      } catch (err) {
        if (previous !== undefined) qc.setQueryData(key, previous);
        throw err;
      }
    },
  };
}
