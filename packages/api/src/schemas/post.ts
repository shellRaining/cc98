import { z } from "zod";

export const postContentTypeSchema = z.union([z.literal(0), z.literal(1)]);
export type PostContentType = z.infer<typeof postContentTypeSchema>;

export const POST_CONTENT_TYPE = {
  ubb: 0 as const,
  markdown: 1 as const,
} satisfies Record<string, PostContentType>;

export const postSchema = z
  .looseObject({
    id: z.number().optional(),
    topicId: z.number().optional(),
    boardId: z.number().optional(),
    title: z.string().nullable().optional(),
    content: z.string().optional(),
    contentType: postContentTypeSchema.optional(),
    floor: z.number().optional(),
    count: z.number().optional(),
    userId: z.number().nullable().optional(),
    userName: z.string().nullable().optional(),
    ip: z.string().optional(),
    isAllowedOnly: z.boolean().optional(),
    isAnonymous: z.boolean().optional(),
    isBest: z.boolean().optional(),
    isDeleted: z.boolean().optional(),
    isLZ: z.boolean().optional(),
    likeCount: z.number().optional(),
    dislikeCount: z.number().optional(),
    likeState: z.union([z.literal(0), z.literal(1), z.literal(2)]).optional(),
    length: z.number().optional(),
    parentId: z.number().nullable().optional(),
    state: z.number().optional(),
    time: z.string().optional(),
    awards: z.array(z.looseObject({})).optional(),
    allowedViewers: z.array(z.number()).nullable().optional(),
    lastUpdateTime: z.string().nullable().optional(),
    lastUpdateAuthor: z.string().nullable().optional(),
    isMe: z.boolean().optional(),
  })
  .meta({ id: "Post" });
export type Post = z.infer<typeof postSchema>;

export const pagedPostResultSchema = z
  .looseObject({
    data: z.array(postSchema),
    count: z.number(),
    from: z.number(),
    size: z.number(),
    extra: z.unknown().nullable().optional(),
    errorCode: z.number(),
  })
  .meta({ id: "PagedPostResult" });
export type PagedPostResult = z.infer<typeof pagedPostResultSchema>;

export const likeSchema = z
  .object({
    dislikeCount: z.number().optional(),
    likeCount: z.number().optional(),
    likeState: z.union([z.literal(0), z.literal(1), z.literal(2)]).optional(),
  })
  .meta({ id: "Like" });
export type Like = z.infer<typeof likeSchema>;

export const editPostRequestSchema = z
  .object({
    content: z.string(),
    contentType: postContentTypeSchema,
    title: z.string(),
    tag1: z.number().optional(),
    tag2: z.number().optional(),
    type: z.number().optional(),
    notifyPoster: z.boolean().optional(),
  })
  .meta({ id: "EditPostRequest" });
export type EditPostRequest = z.infer<typeof editPostRequestSchema>;

export const postOperationRequestSchema = z
  .object({
    operationType: z.number().optional(),
    reason: z.string().optional(),
    wealth: z.number().optional(),
    prestige: z.number().optional(),
    stopPostDays: z.number().optional(),
  })
  .meta({ id: "PostOperationRequest" });
export type PostOperationRequest = z.infer<typeof postOperationRequestSchema>;

export const ratingReasonSchema = z
  .looseObject({
    id: z.number(),
    reason: z.string(),
    type: z.union([z.literal(1), z.literal(2)]),
    enabled: z.boolean(),
  })
  .meta({ id: "RatingReason" });
export type RatingReason = z.infer<typeof ratingReasonSchema>;
