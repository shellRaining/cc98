import { topicEventPageSchema, topicIpGroupSchema } from "@cc98/api";
import { queryOptions } from "@tanstack/vue-query";
import { typedGet } from "../../lib/http";
import { queryKeys, type AuthScope } from "./keys.ts";

export const topicEventsQuery = (
  topicId: number,
  from: number,
  size: number,
  authScope: AuthScope,
  enabled = true,
) =>
  queryOptions({
    queryKey: queryKeys.topicEvents(topicId, from, size, authScope),
    queryFn: async () => {
      const data = await typedGet<unknown>(`/topic/${topicId}/event`, { query: { from, size } });
      const result = topicEventPageSchema.parse(data);
      if (result.errorCode !== 0) throw new Error(`管理记录请求失败（${result.errorCode}）`);
      return result;
    },
    enabled: enabled && topicId > 0,
  });

export const topicIpGroupsQuery = (topicId: number, authScope: AuthScope, enabled = true) =>
  queryOptions({
    queryKey: queryKeys.topicIpGroups(topicId, authScope),
    queryFn: async () => {
      const data = await typedGet<unknown>(`/topic/${topicId}/look-ip`);
      return topicIpGroupSchema.array().parse(data);
    },
    enabled: enabled && topicId > 0,
  });
