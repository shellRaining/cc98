import { userModerationPostPageSchema } from "@cc98/api";
import { queryOptions } from "@tanstack/vue-query";
import { typedGet } from "../../lib/http";
import { queryKeys, type AuthScope } from "./keys";

export const userModerationPostsQuery = (
  userId: number,
  days: number,
  from: number,
  size: number,
  authScope: AuthScope,
  enabled = true,
) =>
  queryOptions({
    queryKey: queryKeys.userModerationPosts(userId, days, from, size, authScope),
    queryFn: async () => {
      const data = await typedGet<unknown>(`/user/${userId}/post`, {
        query: { days, from, size },
      });
      return userModerationPostPageSchema.parse(data);
    },
    enabled: enabled && userId > 0 && days > 0,
  });
