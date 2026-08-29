import { z } from "zod";

export const basicUserSchema = z
  .looseObject({
    id: z.number().meta({ description: "用户 ID。" }),
    name: z.string().meta({ description: "用户名。" }),
    portraitUrl: z.string().optional().meta({ description: "用户头像地址。" }),
  })
  .meta({
    id: "BasicUser",
    description: "用于头像、用户名等场景的用户基础信息。后端可能增加未声明字段。",
  });
export type BasicUser = z.infer<typeof basicUserSchema>;

export const changeUserRequestSchema = z
  .object({
    EmailAddress: z
      .string()
      .nullable()
      .optional()
      .meta({ description: "新的邮箱地址；传入 null 表示清空。" }),
    Gender: z.number().optional().meta({ description: "新的性别编号。" }),
    Introduction: z
      .string()
      .nullable()
      .optional()
      .meta({ description: "新的个人简介；传入 null 表示清空。" }),
    QQ: z
      .string()
      .nullable()
      .optional()
      .meta({ description: "新的 QQ 号码；传入 null 表示清空。" }),
    SignatureCode: z
      .string()
      .nullable()
      .optional()
      .meta({ description: "新的个性签名，使用 CC98 UBB 格式；传入 null 表示清空。" }),
    Birthday: z
      .string()
      .nullable()
      .optional()
      .meta({ description: "新的生日字符串；传入 null 表示清空。" }),
    DisplayTitleId: z.number().optional().meta({ description: "新的展示头衔 ID。" }),
  })
  .meta({ id: "ChangeUserRequest", description: "修改当前用户公开资料时提交的字段。" });
export type ChangeUserRequest = z.infer<typeof changeUserRequestSchema>;

export const themeSettingSchema = z
  .looseObject({
    enableDayNightSwitch: z
      .boolean()
      .optional()
      .meta({ description: "是否启用按时间自动切换日间和夜间主题。" }),
    syncWithBrowserDayNightMode: z
      .boolean()
      .optional()
      .meta({ description: "是否跟随浏览器或操作系统的明暗模式。" }),
    dayStartTime: z.string().optional().meta({ description: "日间主题开始时间。" }),
    nightStartTime: z.string().optional().meta({ description: "夜间主题开始时间。" }),
  })
  .meta({ id: "ThemeSetting", description: "用户的日间与夜间主题切换设置。" });
export type ThemeSetting = z.infer<typeof themeSettingSchema>;

export const userPrivacySettingSchema = z
  .looseObject({
    birthdayPrivacyMode: z
      .number()
      .optional()
      .meta({ description: "生日信息的隐私模式编号，具体取值含义尚未确认。" }),
    qqIsProtected: z.boolean().optional().meta({ description: "QQ 是否受隐私设置保护。" }),
    emailAddressIsProtected: z
      .boolean()
      .optional()
      .meta({ description: "邮箱地址是否受隐私设置保护。" }),
  })
  .meta({ id: "UserPrivacySetting", description: "用户资料中的隐私设置。" });
export type UserPrivacySetting = z.infer<typeof userPrivacySettingSchema>;

export const userActivityPointSchema = z
  .looseObject({
    userId: z.number().optional().meta({ description: "活动分所属用户的 ID。" }),
    month: z.number().optional().meta({ description: "活动分统计月份，格式为 YYYYMM。" }),
    like: z
      .number()
      .optional()
      .meta({ description: "点赞相关的活动分计数，具体计分规则尚未确认。" }),
    topic: z.number().optional().meta({ description: "发表主题相关的活动分计数。" }),
    post: z.number().optional().meta({ description: "发表回复相关的活动分计数。" }),
    rate: z.number().optional().meta({ description: "评分相关的活动分计数。" }),
    bonus: z.number().optional().meta({ description: "额外活动分。" }),
    rawPoint: z.number().optional().meta({ description: "未经历史分和系数调整的活动分。" }),
    historyPoint: z.number().optional().meta({ description: "历史活动分。" }),
    coefficient: z.number().optional().meta({ description: "活动分计算系数。" }),
    point: z.number().optional().meta({ description: "最终活动分。" }),
  })
  .meta({
    id: "UserActivityPoint",
    description: "用户月度活动分明细；原项目未使用该对象，具体计分规则尚未确认。",
  });
export type UserActivityPoint = z.infer<typeof userActivityPointSchema>;

