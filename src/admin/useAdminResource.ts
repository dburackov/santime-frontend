import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { QueryKey } from '@tanstack/react-query';

interface UseAdminResourceConfig<T, TReq, TId> {
  queryKey: QueryKey;
  list: () => Promise<T[]>;
  create: (body: TReq) => Promise<T>;
  update: (id: TId, body: TReq) => Promise<T>;
  remove: (id: TId) => Promise<void>;
  enabled?: boolean;
}

/** Общий каркас "список + создать/обновить/удалить" для CRUD-страниц админки. */
export function useAdminResource<T, TReq, TId = number>(config: UseAdminResourceConfig<T, TReq, TId>) {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: config.queryKey, queryFn: config.list, enabled: config.enabled });

  function invalidate() {
    return queryClient.invalidateQueries({ queryKey: config.queryKey });
  }

  const createMutation = useMutation({
    mutationFn: config.create,
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: (vars: { id: TId; body: TReq }) => config.update(vars.id, vars.body),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: config.remove,
    onSuccess: invalidate,
  });

  return {
    items: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    createMutation,
    updateMutation,
    deleteMutation,
  };
}
