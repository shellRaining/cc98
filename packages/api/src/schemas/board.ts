import { z } from "zod";

export const boardSchema = z
  .looseObject({
    id: z.number().optional().meta({ description: "版面 ID。" }),
    name: z.string().optional().meta({ description: "版面名称。" }),
    description: z
      .string()
      .nullable()
      .optional()
      .meta({ description: "版面简介；未配置时可能为 null。" }),
    logoUri: z
      .string()
      .nullable()
      .optional()
      .meta({ description: "版面图标地址；未配置独立图标时可能为 null。" }),
    topicCount: z.number().optional().meta({ description: "版面主题总数。" }),
    postCount: z.number().optional().meta({ description: "版面回复总数。" }),
    todayCount: z.number().optional().meta({ description: "版面今日回复数。" }),
    boardMasters: z.array(z.string()).optional().meta({ description: "版主用户名列表。" }),
    isUserCustomBoard: z
      .boolean()
      .optional()
      .meta({ description: "当前登录用户是否已关注该版面。" }),
    internalState: z
      .number()
      .optional()
      .meta({ description: "版面内网可见性状态码，具体枚举含义尚未确认。" }),
    isLock: z
      .boolean()
      .optional()
      .meta({ description: "旧版响应使用的版面锁定标记；当前响应通常使用 isLocked。" }),
    isLocked: z.boolean().optional().meta({ description: "版面是否已锁定。" }),
    parentId: z.number().optional().meta({ description: "父版面或所属版面分组 ID。" }),
    anonymousState: z.number().optional().meta({
      description:
        "匿名发帖模式：0 为不可匿名，1 为只能匿名，2、3 均允许在发主题时选择是否匿名；2 与 3 在回复场景中的具体差异尚未完全确认。",
    }),
    privacyState: z
      .number()
      .optional()
      .meta({ description: "版面隐私状态码，具体枚举含义尚未确认。" }),
    viewerFilterState: z
      .number()
      .optional()
      .meta({ description: "版面访问者筛选状态码，具体枚举含义尚未确认。" }),
    protectionLevel: z
      .number()
      .optional()
      .meta({ description: "版面保护等级，具体等级含义尚未确认。" }),
    rootId: z.number().optional().meta({ description: "版面所属根分区的 ID。" }),
    lastPostContent: z
      .string()
      .nullable()
      .optional()
      .meta({ description: "版面最新回复内容；没有可用内容时可能为 null。" }),
    allowPostOnly: z
      .number()
      .optional()
      .meta({ description: "版面发帖限制状态码；0 与 2 的具体权限差异尚未确认。" }),
    forbidRvpn: z.boolean().optional().meta({ description: "是否禁止通过 RVPN 访问版面。" }),
    canEntry: z.boolean().optional().meta({ description: "当前访问者是否可以进入版面。" }),
    canVote: z.boolean().optional().meta({ description: "当前访问者是否可以在版面发布投票主题。" }),
    bigPaper: z
      .string()
      .nullable()
      .optional()
      .meta({ description: "版面大字报内容，使用 CC98 UBB 格式；未配置时可能为 null。" }),
    topicAuthorPermissions: z.array(z.string()).optional().meta({
      description: "版面对主题作者开放的管理权限标识列表，具体取值尚未确认。",
    }),
    allowNotifyAllReplier: z
      .boolean()
      .optional()
      .meta({ description: "版面是否允许主题作者通知全部回复者。" }),
    showShareTip: z
      .boolean()
      .optional()
      .meta({ description: "是否展示版面分享提示，具体触发场景尚未确认。" }),
  })
  .meta({
    id: "Board",
    description:
      "CC98 版面信息。不同接口和登录状态可能只返回其中一部分字段，后端也可能增加未声明字段。",
  });
export type Board = z.infer<typeof boardSchema>;

export const boardSummarySchema = boardSchema
  .pick({
    id: true,
    name: true,
    description: true,
    topicCount: true,
    postCount: true,
    todayCount: true,
    boardMasters: true,
    anonymousState: true,
    showShareTip: true,
    canVote: true,
  })
  .meta({
    id: "BoardSummary",
    description: "版面导航中的版面概要，仅包含 /board/all 实际返回的字段。",
  });
export type BoardSummary = z.infer<typeof boardSummarySchema>;

export const tagSchema = z
  .looseObject({
    id: z.number().optional().meta({ description: "全局标签 ID。" }),
    name: z.string().optional().meta({ description: "全局标签名称。" }),
  })
  .meta({ id: "Tag", description: "可用于主题分类和筛选的全局标签。" });
