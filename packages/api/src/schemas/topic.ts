import { z } from "zod";
import { postContentTypeSchema } from "./post.ts";

export const topicContentTypeSchema = z.union([
  z.literal(0),
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
]);
export type TopicContentType = z.infer<typeof topicContentTypeSchema>;

export const mediaTopicContentSchema = z.looseObject({
  thumbnail: z.array(z.string()).optional(),
  video: z.string().optional(),
  audio: z.string().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
});
export type MediaTopicContent = z.infer<typeof mediaTopicContentSchema>;

export const topicSchema = z
  .looseObject({
    id: z.number().optional(),
    boardId: z.number().optional(),
    boardName: z.string().optional(),
    title: z.string().optional(),
    time: z.string().optional(),
    userId: z.number().nullable().optional(),
    userName: z.string().nullable().optional(),
    isAnonymous: z.boolean().optional(),
    disableHot: z.boolean().optional(),
    lastPostTime: z.string().optional(),
    state: z.number().optional(),
    type: z.number().optional(),
    replyCount: z.number().optional(),
    hitCount: z.number().optional(),
    totalVoteUserCount: z.number().optional(),
    lastPostUser: z.string().nullable().optional(),
    lastPostContent: z.string().nullable().optional(),
    topState: z.number().optional(),
    bestState: z.number().optional(),
    isVote: z.boolean().optional(),
    isPosterOnly: z.boolean().optional(),
    allowedViewerState: z.number().optional(),
    likeCount: z.number().optional(),
    dislikeCount: z.number().optional(),
    highlightInfo: z.looseObject({}).nullable().optional(),
    tag1: z.number().nullable().optional(),
    tag2: z.number().nullable().optional(),
    isInternalOnly: z.boolean().optional(),
    favoriteCount: z.number().optional(),
    canNotifyAllReplier: z.boolean().optional(),
    topicAuthorPermissions: z.array(z.string()).optional(),
    lastBrowsingTime: z.string().optional(),
    contentType: topicContentTypeSchema.optional(),
    mediaContent: mediaTopicContentSchema.nullable().optional(),
  })
  .meta({ id: "Topic" });
export type Topic = z.infer<typeof topicSchema>;

export const recommendedTopicSchema = z
  .looseObject({
    topic: topicSchema.optional(),
    content: z.string().nullable().optional(),
  })
  .meta({ id: "RecommendedTopic" });
export type RecommendedTopic = z.infer<typeof recommendedTopicSchema>;

export const topicPagedResultSchema = z
  .object({
    topics: z.array(topicSchema).optional(),
    count: z.number().optional(),
  })
  .meta({ id: "TopicPagedResult" });
export type TopicPagedResult = z.infer<typeof topicPagedResultSchema>;

export const pagedTopicResultDataSchema = z
  .looseObject({
    data: z.array(topicSchema),
    count: z.number(),
    from: z.number(),
    size: z.number(),
    extra: z.unknown().nullable().optional(),
    errorCode: z.number(),
  })
  .meta({ id: "PagedTopicResultData" });
export type PagedTopicResultData = z.infer<typeof pagedTopicResultDataSchema>;

export const createPostRequestSchema = z
  .object({
    content: z.string(),
    contentType: postContentTypeSchema,
    title: z.string(),
    parentId: z.number().optional(),
    isAnonymous: z.boolean(),
    notifyAllReplier: z.boolean().optional(),
    clientType: z.number(),
  })
  .meta({ id: "CreatePostRequest" });
export type CreatePostRequest = z.infer<typeof createPostRequestSchema>;

export const createVoteInfoSchema = z
  .object({
    voteItems: z.array(z.string()),
    expiredDays: z.number().int(),
    maxVoteCount: z.number().int(),
    needVote: z.boolean(),
  })
  .meta({ id: "CreateVoteInfo" });
export type CreateVoteInfo = z.infer<typeof createVoteInfoSchema>;

