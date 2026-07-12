import { signinInfoSchema, signinRecordSchema } from "@cc98/api";
import { queryOptions } from "@tanstack/vue-query";
import { typedGet } from "../../lib/http";
import { queryKeys, type AuthScope } from "./keys.ts";

export const signinInfoQuery = (authScope: AuthScope, enabled = true) =>
  queryOptions({
    queryKey: queryKeys.signinInfo(authScope),
    queryFn: async () => signinInfoSchema.parse(await typedGet<unknown>("/me/signin")),
    enabled: enabled && authScope !== "anonymous",
  });

export const signinMonthQuery = (
  year: number,
  month: number,
  authScope: AuthScope,
  enabled = true,
) =>
  queryOptions({
    queryKey: queryKeys.signinMonth(year, month, authScope),
    queryFn: async () =>
      signinRecordSchema
        .array()
        .parse(await typedGet<unknown[]>("/me/signin-in-month", { query: { year, month } })),
    enabled: enabled && authScope !== "anonymous" && month >= 1 && month <= 12,
  });

export const serverNowQuery = queryOptions({
  queryKey: queryKeys.serverNow,
  queryFn: async () => {
    const data = await typedGet<{ data?: string }>("/config/now");
    return data.data ?? new Date().toISOString();
  },
  staleTime: 60 * 1000,
});