export const userOperationRequestSchema = z
  .strictObject({
    PunishmentType: z
      .union([z.literal(1), z.literal(2), z.literal(3)])
      .meta({ description: "处罚类型：1 为锁定，2 为屏蔽，3 为全站 TP。" }),
    OperationType: z
      .union([z.literal(0), z.literal(1)])
      .meta({ description: "操作类型：0 为解除处罚，1 为执行处罚。" }),
    Days: z
      .number()
      .optional()
      .meta({ description: "处罚天数；-1 表示永久，全站 TP 的旧管理页面限制为 7 至 1000 天。" }),
    Reason: z.string().meta({ description: "执行或解除处罚的理由。" }),
  })
  .meta({ id: "UserOperationRequest", description: "管理员执行或解除用户处罚的请求。" });
export type UserOperationRequest = z.infer<typeof userOperationRequestSchema>;

export const userModerationPostSchema = z
  .looseObject({
    boardId: z.number().meta({ description: "回复所属版面 ID。" }),
    content: z.string().meta({ description: "回复正文。" }),
    floor: z.number().meta({ description: "回复楼层；原管理页面以 -1 表示主题正文。" }),
    ip: z.string().meta({ description: "发布回复时记录的 IP 地址。" }),
    time: z.string().meta({ description: "回复发布时间。" }),
    topicId: z.number().meta({ description: "回复所属主题 ID。" }),
  })
  .meta({ id: "UserModerationPost", description: "用户管理页面展示的单条近期发言。" });
export type UserModerationPost = z.infer<typeof userModerationPostSchema>;

export const userModerationPostPageSchema = z
  .looseObject({
    postInfos: z.array(userModerationPostSchema).meta({ description: "本页近期发言列表。" }),
    count: z.number().meta({ description: "符合时间范围的发言总数。" }),
  })
  .meta({ id: "UserModerationPostPage", description: "用户近期发言的管理查询结果。" });
export type UserModerationPostPage = z.infer<typeof userModerationPostPageSchema>;

export const boardMasterTitleSchema = z
  .looseObject({
    userId: z.number().meta({ description: "拥有该版主头衔的用户 ID。" }),
    userName: z.string().meta({ description: "拥有该版主头衔的用户名。" }),
    boardId: z.number().meta({ description: "对应版面 ID。" }),
    boardName: z.string().meta({ description: "对应版面名称。" }),
    title: z.string().meta({ description: "版主头衔的展示名称。" }),
    boardMasterLevel: z
      .number()
      .meta({ description: "版主级别编号；原项目仅对值 10 使用特殊展示，其他取值含义尚未确认。" }),
  })
  .meta({ id: "BoardMasterTitle", description: "用户在某个版面的版主头衔。" });
export type BoardMasterTitle = z.infer<typeof boardMasterTitleSchema>;