export type Tag = z.infer<typeof tagSchema>;

export const boardEventSchema = z
  .looseObject({
    id: z.number().meta({ description: "版务记录 ID。" }),
    topicId: z.number().meta({ description: "版务操作关联的主题 ID。" }),
    boardId: z.number().meta({ description: "发生版务操作的版面 ID。" }),
    targetUserName: z
      .string()
      .nullable()
      .meta({ description: "版务操作对象的用户名；匿名或没有明确对象时可能为 null。" }),
    operatorUserName: z
      .string()
      .nullable()
      .meta({ description: "执行版务操作的用户名；部分系统记录可能为 null。" }),
    content: z.string().meta({ description: "版务操作内容或原因。" }),
    time: z.string().meta({ description: "版务操作发生时间。" }),
    ip: z.string().meta({ description: "版务操作来源 IP。" }),
    isDeleted: z.boolean().meta({ description: "关联内容是否已被删除。" }),
    isAnonymous: z.boolean().meta({ description: "关联内容或操作对象是否匿名。" }),
  })
  .meta({ id: "BoardEvent", description: "版面管理操作记录。" });
export type BoardEvent = z.infer<typeof boardEventSchema>;

export const boardEventPageSchema = z
  .looseObject({
    boardId: z.number().meta({ description: "所查询的版面 ID。" }),
    count: z.number().meta({ description: "符合条件的版务记录总数。" }),
    from: z.number().meta({ description: "本页记录的起始偏移量。" }),
    size: z.number().meta({ description: "本页请求的记录数。" }),
    boardEvents: z.array(boardEventSchema).meta({ description: "当前页的版务记录。" }),
  })
  .meta({ id: "BoardEventPage", description: "版面管理记录分页结果。" });
export type BoardEventPage = z.infer<typeof boardEventPageSchema>;

export const boardGroupSchema = z
  .looseObject({
    id: z.number().optional().meta({ description: "版面分组 ID。" }),
    name: z.string().optional().meta({ description: "版面分组名称。" }),
    order: z.number().optional().meta({ description: "版面分组的展示顺序。" }),
    masters: z.array(z.string()).optional().meta({ description: "分区主管用户名列表。" }),
    boards: z.array(boardSummarySchema).optional().meta({ description: "分组内的版面概要列表。" }),
  })
  .meta({ id: "BoardGroup", description: "论坛版面导航中的一级分组。" });
export type BoardGroup = z.infer<typeof boardGroupSchema>;

export const tagGroupSchema = z
  .object({
    layer: z.number().optional().meta({ description: "标签层级序号，从 1 开始。" }),
    tags: z.array(tagSchema).optional().meta({ description: "该层级可选的标签列表。" }),
  })
  .meta({ id: "TagGroup", description: "按层级拆分的版面标签组。" });
export type TagGroup = z.infer<typeof tagGroupSchema>;

export interface BoardTagNode {
  id: number;
  name: string;
  subTags: BoardTagNode[];
  [key: string]: unknown;
}

export const boardTagNodeSchema: z.ZodType<BoardTagNode> = z
  .lazy(() =>
    z.looseObject({
      id: z.number().meta({ description: "标签 ID。" }),
      name: z.string().meta({ description: "标签名称。" }),
      subTags: z
        .array(boardTagNodeSchema)
        .meta({ description: "下一层子标签；叶子标签为空数组。" }),
    }),
  )
  .meta({ id: "BoardTagNode", description: "版面标签树中的一个标签节点。" });

export const boardTagDataSchema = z
  .looseObject({
    layers: z
      .number()
      .meta({ description: "标签树层数：0 为无标签，1 为一层标签，2 为两层标签。" }),
    tags: z.array(boardTagNodeSchema).meta({ description: "版面的顶层标签节点。" }),
  })
  .meta({ id: "BoardTagData", description: "树状组织的版面标签配置。" });
export type BoardTagData = z.infer<typeof boardTagDataSchema>;

export const boardMutedUserSchema = z
  .looseObject({
    userId: z.number().meta({ description: "被版面禁言用户的 ID。" }),
    userName: z.string().meta({ description: "被版面禁言用户的用户名。" }),
    expiredTime: z.string().meta({ description: "版面禁言到期时间。" }),
    days: z.number().meta({ description: "本次版面禁言的天数。" }),
    operatorUserName: z.string().meta({ description: "执行版面禁言的用户名。" }),
  })
  .meta({ id: "BoardMutedUser", description: "版面禁言中的用户记录。" });
export type BoardMutedUser = z.infer<typeof boardMutedUserSchema>;
