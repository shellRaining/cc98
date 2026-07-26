import { z } from "zod";
import { postContentTypeSchema } from "./post.ts";

export const topicContentTypeSchema = z
  .union([z.literal(0), z.literal(1), z.literal(2), z.literal(3), z.literal(4)])
  .meta({
    description: "主题卡片的媒体类型：0 为普通主题，1 为投票，2 为视频，3 为音频，4 为图片。",
  });
export type TopicContentType = z.infer<typeof topicContentTypeSchema>;

export const mediaTopicContentSchema = z
  .looseObject({
    thumbnail: z
      .array(z.string())
      .nullable()
      .optional()
      .meta({ description: "主题卡片使用的缩略图地址列表。" }),
    video: z.string().optional().meta({ description: "主题卡片关联的视频地址。" }),
    audio: z.string().optional().meta({ description: "主题卡片关联的音频地址。" }),
    width: z.number().optional().meta({ description: "媒体内容的原始宽度。" }),
    height: z.number().optional().meta({ description: "媒体内容的原始高度。" }),
  })
  .meta({ id: "MediaTopicContent", description: "主题列表卡片使用的媒体摘要。" });
export type MediaTopicContent = z.infer<typeof mediaTopicContentSchema>;

export const topicHighlightInfoSchema = z
  .looseObject({
    isBold: z.boolean().optional().meta({ description: "主题标题是否加粗。" }),
    isItalic: z.boolean().optional().meta({ description: "主题标题是否使用斜体。" }),
    color: z
      .string()
      .nullable()
      .optional()
      .meta({ description: "主题标题颜色；未指定时可能为 null。" }),
  })
  .meta({ id: "TopicHighlightInfo", description: "主题标题的高亮样式。" });
export type TopicHighlightInfo = z.infer<typeof topicHighlightInfoSchema>;

export const lotteryTopicDetailSchema = z
  .looseObject({
    drawingTime: z.string().optional().meta({ description: "预定开奖时间。" }),
    drawingCount: z.number().optional().meta({ description: "计划抽取的中奖数量。" }),
    mode: z.number().optional().meta({
      description: "抽奖去重模式：1 为每个 CC98 账号最多中奖一次，2 为每个浙大通行证最多中奖一次。",
    }),
    status: z.number().optional().meta({
      description: "抽奖状态：1 为等待开奖，2 为已开奖，3 为异常中止。",
    }),
    resultFloor: z.number().nullable().optional().meta({
      description: "公布中奖名单的楼层；尚未开奖或异常中止时可能为 null。",
    }),
  })
  .meta({ id: "LotteryTopicDetail", description: "抽奖主题的开奖配置和状态。" });
export type LotteryTopicDetail = z.infer<typeof lotteryTopicDetailSchema>;

