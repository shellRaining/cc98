import { QueryClient, VueQueryPlugin, type VueQueryPluginOptions } from "@tanstack/vue-query";
import type { App } from "vue";

export function createQueryClient(): QueryClient {
  return new QueryClient({
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

export function installQueryClient(app: App, client?: QueryClient): void {
  const options: VueQueryPluginOptions = client ? { queryClient: client } : {};
  app.use(VueQueryPlugin, options);
}
