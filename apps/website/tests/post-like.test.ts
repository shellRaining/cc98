import { QueryClient } from "@tanstack/vue-query";
import type { Post } from "@cc98/api";
import { beforeEach, describe, expect, test, vi } from "vite-plus/test";
import { createLikePostMutationOptions } from "../src/api/mutations/post.ts";
import { queryKeys } from "../src/api/queries/index.ts";
import { typedGet, typedPut } from "../src/lib/http.ts";

vi.mock("../src/lib/http.ts", () => ({
  typedGet: vi.fn(),
  typedPost: vi.fn(),
  typedPut: vi.fn(),
}));

describe("热帖点赞请求", () => {
  beforeEach(() => {
    vi.mocked(typedGet).mockReset();
    vi.mocked(typedPut).mockReset();
  });

  test("乐观更新后使用独立点赞接口校正，不重新拉取热帖列表", async () => {
    const queryClient = new QueryClient();
    const topicId = 6575734;
    const postId = 124447422;
    const post = {
      id: postId,
      topicId,
      likeCount: 10,
      dislikeCount: 2,
      likeState: 0,
    } as Post;
    const regularKey = queryKeys.topicPosts(topicId, 0, 10, 1);
    const hotKey = queryKeys.topicHotPosts(topicId, 1);
    queryClient.setQueryData(regularKey, [post]);
    queryClient.setQueryData(hotKey, [post]);
    vi.mocked(typedPut).mockResolvedValue(undefined);
    vi.mocked(typedGet).mockResolvedValue({
      likeCount: 11,
      dislikeCount: 2,
      likeState: 1,
    });

    const options = createLikePostMutationOptions(queryClient);
    const variables = { postId, topicId, action: "1" as const };
    await options.onMutate(variables);

    expect(queryClient.getQueryData<Post[]>(hotKey)?.[0]).toMatchObject({
      likeCount: 11,
      likeState: 1,
    });

    await options.mutationFn(variables);
    await options.onSuccess(undefined, variables);

    expect(typedPut).toHaveBeenCalledWith(`/post/${postId}/like`, "1");
    expect(typedGet).toHaveBeenCalledWith(`/post/${postId}/like`);
    expect(queryClient.getQueryData<Post[]>(regularKey)?.[0]).toMatchObject({
      likeCount: 11,
      likeState: 1,
    });
    expect(queryClient.getQueryData<Post[]>(hotKey)?.[0]).toMatchObject({
      likeCount: 11,
      likeState: 1,
    });
    expect("onSettled" in options).toBe(false);
  });
});
