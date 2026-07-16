import { z } from "zod";

export const globalConfigSchema = z
  .looseObject({
    announcement: z.string().optional(),
    signInTopicId: z.number().nullable().optional(),
  })
  .meta({ id: "GlobalConfig" });
export type GlobalConfig = z.infer<typeof globalConfigSchema>;

export const hotTopicSchema = z
  .looseObject({
    id: z.number().optional(),
    title: z.string().optional(),
    boardId: z.number().optional(),
    boardName: z.string().optional(),
    participantCount: z.number().optional(),
    replyCount: z.number().optional(),
    hitCount: z.number().optional(),
    authorName: z.string().nullable().optional(),
    authorUserId: z.number().optional(),
    createTime: z.string().optional(),
    type: z.number().optional(),
    isAnonymous: z.boolean().optional(),
    hotTopicType: z.number().optional(),
  })
  .meta({ id: "HotTopic" });
export type HotTopic = z.infer<typeof hotTopicSchema>;

export const indexColumnSchema = z
  .looseObject({
    id: z.number().optional(),
    type: z.number().optional(),
    title: z.string().optional(),
    content: z.string().nullable().optional(),
    url: z.string().optional(),
    imageUrl: z.string().nullable().optional(),
    enable: z.boolean().optional(),
    time: z.string().optional(),
    orderWeight: z.number().optional(),
    expiredTime: z.string().nullable().optional(),
    visibility: z.number().optional(),
  })
  .meta({ id: "IndexColumn" });
export type IndexColumn = z.infer<typeof indexColumnSchema>;

export const mainpageAutoContentSchema = z
  .object({
    id: z.number().optional(),
    boardId: z.number().optional(),
    title: z.string().optional(),
    state: z.number().optional(),
    type: z.number().optional(),
    isInternalOnly: z.boolean().optional(),
    isVote: z.boolean().optional(),
  })
  .meta({ id: "MainpageAutoContent" });
export type MainpageAutoContent = z.infer<typeof mainpageAutoContentSchema>;

export const displayTitleSchema = z
  .looseObject({
    id: z.number(),
    name: z.string(),
    type: z.number(),
    sortOrder: z.number(),
    iconUri: z.string(),
  })
  .meta({ id: "DisplayTitle" });
export type DisplayTitle = z.infer<typeof displayTitleSchema>;

export const indexSchema = z
  .object({
    announcement: z.string().optional(),
    hotTopic: z.array(hotTopicSchema).optional(),
    manualHotTopic: z.array(hotTopicSchema).optional(),
    recommendationReading: z.array(indexColumnSchema).optional(),
    recommendationFunction: z.array(indexColumnSchema).optional(),
    specialOffer: z.array(indexColumnSchema).optional(),
    schoolNews: z.array(indexColumnSchema).optional(),
    schoolEvent: z.array(mainpageAutoContentSchema).optional(),
    academics: z.array(mainpageAutoContentSchema).optional(),
    study: z.array(mainpageAutoContentSchema).optional(),
    emotion: z.array(mainpageAutoContentSchema).optional(),
    fleaMarket: z.array(mainpageAutoContentSchema).optional(),
    partTimeJob: z.array(mainpageAutoContentSchema).optional(),
    fullTimeJob: z.array(mainpageAutoContentSchema).optional(),
    todayCount: z.number().optional(),
    todayTopicCount: z.number().optional(),
    topicCount: z.number().optional(),
    postCount: z.number().optional(),
    userCount: z.number().optional(),
    lastUserName: z.string().optional(),
    onlineUserCount: z.number().optional(),
    lastUpdateTime: z.string().optional(),
  })
  .meta({ id: "Index" });
export type Index = z.infer<typeof indexSchema>;
