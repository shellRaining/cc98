import { z } from "zod";

export const favoriteTopicGroupSchema = z
  .looseObject({
    id: z.number().optional().meta({ description: "收藏夹 ID；默认收藏夹通常为 0。" }),
    name: z.string().optional().meta({ description: "收藏夹名称。" }),
    count: z.number().optional().meta({ description: "收藏夹中的主题数量。" }),
    createTime: z.string().optional().meta({ description: "收藏夹创建时间。" }),
  })
  .meta({ id: "FavoriteTopicGroup", description: "当前用户的主题收藏夹。" });
export type FavoriteTopicGroup = z.infer<typeof favoriteTopicGroupSchema>;

export const pagedFavoriteTopicGroupSchema = z
  .looseObject({
    data: z.array(favoriteTopicGroupSchema).meta({ description: "收藏夹列表。" }),
    count: z.number().meta({ description: "收藏夹总数。" }),
    from: z.number().meta({ description: "本次结果的起始位置。" }),
    size: z.number().meta({ description: "本次结果的分页大小。" }),
    extra: z
      .unknown()
      .nullable()
      .optional()
      .meta({ description: "附加数据；没有附加数据时为 null。" }),
    errorCode: z.number().meta({ description: "业务错误码；0 表示成功。" }),
  })
  .meta({ id: "PagedFavoriteTopicGroup", description: "当前用户的主题收藏夹分页结果。" });
export type PagedFavoriteTopicGroup = z.infer<typeof pagedFavoriteTopicGroupSchema>;

export const transferWealthRequestSchema = z
  .object({
    userNames: z
      .array(z.string().min(1).meta({ description: "收款用户名。" }))
      .min(1)
      .max(10)
      .meta({ description: "收款用户名列表，一次最多包含 10 个用户。" }),
    wealth: z.number().min(10).meta({ description: "向每名收款人转出的财富值，不得小于 10。" }),
    reason: z.string().trim().min(1).max(100).meta({ description: "转账理由。" }),
  })
  .meta({ id: "TransferWealthRequest", description: "向一个或多个用户转账的请求。" });
export type TransferWealthRequest = z.infer<typeof transferWealthRequestSchema>;

export const transferWealthResponseSchema = z
  .array(z.string().meta({ description: "完成转账的收款用户名。" }))
  .meta({ id: "TransferWealthResponse", description: "成功收到转账的用户名列表。" });
export type TransferWealthResponse = z.infer<typeof transferWealthResponseSchema>;

export const signinInfoSchema = z
  .looseObject({
    hasSignedInToday: z.boolean().meta({ description: "当前用户今天是否已经签到。" }),
    lastSignInCount: z.number().int().nonnegative().meta({ description: "当前连续签到天数。" }),
    lastSignInTime: z.string().meta({ description: "最近一次签到时间。" }),
    lastReward: z.number().int().nonnegative().meta({ description: "最近一次签到获得的财富值。" }),
  })
  .meta({ id: "SigninInfo", description: "当前用户的签到状态。" });
export type SigninInfo = z.infer<typeof signinInfoSchema>;

export const signinRewardSchema = z
  .number()
  .int()
  .nonnegative()
  .meta({ id: "SigninReward", description: "执行签到后获得的财富值。" });
export type SigninReward = z.infer<typeof signinRewardSchema>;

export const signinRecordSchema = z
  .looseObject({
    year: z.number().int().meta({ description: "签到年份。" }),
    month: z.number().int().min(1).max(12).meta({ description: "签到月份。" }),
    day: z.number().int().min(1).max(31).meta({ description: "签到日期。" }),
    useCard: z.boolean().meta({ description: "该日签到记录是否通过补签卡产生。" }),
    reward: z.number().int().nonnegative().meta({ description: "该次签到获得的财富值。" }),
  })
  .meta({ id: "SigninRecord", description: "某一天的签到记录。" });
export type SigninRecord = z.infer<typeof signinRecordSchema>;

export const makeUpSigninResultSchema = z
  .looseObject({
    errorCode: z.number().optional().meta({ description: "业务错误码；0 表示补签成功。" }),
    extra: z.string().optional().meta({ description: "补签失败时的错误说明。" }),
    data: z.number().optional().meta({ description: "补签后的连续签到天数。" }),
  })
  .meta({ id: "MakeUpSigninResult", description: "使用补签卡后的处理结果。" });
export type MakeUpSigninResult = z.infer<typeof makeUpSigninResultSchema>;

