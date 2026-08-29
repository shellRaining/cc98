import { z } from "zod";

export const postContentTypeSchema = z.union([z.literal(0), z.literal(1)]);
export type PostContentType = z.infer<typeof postContentTypeSchema>;

export const POST_CONTENT_TYPE = {
  ubb: 0 as const,
  markdown: 1 as const,
} satisfies Record<string, PostContentType>;

export const postAwardSchema = z
  .looseObject({
    id: z.number().optional().meta({ description: "奖励或处罚记录 ID。" }),
    content: z.string().optional().meta({ description: "财富、声望等奖励或处罚的内容摘要。" }),
    operatorName: z.string().optional().meta({ description: "执行奖励或处罚的用户名。" }),
    reason: z.string().optional().meta({ description: "执行该操作时填写的理由。" }),
    time: z.string().optional().meta({ description: "奖励或处罚的执行时间。" }),
    type: z.number().optional().meta({ description: "奖励或处罚类型编号，具体取值含义尚未确认。" }),
  })
  .meta({ id: "PostAward", description: "帖子获得的奖励或处罚记录。" });
export type PostAward = z.infer<typeof postAwardSchema>;

export const postSchema = z
  .looseObject({
    id: z.number().optional().meta({ description: "帖子 ID。" }),
    topicId: z.number().optional().meta({ description: "帖子所属的主题 ID。" }),
    boardId: z.number().optional().meta({ description: "帖子所属的版面 ID。" }),
    title: z
      .string()
      .nullable()
      .optional()
      .meta({ description: "帖子标题；普通回复通常为 null。" }),
    content: z
      .string()
      .optional()
      .meta({ description: "帖子正文原文，需要根据 contentType 解析。" }),
    contentType: postContentTypeSchema.optional().meta({
      description: "正文格式：0 为 CC98 UBB，1 为 Markdown。",
    }),
    floor: z.number().optional().meta({ description: "帖子在主题中的楼层号，从 1 开始。" }),
    count: z.number().optional().meta({
      description: "筛选类接口中的匹配帖子总数；普通主题帖子列表中通常为 0。",
    }),
    userId: z
      .number()
      .nullable()
      .optional()
      .meta({ description: "发帖用户 ID；匿名或无法提供用户信息时可能为 null。" }),
    userName: z
      .string()
      .nullable()
      .optional()
      .meta({ description: "发帖用户名或匿名标识；无法提供时可能为 null。" }),
    ip: z.string().optional().meta({ description: "发帖 IP 信息，内容可能随当前用户权限而变化。" }),
    isAllowedOnly: z.boolean().optional().meta({ description: "是否仅允许指定用户查看。" }),
    isAnonymous: z.boolean().optional().meta({ description: "帖子是否以匿名方式发布。" }),
    isBest: z
      .boolean()
      .optional()
      .meta({ description: "帖子是否被标记为精华，具体展示规则尚未确认。" }),
    isDeleted: z.boolean().optional().meta({ description: "帖子是否已被删除。" }),
    isLZ: z.boolean().optional().meta({ description: "帖子是否由主题作者发布。" }),
    likeCount: z.number().optional().meta({ description: "点赞数量。" }),
    dislikeCount: z.number().optional().meta({ description: "点踩数量。" }),
    likeState: z
      .union([z.literal(0), z.literal(1), z.literal(2)])
      .optional()
      .meta({ description: "当前用户的赞踩状态：0 为未操作，1 为点赞，2 为点踩。" }),
    length: z.number().optional().meta({ description: "旧响应中的主题总楼层数。" }),
    parentId: z
      .number()
      .nullable()
      .optional()
      .meta({ description: "被回复或引用的帖子 ID；没有指定父帖子时可能为 0 或 null。" }),
    state: z.number().optional().meta({ description: "帖子状态编号，具体取值含义尚未确认。" }),
    time: z.string().optional().meta({ description: "帖子发布时间。" }),
    awards: z
      .array(postAwardSchema)
      .optional()
      .meta({ description: "该帖子获得的奖励或处罚记录。" }),
    allowedViewers: z
      .array(z.number())
      .nullable()
      .optional()
      .meta({ description: "允许查看受限帖子的用户 ID 列表；帖子不受限时可能为 null。" }),
    lastUpdateTime: z
      .string()
      .nullable()
      .optional()
      .meta({ description: "帖子最后编辑时间；未编辑时可能为 null。" }),
    lastUpdateAuthor: z
      .string()
      .nullable()
      .optional()
      .meta({ description: "最后编辑帖子的用户名或匿名标识；未编辑时可能为 null。" }),
    isMe: z.boolean().optional().meta({ description: "帖子是否由当前登录用户发布。" }),
  })
  .meta({ id: "Post", description: "主题中的帖子或回复。后端可能省略部分字段。" });
export type Post = z.infer<typeof postSchema>;

