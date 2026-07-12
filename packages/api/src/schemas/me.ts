import { z } from "zod";

export const favoriteTopicGroupSchema = z
  .looseObject({
    id: z.number().optional(),
    name: z.string().optional(),
    count: z.number().optional(),
    createTime: z.string().optional(),
  })
  .meta({ id: "FavoriteTopicGroup" });
export type FavoriteTopicGroup = z.infer<typeof favoriteTopicGroupSchema>;

export const pagedFavoriteTopicGroupSchema = z
  .looseObject({
    data: z.array(favoriteTopicGroupSchema),
    count: z.number(),
    from: z.number(),
    size: z.number(),
    extra: z.unknown().nullable().optional(),
    errorCode: z.number(),
  })
  .meta({ id: "PagedFavoriteTopicGroup" });
export type PagedFavoriteTopicGroup = z.infer<typeof pagedFavoriteTopicGroupSchema>;

export const transferWealthRequestSchema = z
  .object({
    userNames: z.array(z.string()),
    wealth: z.number(),
    reason: z.string(),
  })
  .meta({ id: "TransferWealthRequest" });
export type TransferWealthRequest = z.infer<typeof transferWealthRequestSchema>;

export const signinInfoSchema = z
  .looseObject({
    hasSignedInToday: z.boolean(),
    lastSignInCount: z.number().int().nonnegative(),
    lastSignInTime: z.string(),
    lastReward: z.number().int().nonnegative(),
  })
  .meta({ id: "SigninInfo" });
export type SigninInfo = z.infer<typeof signinInfoSchema>;

export const signinRecordSchema = z
  .looseObject({
    year: z.number().int(),
    month: z.number().int().min(1).max(12),
    day: z.number().int().min(1).max(31),
    useCard: z.boolean(),
    reward: z.number().int().nonnegative(),
  })
  .meta({ id: "SigninRecord" });
export type SigninRecord = z.infer<typeof signinRecordSchema>;

export const makeUpSigninResultSchema = z
  .looseObject({
    errorCode: z.number().optional(),
    extra: z.string().optional(),
    data: z.number().optional(),
  })
  .meta({ id: "MakeUpSigninResult" });
export type MakeUpSigninResult = z.infer<typeof makeUpSigninResultSchema>;

export const annualReviewSchema = z
  .looseObject({
    postDay: z.number().optional(),
    topicCount: z.number().optional(),
    replyCount: z.number().optional(),
    hotTopicCount: z.number().optional(),
    sendLikeCount: z.number().optional(),
    receiveLikeCount: z.number().optional(),
    sendRateCount: z.number().optional(),
    receiveRateCount: z.number().optional(),
    sofaCount: z.number().optional(),
    mostReplyTopicCount: z.number().nullable().optional(),
    mostViewTopicCount: z.number().nullable().optional(),
    mostReceiveLikePostCount: z.number().nullable().optional(),
    board1: z.number().nullable().optional(),
    board2: z.number().nullable().optional(),
    board3: z.number().nullable().optional(),
    latestPostTime: z.string().nullable().optional(),
    postCount06: z.number().optional(),
    postCount612: z.number().optional(),
    postCount1218: z.number().optional(),
    postCount1824: z.number().optional(),
    achievement: z.string().optional(),
  })
  .meta({ id: "AnnualReview" });
export type AnnualReview = z.infer<typeof annualReviewSchema>;

export const annualReviewUserSchema = z
  .looseObject({
    userId: z.number().optional(),
    userName: z.string().optional(),
    portraitUrl: z.string().optional(),
    likeCount: z.number().optional(),
  })
  .nullable()
  .meta({ id: "AnnualReviewUser" });
export type AnnualReviewUser = z.infer<typeof annualReviewUserSchema>;

export const annualCardDrawSchema = z
  .looseObject({
    totalMysteryCount: z.number().optional(),
    totalSSRCount: z.number().optional(),
    totalSRCount: z.number().optional(),
    totalRCount: z.number().optional(),
    totalNCount: z.number().optional(),
    annualPayment: z.number().optional(),
    annualCount: z.number().optional(),
  })
  .meta({ id: "AnnualCardDraw" });
export type AnnualCardDraw = z.infer<typeof annualCardDrawSchema>;

export const annualReviewV2Schema = annualReviewSchema
  .and(
    z.looseObject({
      favoriteTopicCount: z.number().optional(),
      mostSendLikeUser: annualReviewUserSchema.optional(),
      mostReceiveLikeUser: annualReviewUserSchema.optional(),
      cardDraw: annualCardDrawSchema.optional(),
      bet: z.looseObject({}).nullable().optional(),
    }),
  )
  .meta({ id: "AnnualReviewV2" });
export type AnnualReviewV2 = z.infer<typeof annualReviewV2Schema>;
