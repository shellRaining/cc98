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
    id: z.number(),
    floor: z.number().int().positive(),
    userId: z.number(),
    userName: z.string(),
    isDeleted: z.boolean(),
    boardId: z.number(),
  })
  .meta({ id: "NotificationPostBasicInfo" });
export type NotificationPostBasicInfo = z.infer<typeof notificationPostBasicInfoSchema>;

export const notificationBaseSchema = z
  .looseObject({
    id: z.number(),
    type: z.number(),
    topicId: z.number().nullable(),
    postId: z.number().nullable(),
    time: z.string(),
    isRead: z.boolean(),
    postBasicInfo: notificationPostBasicInfoSchema.nullable(),
  })
  .meta({ id: "NotificationBase" });
export type NotificationBase = z.infer<typeof notificationBaseSchema>;

export const replyOrAtNotificationSchema = notificationBaseSchema
  .and(
    z.looseObject({
      boardId: z.number().optional(),
    }),
  )
  .meta({ id: "ReplyOrAtNotification" });
export type ReplyOrAtNotification = z.infer<typeof replyOrAtNotificationSchema>;

export const systemNotificationSchema = notificationBaseSchema
  .and(
    z.looseObject({
      title: z.string(),
      content: z.string(),
    }),
  )
  .meta({ id: "SystemNotification" });
export type SystemNotification = z.infer<typeof systemNotificationSchema>;