export const pagedPostResultSchema = z
  .looseObject({
    data: z.array(postSchema).meta({ description: "当前分页返回的帖子列表。" }),
    count: z.number().meta({ description: "符合条件的帖子总数。" }),
    from: z.number().meta({ description: "本页数据的起始偏移量。" }),
    size: z.number().meta({ description: "请求的分页数量。" }),
    extra: z.unknown().nullable().optional().meta({ description: "附加数据；没有时可能为 null。" }),
    errorCode: z.number().meta({ description: "业务错误码；0 表示成功。" }),
  })
  .meta({ id: "PagedPostResult", description: "带总数和分页信息的帖子列表响应。" });
export type PagedPostResult = z.infer<typeof pagedPostResultSchema>;

export const likeSchema = z
  .object({
    dislikeCount: z.number().optional().meta({ description: "点踩数量。" }),
    likeCount: z.number().optional().meta({ description: "点赞数量。" }),
    likeState: z
      .union([z.literal(0), z.literal(1), z.literal(2)])
      .optional()
      .meta({ description: "当前用户的赞踩状态：0 为未操作，1 为点赞，2 为点踩。" }),
  })
  .meta({ id: "Like", description: "帖子的点赞、点踩数量及当前用户状态。" });
export type Like = z.infer<typeof likeSchema>;

export const postLikeActionSchema = z
  .union([z.literal("1"), z.literal("2")])
  .meta({ description: "赞踩操作：字符串 1 表示点赞，字符串 2 表示点踩。" });
export type PostLikeAction = z.infer<typeof postLikeActionSchema>;

export const postRatingTypeSchema = z
  .union([z.literal(1), z.literal(2)])
  .meta({ description: "评分类型：1 为正面评分，2 为负面评分。" });
export type PostRatingType = z.infer<typeof postRatingTypeSchema>;

export const postRatingRequestSchema = z
  .object({
    reasonId: z.number().int().positive().meta({ description: "评分理由 ID。" }),
    type: postRatingTypeSchema.meta({ description: "评分类型：1 为正面评分，2 为负面评分。" }),
  })
  .meta({ id: "PostRatingRequest", description: "基于预设理由提交帖子评分。" });
export type PostRatingRequest = z.infer<typeof postRatingRequestSchema>;

export const editPostRequestSchema = z
  .object({
    content: z.string().meta({ description: "修改后的帖子正文。" }),
    contentType: postContentTypeSchema.meta({
      description: "正文格式：0 为 CC98 UBB，1 为 Markdown。",
    }),
    title: z.string().meta({ description: "修改后的主题标题；编辑普通回复时传空字符串。" }),
    tag1: z.number().optional().meta({ description: "主题的一级标签 ID，仅编辑主题首帖时使用。" }),
    tag2: z.number().optional().meta({ description: "主题的二级标签 ID，仅编辑主题首帖时使用。" }),
    type: z.number().optional().meta({
      description: "主题类型：0 为普通主题，1 为校园活动，2 为学术通知；仅编辑主题首帖时使用。",
    }),
    notifyPoster: z.boolean().optional().meta({
      description: "是否接收主题相关消息提醒，仅编辑主题首帖时使用。",
    }),
  })
  .meta({ id: "EditPostRequest", description: "编辑帖子或主题首帖时提交的内容。" });
export type EditPostRequest = z.infer<typeof editPostRequestSchema>;

export const postOperationRequestSchema = z
  .object({
    operationType: z.number().optional().meta({
      description: "管理操作类型：0 为奖励，1 为扣除或处罚。",
    }),
    reason: z.string().optional().meta({ description: "执行管理操作的理由。" }),
    wealth: z.number().optional().meta({ description: "增加或扣除的财富值。" }),
    prestige: z.number().optional().meta({ description: "增加或扣除的声望值。" }),
    stopPostDays: z.number().optional().meta({ description: "在所属版面禁止发帖的天数。" }),
  })
  .meta({ id: "PostOperationRequest", description: "奖励、扣除财富或声望，以及版面禁言操作。" });
export type PostOperationRequest = z.infer<typeof postOperationRequestSchema>;

export const postRewardDailyRecordSchema = z
  .looseObject({
    rewardMaxValue: z.number().optional().meta({ description: "该版面每日允许发放的财富值上限。" }),
    rewardTotalValue: z
      .number()
      .optional()
      .meta({ description: "当前用户当天已在该版面发放的财富值。" }),
    boardName: z.string().optional().meta({ description: "版面名称。" }),
  })
  .meta({ id: "PostRewardDailyRecord", description: "版主当天在指定版面的财富奖励额度使用情况。" });
export type PostRewardDailyRecord = z.infer<typeof postRewardDailyRecordSchema>;

export const ratingReasonSchema = z
  .looseObject({
    id: z.number().meta({ description: "评分理由 ID。" }),
    reason: z.string().meta({ description: "评分理由的展示文本。" }),
    type: postRatingTypeSchema.meta({ description: "评分类型：1 为正面评分，2 为负面评分。" }),
    enabled: z.boolean().meta({ description: "该评分理由当前是否可用。" }),
  })
  .meta({ id: "RatingReason", description: "帖子评分时可选择的预设理由。" });
export type RatingReason = z.infer<typeof ratingReasonSchema>;