export const voteItemSchema = z
  .looseObject({
    id: z.number(),
    description: z.string(),
    count: z.number(),
  })
  .meta({ id: "VoteItem" });
export type VoteItem = z.infer<typeof voteItemSchema>;

export const voteRecordSchema = z
  .looseObject({
    userId: z.number(),
    userName: z.string(),
    items: z.array(z.number()),
    ip: z.string(),
    time: z.string(),
  })
  .meta({ id: "VoteRecord" });
export type VoteRecord = z.infer<typeof voteRecordSchema>;

export const voteInfoSchema = z
  .looseObject({
    topicId: z.number().optional(),
    voteItems: z.array(voteItemSchema).optional(),
    voteRecords: z.array(voteRecordSchema).optional(),
    expiredTime: z.string().optional(),
    isAvailable: z.boolean().optional(),
    maxVoteCount: z.number().optional(),
    canVote: z.boolean().optional(),
    myRecord: voteRecordSchema.nullable().optional(),
    needVote: z.boolean().optional(),
    voteUserCount: z.number().optional(),
  })
  .meta({ id: "VoteInfo" });
export type VoteInfo = z.infer<typeof voteInfoSchema>;

export const submitVoteRequestSchema = z
  .object({
    items: z.array(z.number().int().positive()),
  })
  .meta({ id: "SubmitVoteRequest" });
export type SubmitVoteRequest = z.infer<typeof submitVoteRequestSchema>;

export const reasonRequestSchema = z
  .object({
    reason: z.string().optional(),
  })
  .meta({ id: "ReasonRequest" });
export type ReasonRequest = z.infer<typeof reasonRequestSchema>;

export const topicTopRequestSchema = z
  .object({
    topState: z.number().optional(),
    duration: z.number().optional(),
    reason: z.string().optional(),
  })
  .meta({ id: "TopicTopRequest" });
export type TopicTopRequest = z.infer<typeof topicTopRequestSchema>;

export const topicHighlightRequestSchema = z
  .object({
    isBold: z.boolean().optional(),
    isItalic: z.boolean().optional(),
    color: z.string().optional(),
    duration: z.number().optional(),
    reason: z.string().optional(),
  })
  .meta({ id: "TopicHighlightRequest" });
export type TopicHighlightRequest = z.infer<typeof topicHighlightRequestSchema>;

export const topicIpGroupSchema = z
  .object({
    ip: z.string().optional(),
    posts: z
      .array(
        z.object({
          userName: z.string().optional(),
          floor: z.number().optional(),
          content: z.string().optional(),
        }),
      )
      .optional(),
  })
  .meta({ id: "TopicIpGroup" });
export type TopicIpGroup = z.infer<typeof topicIpGroupSchema>;

export const topicEventSchema = z
  .looseObject({
    id: z.number(),
    content: z.string(),
    targetUserName: z.string().nullable().optional(),
    time: z.string(),
    operatorUserName: z.string(),
    ip: z.string(),
  })
  .meta({ id: "TopicEvent" });
export type TopicEvent = z.infer<typeof topicEventSchema>;

export const topicEventPageSchema = z
  .looseObject({
    data: z.array(topicEventSchema).nullable(),
    count: z.number(),
    from: z.number(),
    size: z.number(),
    extra: z.unknown().nullable().optional(),
    errorCode: z.number(),
  })
  .meta({ id: "TopicEventPage" });
export type TopicEventPage = z.infer<typeof topicEventPageSchema>;

export const createTopicRequestSchema = z
  .object({
    content: z.string(),
    contentType: postContentTypeSchema,
    title: z.string(),
    type: z.number(),
    tag1: z.number().optional(),
    tag2: z.number().optional(),
    notifyPoster: z.boolean(),
    isAnonymous: z.boolean(),
    clientType: z.number(),
    isVote: z.boolean().optional(),
    voteInfo: createVoteInfoSchema.optional(),
  })
  .meta({ id: "CreateTopicRequest" });
export type CreateTopicRequest = z.infer<typeof createTopicRequestSchema>;
