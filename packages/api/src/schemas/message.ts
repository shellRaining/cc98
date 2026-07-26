import { z } from "zod";

export const messageCountsSchema = z
  .looseObject({
    systemCount: z.number().int().nonnegative().meta({ description: "系统通知数量。" }),
    atCount: z.number().int().nonnegative().meta({ description: "@ 提及通知数量。" }),
    replyCount: z.number().int().nonnegative().meta({ description: "回复通知数量。" }),
    messageCount: z.number().int().nonnegative().meta({ description: "私信数量。" }),
  })
  .meta({ id: "MessageCounts", description: "当前用户各类消息和通知的数量。" });
export type MessageCounts = z.infer<typeof messageCountsSchema>;

export const privateMessageSchema = z
  .looseObject({
    id: z.number().optional().meta({ description: "私信 ID。" }),
    senderId: z.number().optional().meta({ description: "发信用户 ID。" }),
    receiverId: z.number().optional().meta({ description: "收信用户 ID。" }),
    content: z.string().optional().meta({ description: "私信正文。" }),
    isRead: z.boolean().optional().meta({ description: "收信用户是否已读。" }),
    time: z.string().optional().meta({ description: "私信发送时间。" }),
  })
  .meta({ id: "PrivateMessage", description: "两个用户之间的一条私信。" });
export type PrivateMessage = z.infer<typeof privateMessageSchema>;

export const recentContactSchema = z
  .looseObject({
    userId: z.number().meta({ description: "最近联系人用户 ID。" }),
    senderId: z.number().meta({ description: "最近一条私信的发送者 ID。" }),
    lastContent: z.string().meta({ description: "与该联系人的最近一条私信正文。" }),
    isRead: z.boolean().meta({ description: "最近一条收到的私信是否已读。" }),
    time: z.string().meta({ description: "最近一条私信的发送时间。" }),
  })
  .meta({ id: "RecentContact", description: "最近私信联系人及会话摘要。" });
export type RecentContact = z.infer<typeof recentContactSchema>;

export const sendMessageRequestSchema = z
  .strictObject({
    receiverId: z.number().int().positive().meta({ description: "收信用户 ID。" }),
    content: z.string().trim().min(1).meta({ description: "私信正文。" }),
  })
  .meta({ id: "SendMessageRequest", description: "发送私信的请求。" });
export type SendMessageRequest = z.infer<typeof sendMessageRequestSchema>;

export const notificationPostBasicInfoSchema = z
  .looseObject({
    id: z.number().meta({ description: "触发通知的帖子 ID，与通知的 postId 对应。" }),
    floor: z.number().int().positive().meta({ description: "该帖子在主题中的楼层号。" }),
    userId: z.number().meta({ description: "发布该帖的用户 ID。" }),
    userName: z.string().meta({ description: "发布该帖的用户名。" }),
    isDeleted: z.boolean().meta({ description: "关联帖子是否已被删除。" }),
    boardId: z.number().meta({ description: "关联帖子所在的版面 ID。" }),
  })
  .meta({ id: "NotificationPostBasicInfo", description: "通知关联帖子的基础信息。" });
export type NotificationPostBasicInfo = z.infer<typeof notificationPostBasicInfoSchema>;

export const notificationBaseSchema = z
  .looseObject({
    id: z.number().meta({ description: "通知 ID。" }),
    type: z.number().meta({
      description:
        "通知类型编号：0 为全站系统通知，1 为个人系统通知，2 为回复通知；其他取值含义尚未确认。",
    }),
    topicId: z.number().nullable().meta({ description: "关联主题 ID；不关联主题时为 null。" }),
    postId: z.number().nullable().meta({ description: "关联帖子 ID；不关联具体帖子时为 null。" }),
    time: z.string().meta({ description: "通知产生时间。" }),
    isRead: z.boolean().meta({ description: "当前用户是否已读该通知。" }),
    postBasicInfo: notificationPostBasicInfoSchema
      .nullable()
      .meta({ description: "关联帖子的基础信息；不关联具体帖子时为 null。" }),
  })
  .meta({ id: "NotificationBase", description: "各类通知共有的字段。" });
export type NotificationBase = z.infer<typeof notificationBaseSchema>;

export const replyOrAtNotificationSchema = notificationBaseSchema
  .and(
    z.looseObject({
      boardId: z.number().optional().meta({
        description:
          "通知记录携带的版面 ID；字段可能省略，关联帖子所在版面以 postBasicInfo.boardId 为准。",
      }),
    }),
  )
  .meta({ id: "ReplyOrAtNotification", description: "回复或 @ 提及通知。" });
export type ReplyOrAtNotification = z.infer<typeof replyOrAtNotificationSchema>;

export const systemNotificationSchema = notificationBaseSchema
  .and(
    z.looseObject({
      title: z.string().meta({ description: "系统通知标题。" }),
      content: z.string().meta({ description: "系统通知正文，使用 CC98 UBB 格式。" }),
    }),
  )
  .meta({ id: "SystemNotification", description: "论坛发送给当前用户的系统通知。" });
export type SystemNotification = z.infer<typeof systemNotificationSchema>;
