import { z } from "zod";

export const globalConfigSchema = z
  .looseObject({
    maxOnlineCount: z.number().optional().meta({ description: "论坛历史最高同时在线人数。" }),
    maxOnlineDate: z.string().optional().meta({ description: "论坛达到历史最高在线人数的时间。" }),
    topicCount: z.number().optional().meta({ description: "论坛主题总数。" }),
    postCount: z.number().optional().meta({ description: "论坛回复总数。" }),
    userCount: z.number().optional().meta({ description: "论坛注册用户总数。" }),
    lastUserName: z.string().optional().meta({ description: "最新注册用户的用户名。" }),
    maxPostCount: z.number().optional().meta({ description: "论坛历史最高单日发帖数。" }),
    maxPostDate: z.string().optional().meta({ description: "论坛达到历史最高单日发帖数的日期。" }),
    isMaintaining: z.boolean().optional().meta({ description: "论坛是否处于维护状态。" }),
    announcement: z.string().optional().meta({ description: "全站公告内容，使用 CC98 UBB 格式。" }),
    signInEnabled: z.boolean().optional().meta({ description: "论坛签到功能是否开启。" }),
    signInRewards: z
      .array(z.looseObject({}))
      .optional()
      .meta({ description: "签到奖励配置项列表；当前只能确认元素为对象，内部字段含义尚未确认。" }),
    signInTopicId: z
      .number()
      .nullable()
      .optional()
      .meta({ description: "签到主题 ID；未配置签到主题时可能为空。" }),
    todayCount: z.number().optional().meta({ description: "论坛今日发帖数。" }),
    anonymityAdmin: z.array(z.string()).optional().meta({
      description: "匿名发帖管理相关的用户名列表，具体权限含义尚未确认。",
    }),
    lastBirthdayActivityDay: z
      .string()
      .optional()
      .meta({ description: "生日活动相关日期，具体含义尚未确认。" }),
    birthdayActivitySetting: z
      .string()
      .optional()
      .meta({ description: "生日活动配置字符串，内部格式尚未确认。" }),
    birthdayActivityIsEnabled: z.boolean().optional().meta({ description: "生日活动是否开启。" }),
  })
  .meta({
    id: "GlobalConfig",
    description: "论坛全局运行配置与统计信息。后端可能省略部分字段，并可能增加未声明字段。",
  });
export type GlobalConfig = z.infer<typeof globalConfigSchema>;

export const serverTimeResponseSchema = z
  .object({
    data: z.string().meta({ description: "服务器当前时间字符串。" }),
    extra: z.null().meta({ description: "成功响应的附加数据；当前固定为 null。" }),
    errorCode: z.literal(0).meta({ description: "业务错误码；0 表示成功。" }),
  })
  .meta({ id: "ServerTimeResponse", description: "服务器时间接口的成功响应包装。" });
export type ServerTimeResponse = z.infer<typeof serverTimeResponseSchema>;

export const hotTopicSchema = z
  .looseObject({
    id: z.number().optional().meta({ description: "热门主题 ID。" }),
    title: z.string().optional().meta({ description: "热门主题标题。" }),
    boardId: z.number().optional().meta({ description: "热门主题所属版面 ID。" }),
    boardName: z.string().optional().meta({ description: "热门主题所属版面名称。" }),
    participantCount: z.number().optional().meta({ description: "参与该主题讨论的用户数量。" }),
    replyCount: z.number().optional().meta({ description: "主题回复数量。" }),
    hitCount: z.number().optional().meta({ description: "主题浏览次数。" }),
    authorName: z
      .string()
      .nullable()
      .optional()
      .meta({ description: "主题作者用户名；匿名主题中可能为 null。" }),
    authorUserId: z
      .number()
      .optional()
      .meta({ description: "主题作者用户 ID；匿名主题当前返回 -1。" }),
    createTime: z.string().optional().meta({ description: "主题创建时间。" }),
    type: z
      .number()
      .optional()
      .meta({ description: "主题类型：0 为普通主题，1 为校园活动，2 为学术通知。" }),
    isAnonymous: z.boolean().optional().meta({ description: "主题是否匿名发布。" }),
    hotTopicType: z
      .number()
      .optional()
      .meta({ description: "热门主题来源类型；当前观察到 1 为自动热门、3 为人工推荐。" }),
  })
  .meta({ id: "HotTopic", description: "首页展示的热门主题摘要。" });
export type HotTopic = z.infer<typeof hotTopicSchema>;

export const indexColumnSchema = z
  .looseObject({
    id: z.number().optional().meta({ description: "首页栏目配置项 ID。" }),
    type: z.number().optional().meta({
      description:
        "首页栏目类型：1 为推荐阅读，2 为推荐功能，3 为校园新闻，4 为首页 Banner，7 为福利优惠。",
    }),
    title: z.string().optional().meta({ description: "展示标题；Banner 中用作图片的简短说明。" }),
    content: z
      .string()
      .nullable()
      .optional()
      .meta({ description: "展示内容或摘要，主要用于推荐阅读；不适用时可能为 null。" }),
    url: z.string().optional().meta({ description: "点击配置项后跳转的站内或站外地址。" }),
    imageUrl: z
      .string()
      .nullable()
      .optional()
      .meta({ description: "展示图片地址；不需要图片的栏目中可能为 null。" }),
    enable: z.boolean().optional().meta({ description: "配置项是否启用。" }),
    time: z.string().optional().meta({ description: "配置项相关时间，具体含义尚未确认。" }),
    orderWeight: z
      .number()
      .optional()
      .meta({ description: "排序权重；推荐阅读和推荐功能按较大的权重优先展示。" }),
    days: z
      .number()
      .optional()
      .meta({ description: "从保存时起计算的有效天数，主要用于 Banner 和福利优惠。" }),
    expiredTime: z
      .string()
      .nullable()
      .optional()
      .meta({ description: "配置项的过期时间；没有过期时间时可能为 null。" }),
    visibility: z
      .number()
      .optional()
      .meta({ description: "可见性：0 为全部可见，1 为仅登录用户可见，2 为仅未登录用户可见。" }),
  })
  .meta({
    id: "IndexColumn",
    description: "首页运营栏目配置项，由类型决定实际使用的字段。",
  });
