import { z } from "zod";

export const messageCountsSchema = z
  .looseObject({
    systemCount: z.number().int().nonnegative(),
    atCount: z.number().int().nonnegative(),
    replyCount: z.number().int().nonnegative(),
    messageCount: z.number().int().nonnegative(),
  })
  .meta({ id: "MessageCounts" });
export type MessageCounts = z.infer<typeof messageCountsSchema>;

export const privateMessageSchema = z
  .looseObject({
    id: z.number().optional(),
    senderId: z.number().optional(),
    receiverId: z.number().optional(),
    content: z.string().optional(),
    isRead: z.boolean().optional(),
    time: z.string().optional(),
  })
  .meta({ id: "PrivateMessage" });
export type PrivateMessage = z.infer<typeof privateMessageSchema>;

export const recentContactSchema = z
  .looseObject({
    userId: z.number(),
    senderId: z.number(),
    lastContent: z.string(),
    isRead: z.boolean(),
    time: z.string(),
  })
  .meta({ id: "RecentContact" });
export type RecentContact = z.infer<typeof recentContactSchema>;

export const sendMessageRequestSchema = z
  .strictObject({
    receiverId: z.number().int().positive(),
    content: z.string().trim().min(1),
  })
  .meta({ id: "SendMessageRequest" });
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
