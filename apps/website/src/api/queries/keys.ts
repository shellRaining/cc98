import type { HotPeriod } from "../../lib/discovery";

export type AuthScope = number | "anonymous";

export const queryKeys = {
  boards: ["boards"] as const,
  board: (id: number, authScope: AuthScope) => ["board", id, authScope] as const,
  boardTopics: (boardId: number, from: number, size: number, authScope: AuthScope) =>
    ["board", boardId, "topics", from, size, authScope] as const,
  boardTopicsRoot: (boardId: number) => ["board", boardId, "topics"] as const,
  boardTopTopics: (boardId: number, authScope: AuthScope) =>
    ["board", boardId, "top-topics", authScope] as const,
  boardTags: (boardId: number) => ["board", boardId, "tags"] as const,
  topic: (id: number, authScope: AuthScope) => ["topic", id, authScope] as const,
  topicPosts: (topicId: number, from: number, size: number, authScope: AuthScope) =>
    ["topic", topicId, "posts", from, size, authScope] as const,
  topicPostsRoot: (topicId: number) => ["topic", topicId, "posts"] as const,
  topicFavorite: (topicId: number, authScope: AuthScope) =>
    ["topic", topicId, "favorite", authScope] as const,
  topicFavoriteRoot: (topicId: number) => ["topic", topicId, "favorite"] as const,
  topicVote: (topicId: number, authScope: AuthScope) =>
    ["topic", topicId, "vote", authScope] as const,
  ratingReasons: (type: 1 | 2) => ["post", "rating-reasons", type] as const,
  postOriginal: (postId: number, authScope: AuthScope) =>
    ["post", postId, "original", authScope] as const,
  hotTopics: (period: HotPeriod) => ["topic", "hot", period] as const,
  newTopics: (size: number, authScope: AuthScope) => ["topic", "new", size, authScope] as const,
  recommendedTopics: (size: number, refreshToken: number, authScope: AuthScope) =>
    ["topic", "recommended", size, refreshToken, authScope] as const,
  searchTopics: (
    keyword: string,
    boardId: number | null,
    from: number,
    size: number,
    authScope: AuthScope,
  ) => ["topic", "search", keyword, boardId, from, size, authScope] as const,
  searchBoards: (keyword: string) => ["board", "search", keyword] as const,
  userById: (id: number, authScope: AuthScope) => ["user", "id", id, authScope] as const,
  userByName: (name: string, authScope: AuthScope) => ["user", "name", name, authScope] as const,
  userRecentTopics: (id: number, size: number, authScope: AuthScope) =>
    ["user", id, "recent-topics", size, authScope] as const,
  usersByIds: (ids: number[]) => ["users", "batch", ...ids] as const,
  boardsByIds: (ids: number[]) => ["boards", "batch", ...ids] as const,
  meRecentTopics: (from: number, size: number, authScope: AuthScope) =>
    ["me", "recent-topics", from, size, authScope] as const,
  meRecentTopicsRoot: ["me", "recent-topics"] as const,
  mePosts: (kind: "recent" | "hot", from: number, size: number, authScope: AuthScope) =>
    ["me", "posts", kind, from, size, authScope] as const,
  mePostsRoot: ["me", "posts"] as const,
  meFavorites: (
    groupId: number,
    order: number,
    keyword: string,
    from: number,
    size: number,
    authScope: AuthScope,
  ) => ["me", "favorites", groupId, order, keyword, from, size, authScope] as const,
  meFavoritesRoot: ["me", "favorites"] as const,
  meFavoriteGroups: (authScope: AuthScope) => ["me", "favorite-groups", authScope] as const,
  meFavoriteGroupsRoot: ["me", "favorite-groups"] as const,
  meBrowsingRecords: (from: number, size: number, authScope: AuthScope) =>
    ["me", "browsing-records", from, size, authScope] as const,
  meRelationIds: (
    kind: "following" | "followers",
    from: number,
    size: number,
    authScope: AuthScope,
  ) => ["me", "relations", kind, from, size, authScope] as const,
  meFollowingRoot: ["me", "relations", "following"] as const,
  usersByIdRoot: (id: number) => ["user", "id", id] as const,
  boardsByIdsRoot: ["boards", "batch"] as const,
  boardRoot: (id: number) => ["board", id] as const,
  globalConfig: ["global-config"] as const,
  currentUser: ["current-user"] as const,
};
