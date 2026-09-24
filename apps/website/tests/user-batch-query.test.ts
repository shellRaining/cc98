import { expect, test, vi } from "vite-plus/test";
import { QueryClient } from "@tanstack/vue-query";
import { usersByIdsQuery } from "../src/api/queries/user.ts";
import { typedGet } from "../src/lib/http.ts";

vi.mock("../src/lib/http.ts", () => ({ typedGet: vi.fn() }));

test("大量作者分批查询并合并头像信息", async () => {
  const ids = Array.from({ length: 65 }, (_, index) => index + 1);
  const client = new QueryClient();
  vi.mocked(typedGet).mockImplementation(async (_url, options) =>
    ((options?.query?.id ?? []) as number[]).map((id) => ({
      id,
      name: `用户${id}`,
      portraitUrl: `/${id}`,
    })),
  );

  const query = usersByIdsQuery([...ids, ids[0]]);
  const users = await client.fetchQuery(query);

  expect((users as Array<{ id: number }>).map((user) => user.id)).toEqual(ids);
  expect(vi.mocked(typedGet).mock.calls.map(([, options]) => options?.query?.id)).toEqual([
    ids.slice(0, 30),
    ids.slice(30, 60),
    ids.slice(60),
  ]);

  vi.mocked(typedGet).mockClear();
  const extended = await client.fetchQuery(usersByIdsQuery([...ids, 66, 67]));
  expect(extended).toHaveLength(67);
  expect(vi.mocked(typedGet).mock.calls.map(([, options]) => options?.query?.id)).toEqual([
    [66, 67],
  ]);
});
