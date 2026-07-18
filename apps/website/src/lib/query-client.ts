import { MutationCache, QueryCache, QueryClient } from "@tanstack/vue-query";
import { createLogger, logErrorOnce } from "./logger";

const queryLogger = createLogger("query");

export function createQueryClient(): QueryClient {
  return new QueryClient({
    queryCache: new QueryCache({
      onError(error, query) {
        logErrorOnce(queryLogger, error, "查询失败", {
          queryKey: query.queryKey,
          failureCount: query.state.fetchFailureCount,
        });
      },
    }),
    mutationCache: new MutationCache({
      onError(error, _variables, _onMutateResult, mutation) {
        logErrorOnce(queryLogger, error, "写操作失败", {
          mutationKey: mutation.options.mutationKey ?? null,
          failureCount: mutation.state.failureCount,
        });
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        gcTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
        retry: 1,
      },
      mutations: {
        retry: 0,
      },
    },
  });
}
