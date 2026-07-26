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
    id: z.number().meta({ description: "用户头衔 ID，对应用户资料中的 displayTitleId。" }),
    name: z.string().meta({ description: "用户头衔的展示名称。" }),
    type: z.number().meta({ description: "用户头衔分类编号，1、2、3 的具体含义尚未确认。" }),
    sortOrder: z.number().meta({ description: "用户头衔排序值。" }),
    iconUri: z.string().meta({ description: "用户头衔图标地址。" }),
  })
  .meta({ id: "DisplayTitle", description: "可授予用户并在个人资料中展示的头衔。" });
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