const userDetailsSchema = z.looseObject({
  gender: z.number().optional().meta({ description: "性别编号；原项目使用 1 表示男，0 表示女。" }),
  birthday: z
    .string()
    .nullable()
    .optional()
    .meta({ description: "生日；未填写或因隐私设置不可见时可能为 null。" }),
  photourl: z
    .string()
    .nullable()
    .optional()
    .meta({ description: "旧版个人资料图片地址；当前响应中未观察到该字段。" }),
  introduction: z
    .string()
    .nullable()
    .optional()
    .meta({ description: "个人简介；未填写时可能为 null。" }),
  signatureCode: z
    .string()
    .nullable()
    .optional()
    .meta({ description: "个性签名，使用 CC98 UBB 格式；未设置时可能为 null。" }),
  emailAddress: z
    .string()
    .nullable()
    .optional()
    .meta({ description: "邮箱地址；未填写或因隐私设置不可见时可能为 null。" }),
  qq: z
    .string()
    .nullable()
    .optional()
    .meta({ description: "QQ 号码；未填写或因隐私设置不可见时可能为 null。" }),
  postCount: z.number().optional().meta({ description: "用户发表的主题和回复数量。" }),
  prestige: z.number().optional().meta({ description: "用户威望值。" }),
  displayTitle: z
    .string()
    .optional()
    .meta({ description: "旧版接口中的展示用户组；当前响应中未观察到该字段。" }),
  privilege: z.string().optional().meta({ description: "用户的全站权限或用户组名称。" }),
  groupName: z.string().optional().meta({ description: "用户组展示名称。" }),
  registerTime: z.string().optional().meta({ description: "账号注册时间。" }),
  lastLogOnTime: z.string().optional().meta({ description: "账号最后登录时间。" }),
  customTitle: z
    .string()
    .nullable()
    .optional()
    .meta({ description: "旧版自定义头衔；当前响应中未观察到该字段。" }),
  lockState: z
    .union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)])
    .optional()
    .meta({ description: "账号状态：0 为正常，1 为锁定，2 为屏蔽，3 为全站 TP。" }),
  popularity: z.number().optional().meta({ description: "用户风评值。" }),
  userTitleIds: z.array(z.number()).optional().meta({ description: "用户拥有的头衔 ID 列表。" }),
  boardMasterTitles: z
    .array(boardMasterTitleSchema)
    .optional()
    .meta({ description: "用户拥有的版主头衔列表。" }),
  displayTitleId: z
    .number()
    .nullable()
    .optional()
    .meta({ description: "当前展示的用户头衔 ID；未选择时可能为 null。" }),
  fanCount: z.number().optional().meta({ description: "关注该用户的人数。" }),
  wealth: z.number().optional().meta({ description: "用户财富值。" }),
  customBoards: z.array(z.number()).optional().meta({ description: "用户关注的版面 ID 列表。" }),
  followCount: z.number().optional().meta({ description: "该用户关注的用户数量。" }),
  isFollowing: z.boolean().optional().meta({ description: "当前登录用户是否关注了该用户。" }),
  theme: z.number().optional().meta({ description: "用户选择的论坛主题编号。" }),
  levelTitle: z.string().optional().meta({ description: "旧版用户等级名称；原项目已标记为废弃。" }),
  deleteCount: z.number().optional().meta({ description: "用户内容被删除的计数。" }),
  receivedLikeCount: z.number().optional().meta({ description: "用户收到的点赞总数。" }),
  topicViewMode: z
    .number()
    .optional()
    .meta({ description: "主题浏览模式编号，具体取值含义尚未确认。" }),
  stopPostBoardCount: z.number().optional().meta({ description: "当前禁止该用户发言的版面数量。" }),
  signInCardCount: z.number().optional().meta({ description: "用户持有的补签卡数量。" }),
  browsingHistoryEnabled: z.boolean().optional().meta({ description: "是否启用浏览历史记录。" }),
  themeSetting: themeSettingSchema.optional().meta({ description: "用户的明暗主题切换设置。" }),
  isVerified: z.boolean().optional().meta({ description: "用户是否已经完成账号认证。" }),
  lastIpAddress: z
    .string()
    .nullable()
    .optional()
    .meta({ description: "最后登录 IP 地址；不可见或没有记录时可能为 null。" }),
  phoneNumber: z
    .string()
    .nullable()
    .optional()
    .meta({ description: "绑定的手机号码；未绑定或不可见时可能为 null。" }),
  hasPhoneNumber: z.boolean().optional().meta({ description: "用户是否已绑定手机号码。" }),
  isSUser: z
    .number()
    .optional()
    .meta({ description: "SUser 状态编号；原项目未使用，具体含义尚未确认。" }),
  targetWindow: z
    .number()
    .optional()
    .meta({ description: "目标窗口设置编号；原项目未使用，具体含义尚未确认。" }),
  activityPoint: userActivityPointSchema
    .nullable()
    .optional()
    .meta({ description: "用户活动分明细；没有可用数据时可能为 null。" }),
  rateState: z
    .number()
    .optional()
    .meta({ description: "评分状态编号；原项目未使用，具体含义尚未确认。" }),
  isFreshMan: z.boolean().optional().meta({ description: "用户是否为新生用户。" }),
  watermarkId: z
    .string()
    .nullable()
    .optional()
    .meta({ description: "用户水印标识；未设置时可能为 null。" }),
  allowWechatNotify: z
    .number()
    .optional()
    .meta({ description: "微信通知设置编号，具体取值含义尚未确认。" }),
  privacySetting: userPrivacySettingSchema.optional().meta({ description: "用户资料隐私设置。" }),
});

export const userSchema = basicUserSchema.and(userDetailsSchema).meta({
  id: "User",
  description: "用户详细资料。后端可能省略字段、返回 null，或增加未声明字段。",
});
export type User = z.infer<typeof userSchema>;

export const meUserSchema = basicUserSchema
  .and(userDetailsSchema)
  .meta({ id: "MeUser", description: "当前登录用户的详细资料。" });
export type MeUser = z.infer<typeof meUserSchema>;