export const topicSchema = z
  .looseObject({
    id: z.number().optional().meta({ description: "主题 ID。" }),
    boardId: z.number().optional().meta({ description: "主题所属版面 ID。" }),
    boardName: z.string().optional().meta({ description: "主题所属版面名称。" }),
    title: z.string().optional().meta({ description: "主题标题。" }),
    time: z.string().optional().meta({ description: "主题发布时间。" }),
    userId: z
      .number()
      .nullable()
      .optional()
      .meta({ description: "主题作者用户 ID；匿名主题中可能为 null。" }),
    userName: z
      .string()
      .nullable()
      .optional()
      .meta({ description: "主题作者用户名；匿名主题中可能为 null。" }),
    userInfo: z
      .looseObject({})
      .nullable()
      .optional()
      .meta({ description: "主题作者摘要；当前真实主题列表中仅观察到 null，内部字段尚未确认。" }),
    isAnonymous: z.boolean().optional().meta({ description: "主题是否匿名发布。" }),
    isMe: z.boolean().optional().meta({ description: "当前登录用户是否为主题作者。" }),
    disableHot: z.boolean().optional().meta({ description: "主题是否被禁止进入热门主题列表。" }),
    lastPostTime: z.string().optional().meta({ description: "主题最后回复时间。" }),
    state: z
      .number()
      .optional()
      .meta({ description: "主题状态码：1 表示主题已锁定，其他取值含义尚未确认。" }),
    type: z.number().optional().meta({
      description: "主题类型：0 为普通主题，1 为校园活动，2 为学术通知。",
    }),
    replyCount: z.number().optional().meta({ description: "主题回复数。" }),
    todayCount: z.number().optional().meta({ description: "主题今日回复数。" }),
    hitCount: z.number().optional().meta({ description: "主题浏览次数。" }),
    totalVoteUserCount: z.number().optional().meta({ description: "投票主题的参与用户总数。" }),
    lastPostUser: z
      .string()
      .nullable()
      .optional()
      .meta({ description: "最后回复者用户名；没有回复者信息时可能为 null。" }),
    lastPostContent: z
      .string()
      .nullable()
      .optional()
      .meta({ description: "最后回复内容摘要；可能包含原始 UBB 片段。" }),
    topState: z.number().optional().meta({
      description: "主题置顶状态：0 为未置顶，2 为版面固顶，4 为全站固顶；其他取值含义尚未确认。",
    }),
    bestState: z
      .number()
      .optional()
      .meta({ description: "主题精华状态：1 表示精华，其他取值含义尚未确认。" }),
    isVote: z.boolean().optional().meta({ description: "是否为投票主题。" }),
    isPosterOnly: z
      .boolean()
      .optional()
      .meta({ description: "楼主相关的内容限制标记，具体行为尚未确认。" }),
    allowedViewerState: z
      .number()
      .optional()
      .meta({ description: "主题可见用户限制状态码，具体枚举含义尚未确认。" }),
    likeCount: z.number().optional().meta({ description: "主题收到的赞同数。" }),
    dislikeCount: z.number().optional().meta({ description: "主题收到的反对数。" }),
    highlightInfo: topicHighlightInfoSchema
      .nullable()
      .optional()
      .meta({ description: "主题标题高亮样式；未设置时为 null。" }),
    tag1: z
      .number()
      .nullable()
      .optional()
      .meta({ description: "主题第一层标签 ID；未选择时可能为 null 或 0。" }),
    tag2: z
      .number()
      .nullable()
      .optional()
      .meta({ description: "主题第二层标签 ID；未选择时可能为 null 或 0。" }),
    isInternalOnly: z.boolean().optional().meta({ description: "主题是否仅允许从校园内网访问。" }),
    favoriteCount: z.number().optional().meta({ description: "收藏该主题的用户数。" }),
    notifyPoster: z.boolean().optional().meta({ description: "主题作者是否接收后续回复提醒。" }),
    allowHotReply: z
      .boolean()
      .optional()
      .meta({ description: "主题是否允许热门回复，具体行为尚未确认。" }),
    canNotifyAllReplier: z
      .boolean()
      .optional()
      .meta({ description: "当前用户是否可以通知该主题的全部回复者。" }),
    topicAuthorPermissions: z.array(z.string()).optional().meta({
      description: "服务端授予当前主题作者的主题管理权限标识列表。",
    }),
    specialStyle: z
      .number()
      .optional()
      .meta({ description: "主题特殊展示样式编号，具体枚举含义尚未确认。" }),
    notifyAllReplierCountByLZ: z
      .number()
      .optional()
      .meta({ description: "楼主已使用“通知全部回复者”功能的次数。" }),
    lastNotifyAllReplierFloorByLZ: z
      .number()
      .optional()
      .meta({ description: "楼主最近一次使用“通知全部回复者”功能时的楼层。" }),
    notifyAllReplierPostIds: z
      .array(z.number())
      .optional()
      .meta({ description: "触发过“通知全部回复者”的回复 ID 列表。" }),
    isHotTopic: z.boolean().optional().meta({ description: "主题当前是否属于热门主题。" }),
    lotteryTopicDetail: lotteryTopicDetailSchema
      .nullable()
      .optional()
      .meta({ description: "抽奖主题详情；非抽奖主题为 null。" }),
    lastBrowsingTime: z.string().optional().meta({ description: "当前用户最近浏览该主题的时间。" }),
    contentType: topicContentTypeSchema.optional(),
    mediaContent: mediaTopicContentSchema
      .nullable()
      .optional()
      .meta({ description: "主题卡片使用的媒体摘要；普通主题可能为 null。" }),
  })
  .meta({
    id: "Topic",
    description: "主题概要。不同主题列表和详情接口可能只返回部分字段，后端也可能增加未声明字段。",
  });
