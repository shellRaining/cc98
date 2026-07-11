import { z } from "zod";
import { postContentTypeSchema } from "./post.ts";

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
    lastPostUser: z.string().optional(),
    lastPostContent: z.string().optional(),
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
  .object({
    data: z.array(topicSchema).optional(),
    count: z.number().optional(),
  })
  .meta({ id: "PagedTopicResultData" });
export type PagedTopicResultData = z.infer<typeof pagedTopicResultDataSchema>;

export const createPostRequestSchema = z
  .object({
    content: z.string(),
    contentType: postContentTypeSchema,
    title: z.string(),
    parentId: z.number().nullable().optional(),
    isAnonymous: z.boolean(),
    notifyAllReplier: z.boolean().optional(),
    clientType: z.number(),
  })
  .meta({ id: "CreatePostRequest" });
export type CreatePostRequest = z.infer<typeof createPostRequestSchema>;

export const createVoteInfoSchema = z
  .looseObject({
    voteItems: z.array(z.string()).optional(),
    expiredDays: z.number().optional(),
    maxVoteCount: z.number().optional(),
    needVote: z.boolean().optional(),
  })
  .meta({ id: "CreateVoteInfo" });
export type CreateVoteInfo = z.infer<typeof createVoteInfoSchema>;

export const voteInfoSchema = z
  .looseObject({
    topicId: z.number().optional(),
    voteItems: z.array(z.looseObject({})).optional(),
    voteRecords: z.array(z.looseObject({})).optional(),
    expiredTime: z.string().optional(),
    isAvailable: z.boolean().optional(),
    maxVoteCount: z.number().optional(),
    canVote: z.boolean().optional(),
    needVote: z.boolean().optional(),
    voteUserCount: z.number().optional(),
  })
  .meta({ id: "VoteInfo" });
export type VoteInfo = z.infer<typeof voteInfoSchema>;

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