export const annualReviewSchema = z
  .looseObject({
    userId: z.number().optional().meta({ description: "年度报告所属用户 ID。" }),
    year: z.number().optional().meta({ description: "年度报告对应年份。" }),
    postDay: z.number().optional().meta({ description: "该年有发言记录的天数。" }),
    topicCount: z.number().optional().meta({ description: "该年发表的主题数量。" }),
    replyCount: z.number().optional().meta({ description: "该年发表的回复数量。" }),
    hotTopicCount: z.number().optional().meta({ description: "该年产生的热门主题数量。" }),
    sendLikeCount: z.number().optional().meta({ description: "该年送出的点赞数量。" }),
    receiveLikeCount: z.number().optional().meta({ description: "该年收到的点赞数量。" }),
    sendRateCount: z.number().optional().meta({ description: "该年发起的评分次数。" }),
    receiveRateCount: z.number().optional().meta({ description: "该年收到的评分次数。" }),
    sofaCount: z.number().optional().meta({ description: "该年抢到沙发的次数。" }),
    mostReplyTopicId: z
      .number()
      .nullable()
      .optional()
      .meta({ description: "该年回复数最多的主题 ID；没有可用主题时为 null。" }),
    mostReplyTopicCount: z
      .number()
      .nullable()
      .optional()
      .meta({ description: "回复数最多主题的回复数量；没有可用主题时为 null。" }),
    mostViewTopicId: z
      .number()
      .nullable()
      .optional()
      .meta({ description: "该年浏览量最高的主题 ID；没有可用主题时为 null。" }),
    mostViewTopicCount: z
      .number()
      .nullable()
      .optional()
      .meta({ description: "浏览量最高主题的浏览次数；没有可用主题时为 null。" }),
    mostReceiveLikePostId: z
      .number()
      .nullable()
      .optional()
      .meta({ description: "该年获赞最多的帖子 ID；没有可用帖子时为 null。" }),
    mostReceiveLikePostCount: z
      .number()
      .nullable()
      .optional()
      .meta({ description: "获赞最多帖子的点赞数量；没有可用帖子时为 null。" }),
    board1: z
      .number()
      .nullable()
      .optional()
      .meta({ description: "年度活跃度排名第一的版面 ID；没有数据时为 null。" }),
    board2: z
      .number()
      .nullable()
      .optional()
      .meta({ description: "年度活跃度排名第二的版面 ID；没有数据时为 null。" }),
    board3: z
      .number()
      .nullable()
      .optional()
      .meta({ description: "年度活跃度排名第三的版面 ID；没有数据时为 null。" }),
    latestPostTime: z
      .string()
      .nullable()
      .optional()
      .meta({ description: "该年最晚一次发言的时间；没有发言时为 null。" }),
    postCount06: z.number().optional().meta({ description: "0:00 至 6:00 的发言数量。" }),
    postCount612: z.number().optional().meta({ description: "6:00 至 12:00 的发言数量。" }),
    postCount1218: z.number().optional().meta({ description: "12:00 至 18:00 的发言数量。" }),
    postCount1824: z.number().optional().meta({ description: "18:00 至 24:00 的发言数量。" }),
    achievement: z.string().optional().meta({ description: "年度成就或总结文案。" }),
  })
  .meta({ id: "AnnualReview", description: "旧版年度报告的基础统计数据。" });
export type AnnualReview = z.infer<typeof annualReviewSchema>;

export const annualReviewUserSchema = z
  .looseObject({
    userId: z.number().optional().meta({ description: "关联用户 ID。" }),
    userName: z.string().optional().meta({ description: "关联用户名。" }),
    portraitUrl: z.string().optional().meta({ description: "关联用户头像地址。" }),
    likeCount: z.number().optional().meta({ description: "当前用户与该用户之间的相关点赞数量。" }),
  })
  .nullable()
  .meta({ id: "AnnualReviewUser", description: "年度点赞统计关联的用户；没有数据时为 null。" });
export type AnnualReviewUser = z.infer<typeof annualReviewUserSchema>;

export const annualCardDrawSchema = z
  .looseObject({
    totalMysteryCount: z.number().optional().meta({ description: "该年获得的 Mystery 卡数量。" }),
    totalSSRCount: z.number().optional().meta({ description: "该年获得的 SSR 卡数量。" }),
    totalSRCount: z.number().optional().meta({ description: "该年获得的 SR 卡数量。" }),
    totalRCount: z.number().optional().meta({ description: "该年获得的 R 卡数量。" }),
    totalNCount: z.number().optional().meta({ description: "该年获得的 N 卡数量。" }),
    annualPayment: z.number().optional().meta({ description: "该年抽卡消耗的财富值。" }),
    annualCount: z.number().optional().meta({ description: "该年获得的卡片总数。" }),
  })
  .meta({ id: "AnnualCardDraw", description: "年度抽卡统计。" });
export type AnnualCardDraw = z.infer<typeof annualCardDrawSchema>;

export const annualBetSchema = z
  .looseObject({
    totalCount: z.number().optional().meta({ description: "该年参与竞猜的总次数。" }),
    winCount: z.number().optional().meta({ description: "竞猜获胜次数。" }),
    loseCount: z.number().optional().meta({ description: "竞猜失败次数。" }),
    drawCount: z.number().optional().meta({ description: "竞猜平局次数。" }),
    payment: z.number().optional().meta({ description: "竞猜投入的财富值。" }),
    profit: z.number().optional().meta({ description: "竞猜获得的净收益。" }),
  })
  .meta({ id: "AnnualBet", description: "年度竞猜统计。" });
export type AnnualBet = z.infer<typeof annualBetSchema>;

export const annualReviewV2Schema = annualReviewSchema
  .and(
    z.looseObject({
      favoriteTopicCount: z.number().optional().meta({ description: "该年新增收藏的主题数量。" }),
      mostSendLikeUser: annualReviewUserSchema
        .optional()
        .meta({ description: "当前用户送出点赞最多的用户。" }),
      mostReceiveLikeUser: annualReviewUserSchema
        .optional()
        .meta({ description: "向当前用户送出点赞最多的用户。" }),
      cardDraw: annualCardDrawSchema.optional().meta({ description: "年度抽卡统计。" }),
      bet: annualBetSchema
        .nullable()
        .optional()
        .meta({ description: "年度竞猜统计；没有参与竞猜时可能为 null。" }),
    }),
  )
  .meta({ id: "AnnualReviewV2", description: "新版年度报告统计数据。" });
export type AnnualReviewV2 = z.infer<typeof annualReviewV2Schema>;