export type Topic = z.infer<typeof topicSchema>;

export const recommendedTopicSchema = z
  .looseObject({
    topic: topicSchema.optional().meta({ description: "推荐的主题概要。" }),
    content: z
      .string()
      .nullable()
      .optional()
      .meta({ description: "推荐主题的正文摘要；没有可用摘要时可能为 null。" }),
  })
  .meta({ id: "RecommendedTopic", description: "随机推荐主题及其正文摘要。" });
export type RecommendedTopic = z.infer<typeof recommendedTopicSchema>;

export const topicPagedResultSchema = z
  .object({
    topics: z.array(topicSchema).optional().meta({ description: "当前页的主题列表。" }),
    count: z.number().optional().meta({ description: "符合条件的主题总数。" }),
  })
  .meta({ id: "TopicPagedResult", description: "主题分页结果。" });
export type TopicPagedResult = z.infer<typeof topicPagedResultSchema>;

export const pagedTopicResultDataSchema = z
  .looseObject({
    data: z.array(topicSchema).meta({ description: "当前页的主题列表。" }),
    count: z.number().meta({ description: "符合条件的主题总数。" }),
    from: z.number().meta({ description: "本次结果的起始位置。" }),
    size: z.number().meta({ description: "本次结果的分页大小。" }),
    extra: z
      .unknown()
      .nullable()
      .optional()
      .meta({ description: "附加数据；没有附加数据时为 null。" }),
    errorCode: z.number().meta({ description: "业务错误码；0 表示成功。" }),
  })
  .meta({ id: "PagedTopicResultData", description: "包含统一分页元数据的主题列表。" });
export type PagedTopicResultData = z.infer<typeof pagedTopicResultDataSchema>;

export const createPostRequestSchema = z
  .object({
    content: z.string().meta({ description: "回复正文，格式由 contentType 决定。" }),
    contentType: postContentTypeSchema.meta({ description: "正文格式：0 为 UBB，1 为 Markdown。" }),
    title: z.string().meta({ description: "回复标题；普通回复通常传空字符串。" }),
    parentId: z
      .number()
      .optional()
      .meta({ description: "被回复帖子的 ID；直接回复主题时可省略。" }),
    isAnonymous: z.boolean().meta({ description: "是否匿名回复。" }),
    notifyAllReplier: z
      .boolean()
      .optional()
      .meta({ description: "是否同时通知该主题的全部回复者。" }),
    clientType: z
      .number()
      .meta({ description: "发帖客户端类型标识；Web 前端使用 1，其他取值含义尚未确认。" }),
  })
  .meta({ id: "CreatePostRequest", description: "在主题中发表回复的请求体。" });
export type CreatePostRequest = z.infer<typeof createPostRequestSchema>;

export const createVoteInfoSchema = z
  .object({
    voteItems: z.array(z.string()).meta({ description: "投票选项文字列表。" }),
    expiredDays: z.number().int().meta({ description: "投票有效天数。" }),
    maxVoteCount: z.number().int().meta({ description: "每位用户最多可以选择的选项数。" }),
    needVote: z.boolean().meta({ description: "是否必须完成投票后才能在截止前查看结果。" }),
  })
  .meta({ id: "CreateVoteInfo", description: "创建投票主题时提交的投票配置。" });
export type CreateVoteInfo = z.infer<typeof createVoteInfoSchema>;

export const voteItemSchema = z
  .looseObject({
    id: z.number().meta({ description: "投票选项 ID。" }),
    description: z.string().meta({ description: "投票选项文字。" }),
    count: z.number().meta({ description: "该选项获得的票数。" }),
  })
  .meta({ id: "VoteItem", description: "一个投票选项及其票数。" });
