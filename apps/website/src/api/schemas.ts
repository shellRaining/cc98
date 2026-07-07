import { z } from "zod";

export const contentTypeSchema = z.union([z.literal(0), z.literal(1)]);
export type PostContentType = z.infer<typeof contentTypeSchema>;

export const POST_CONTENT_TYPE = {
  ubb: 0 as const,
  markdown: 1 as const,
} satisfies Record<string, 0 | 1>;

export const postSchema = z.object({
  id: z.number(),
  topicId: z.number(),
  boardId: z.number(),
  title: z.string(),
  content: z.string(),
  contentType: contentTypeSchema,
  floor: z.number(),
  userId: z.number().nullable(),
  userName: z.string().nullable(),
  ip: z.string().optional(),
  isAnonymous: z.boolean(),
  isLZ: z.boolean().optional(),
  isBest: z.boolean().optional(),
  isDeleted: z.boolean().optional(),
  likeCount: z.number().optional(),
  dislikeCount: z.number().optional(),
  likeState: z.union([z.literal(0), z.literal(1), z.literal(2)]).optional(),
  parentId: z.number().nullable().optional(),
  state: z.number(),
  time: z.string(),
});

export type Post = z.infer<typeof postSchema>;

export const topicSchema = z.object({
  id: z.number(),
  boardId: z.number(),
  title: z.string(),
  time: z.string(),
  userId: z.number().nullable(),
  userName: z.string().nullable(),
  isAnonymous: z.boolean(),
  disableHot: z.boolean().optional(),
  lastPostTime: z.string(),
  state: z.number(),
  type: z.number(),
  replyCount: z.number(),
  hitCount: z.number(),
  lastPostUser: z.string().optional(),
  lastPostContent: z.string().optional(),
  topState: z.number().optional(),
  bestState: z.number().optional(),
  isVote: z.boolean().optional(),
  likeCount: z.number().optional(),
  dislikeCount: z.number().optional(),
  favoriteCount: z.number().optional(),
});

export type Topic = z.infer<typeof topicSchema>;

export const boardSchema = z.object({
  id: z.number(),
  name: z.string(),
  boardMasters: z.array(z.string()).optional(),
  topicCount: z.number().optional(),
  postCount: z.number().optional(),
  todayCount: z.number().optional(),
  description: z.string().optional(),
  anonymousState: z.number().optional(),
  canVote: z.boolean().optional(),
});

export type Board = z.infer<typeof boardSchema>;

export const boardGroupSchema = z.object({
  id: z.number(),
  name: z.string(),
  order: z.number(),
  masters: z.array(z.string()),
  boards: z.array(boardSchema),
});

export type BoardGroup = z.infer<typeof boardGroupSchema>;

export const globalConfigSchema = z.object({
  maxOnlineCount: z.number(),
  maxOnlineDate: z.string(),
  topicCount: z.number(),
  postCount: z.number(),
  userCount: z.number(),
  lastUserName: z.string(),
  maxPostCount: z.number(),
  maxPostDate: z.string(),
  isMaintaining: z.boolean(),
  announcement: z.string(),
  signInEnabled: z.boolean(),
  signInRewards: z.unknown().optional(),
  signInTopicId: z.number().optional(),
  todayCount: z.number(),
});

export type GlobalConfig = z.infer<typeof globalConfigSchema>;