export type IndexColumn = z.infer<typeof indexColumnSchema>;

export const mainpageAutoContentSchema = z
  .looseObject({
    id: z.number().optional().meta({ description: "首页自动聚合主题 ID。" }),
    boardId: z.number().optional().meta({ description: "主题所属版面 ID。" }),
    title: z.string().optional().meta({ description: "主题标题。" }),
    state: z
      .number()
      .optional()
      .meta({ description: "主题状态码：1 表示主题已锁定，其他取值含义尚未确认。" }),
    type: z
      .number()
      .optional()
      .meta({ description: "主题类型：0 为普通主题，1 为校园活动，2 为学术通知。" }),
    isInternalOnly: z.boolean().optional().meta({ description: "主题是否仅允许从校园内网访问。" }),
    isVote: z.boolean().optional().meta({ description: "主题是否为投票主题。" }),
  })
  .meta({ id: "MainpageAutoContent", description: "首页分类板块自动聚合的主题概要。" });
export type MainpageAutoContent = z.infer<typeof mainpageAutoContentSchema>;

export const displayTitleSchema = z
  .looseObject({
    id: z.number().meta({ description: "用户头衔 ID，对应用户资料中的 displayTitleId。" }),
    name: z.string().meta({ description: "用户头衔的展示名称。" }),
    type: z.number().meta({ description: "用户头衔分类编号，1、2、3 的具体含义尚未确认。" }),
    sortOrder: z.number().meta({ description: "用户头衔排序值。" }),
    iconUri: z.string().meta({ description: "用户头衔图标地址。" }),
  })
  .meta({ id: "DisplayTitle", description: "可授予用户并在个人资料中展示的头衔。" });
export type DisplayTitle = z.infer<typeof displayTitleSchema>;

export const indexSchema = z
  .looseObject({
    announcement: z.string().optional().meta({ description: "全站公告内容，使用 CC98 UBB 格式。" }),
    hotTopic: z
      .array(hotTopicSchema)
      .optional()
      .meta({ description: "服务端自动统计的今日热门主题。" }),
    manualHotTopic: z
      .array(hotTopicSchema)
      .optional()
      .meta({ description: "人工配置的热门推荐主题。" }),
    recommendationReading: z
      .array(indexColumnSchema)
      .optional()
      .meta({ description: "首页推荐阅读栏目。" }),
    recommendationFunction: z
      .array(indexColumnSchema)
      .optional()
      .meta({ description: "首页推荐功能入口。" }),
    specialOffer: z.array(indexColumnSchema).optional().meta({ description: "首页福利优惠栏目。" }),
    schoolNews: z.array(indexColumnSchema).optional().meta({ description: "首页校园新闻栏目。" }),
    schoolEvent: z
      .array(mainpageAutoContentSchema)
      .optional()
      .meta({ description: "首页校园活动主题。" }),
    academics: z
      .array(mainpageAutoContentSchema)
      .optional()
      .meta({ description: "首页学术通知主题。" }),
    study: z
      .array(mainpageAutoContentSchema)
      .optional()
      .meta({ description: "首页学习交流分类主题。" }),
    emotion: z
      .array(mainpageAutoContentSchema)
      .optional()
      .meta({ description: "首页情感交流分类主题。" }),
    fleaMarket: z
      .array(mainpageAutoContentSchema)
      .optional()
      .meta({ description: "首页跳蚤市场分类主题。" }),
    partTimeJob: z
      .array(mainpageAutoContentSchema)
      .optional()
      .meta({ description: "首页兼职招聘分类主题。" }),
    fullTimeJob: z
      .array(mainpageAutoContentSchema)
      .optional()
      .meta({ description: "首页全职招聘分类主题。" }),
    todayCount: z.number().optional().meta({ description: "论坛今日发帖数量。" }),
    todayTopicCount: z.number().optional().meta({ description: "论坛今日新主题数量。" }),
    topicCount: z.number().optional().meta({ description: "论坛主题总数。" }),
    postCount: z.number().optional().meta({ description: "论坛帖子总数。" }),
    userCount: z.number().optional().meta({ description: "论坛注册用户总数。" }),
    lastUserName: z.string().optional().meta({ description: "最新注册用户的用户名。" }),
    onlineUserCount: z.number().optional().meta({ description: "当前在线用户数量。" }),
    lastUpdateTime: z.string().optional().meta({ description: "首页聚合数据最近更新时间。" }),
  })
  .meta({
    id: "Index",
    description: "论坛首页聚合数据，包括公告、热门主题、运营栏目、分类主题和全站统计。",
  });
export type Index = z.infer<typeof indexSchema>;