export type VoteItem = z.infer<typeof voteItemSchema>;

export const voteRecordSchema = z
  .looseObject({
    userId: z.number().meta({ description: "投票用户 ID。" }),
    userName: z.string().meta({ description: "投票用户名。" }),
    items: z.array(z.number()).meta({ description: "该用户选择的投票选项 ID 列表。" }),
    ip: z.string().meta({ description: "投票来源 IP；是否返回由权限和投票设置决定。" }),
    time: z.string().meta({ description: "投票时间。" }),
  })
  .meta({ id: "VoteRecord", description: "一名用户的投票记录。" });
export type VoteRecord = z.infer<typeof voteRecordSchema>;

export const voteInfoSchema = z
  .looseObject({
    topicId: z.number().optional().meta({ description: "投票所属主题 ID。" }),
    voteItems: z.array(voteItemSchema).optional().meta({ description: "投票选项列表。" }),
    voteRecords: z
      .array(voteRecordSchema)
      .nullable()
      .optional()
      .meta({ description: "全部投票记录；结果不可见时可能为 null。" }),
    expiredTime: z.string().optional().meta({ description: "投票截止时间。" }),
    isAvailable: z.boolean().optional().meta({ description: "投票当前是否仍然有效。" }),
    maxVoteCount: z.number().optional().meta({ description: "每名用户最多可以选择的选项数。" }),
    canVote: z.boolean().optional().meta({ description: "当前用户现在是否可以投票。" }),
    myRecord: voteRecordSchema
      .nullable()
      .optional()
      .meta({ description: "当前用户的投票记录；尚未投票时为 null。" }),
    needVote: z.boolean().optional().meta({ description: "是否必须投票后才能在截止前查看结果。" }),
    voteUserCount: z.number().optional().meta({ description: "参与投票的用户总数。" }),
  })
  .meta({ id: "VoteInfo", description: "主题投票的选项、结果和当前用户状态。" });
export type VoteInfo = z.infer<typeof voteInfoSchema>;

export const submitVoteRequestSchema = z
  .object({
    items: z
      .array(z.number().int().positive())
      .min(1)
      .meta({ description: "当前用户选择的投票选项 ID 列表。" }),
  })
  .meta({ id: "SubmitVoteRequest", description: "提交主题投票的请求体。" });
export type SubmitVoteRequest = z.infer<typeof submitVoteRequestSchema>;

export const reasonRequestSchema = z
  .object({
    reason: z.string().optional().meta({ description: "执行管理操作的原因。" }),
  })
  .meta({ id: "ReasonRequest", description: "只包含操作原因的管理请求体。" });
export type ReasonRequest = z.infer<typeof reasonRequestSchema>;

export const topicLockRequestSchema = z
  .object({
    reason: z.string().optional().meta({ description: "锁定主题的原因。" }),
    value: z.number().optional().meta({ description: "锁定时长，单位为天。" }),
  })
  .meta({ id: "TopicLockRequest", description: "锁定一个或多个主题的请求体。" });
export type TopicLockRequest = z.infer<typeof topicLockRequestSchema>;

export const topicTopRequestSchema = z
  .object({
    topState: z
      .union([z.literal(2), z.literal(4)])
      .optional()
      .meta({ description: "置顶级别：2 为版面置顶，4 为全站置顶。" }),
    duration: z.number().optional().meta({ description: "置顶时长，单位为天。" }),
    reason: z.string().optional().meta({ description: "设置置顶的原因。" }),
  })
  .meta({ id: "TopicTopRequest", description: "设置主题置顶状态的请求体。" });
export type TopicTopRequest = z.infer<typeof topicTopRequestSchema>;

export const topicHighlightRequestSchema = z
  .object({
    isBold: z.boolean().optional().meta({ description: "主题标题是否加粗。" }),
    isItalic: z.boolean().optional().meta({ description: "主题标题是否使用斜体。" }),
    color: z
      .string()
      .optional()
      .meta({ description: "主题标题颜色，Web 前端使用十六进制颜色值。" }),
    duration: z.number().optional().meta({ description: "高亮持续时间，单位为天。" }),
    reason: z.string().optional().meta({ description: "设置高亮的原因。" }),
  })
  .meta({ id: "TopicHighlightRequest", description: "设置主题标题高亮样式的请求体。" });
export type TopicHighlightRequest = z.infer<typeof topicHighlightRequestSchema>;

export const topicIpGroupSchema = z
  .object({
    ip: z.string().optional().meta({ description: "一组回复使用的 IP 地址。" }),
    posts: z
      .array(
        z.object({
          userName: z.string().optional().meta({ description: "回复者用户名。" }),
          floor: z.number().optional().meta({ description: "回复所在楼层。" }),
          content: z.string().optional().meta({ description: "回复正文。" }),
        }),
      )
      .optional()
      .meta({ description: "使用该 IP 发布的回复。" }),
  })
  .meta({ id: "TopicIpGroup", description: "按 IP 地址分组的主题回复。" });
export type TopicIpGroup = z.infer<typeof topicIpGroupSchema>;

export const topicEventSchema = z
  .looseObject({
    id: z.number().meta({ description: "主题操作记录 ID。" }),
    content: z.string().meta({ description: "操作内容说明。" }),
    targetUserName: z
      .string()
      .nullable()
      .optional()
      .meta({ description: "操作涉及的目标用户名；不涉及具体用户时可能为 null。" }),
    time: z.string().meta({ description: "操作发生时间。" }),
    operatorUserName: z.string().meta({ description: "执行操作的用户名。" }),
    ip: z.string().meta({ description: "执行操作时的 IP 地址。" }),
  })
  .meta({ id: "TopicEvent", description: "一条主题管理操作记录。" });
export type TopicEvent = z.infer<typeof topicEventSchema>;

export const topicEventPageSchema = z
  .looseObject({
    data: z
      .array(topicEventSchema)
      .nullable()
      .meta({ description: "当前页的主题操作记录；不可查看或没有数据时可能为 null。" }),
    count: z.number().meta({ description: "主题操作记录总数。" }),
    from: z.number().meta({ description: "本次结果的起始位置。" }),
    size: z.number().meta({ description: "本次结果的分页大小。" }),
    extra: z
      .unknown()
      .nullable()
      .optional()
      .meta({ description: "附加数据；没有附加数据时为 null。" }),
    errorCode: z.number().meta({ description: "业务错误码；0 表示成功。" }),
  })
  .meta({ id: "TopicEventPage", description: "主题管理操作记录的分页结果。" });
export type TopicEventPage = z.infer<typeof topicEventPageSchema>;

export const createTopicRequestSchema = z
  .object({
    content: z.string().meta({ description: "主题正文，格式由 contentType 决定。" }),
    contentType: postContentTypeSchema.meta({ description: "正文格式：0 为 UBB，1 为 Markdown。" }),
    title: z.string().meta({ description: "主题标题。" }),
    type: z.number().meta({ description: "主题类型：0 为普通主题，1 为校园活动，2 为学术通知。" }),
    tag1: z.number().optional().meta({ description: "第一层标签 ID；版面没有标签时可省略。" }),
    tag2: z.number().optional().meta({ description: "第二层标签 ID；版面少于两层标签时可省略。" }),
    notifyPoster: z.boolean().meta({ description: "主题作者是否接收后续回复提醒。" }),
    isAnonymous: z.boolean().meta({ description: "是否匿名发布主题。" }),
    clientType: z
      .number()
      .meta({ description: "发帖客户端类型标识；Web 前端使用 1，其他取值含义尚未确认。" }),
    isVote: z.boolean().optional().meta({ description: "是否创建投票主题。" }),
    voteInfo: createVoteInfoSchema.optional().meta({ description: "投票配置；普通主题可省略。" }),
  })
  .meta({ id: "CreateTopicRequest", description: "在指定版面创建主题的请求体。" });
export type CreateTopicRequest = z.infer<typeof createTopicRequestSchema>;
