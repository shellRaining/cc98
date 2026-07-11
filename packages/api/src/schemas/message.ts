import { z } from "zod";

export const messageCountsSchema = z
  .looseObject({
    systemCount: z.number().optional(),
    atCount: z.number().optional(),
    replyCount: z.number().optional(),
    messageCount: z.number().optional(),
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
    userId: z.number().optional(),
    lastContent: z.string().optional(),
    isRead: z.boolean().optional(),
  })
  .meta({ id: "RecentContact" });
export type RecentContact = z.infer<typeof recentContactSchema>;

export const sendMessageRequestSchema = z
  .looseObject({
    receiverId: z.number().optional(),
    userId: z.number().optional(),
    content: z.string().optional(),
  })
  .meta({ id: "SendMessageRequest" });
export type SendMessageRequest = z.infer<typeof sendMessageRequestSchema>;

export const notificationBaseSchema = z
  .looseObject({
    id: z.number().optional(),
    type: z.number().optional(),
    topicId: z.number().nullable().optional(),
    postId: z.number().nullable().optional(),
    time: z.string().optional(),
    isRead: z.boolean().optional(),
  })
  .meta({ id: "NotificationBase" });
export type NotificationBase = z.infer<typeof notificationBaseSchema>;

export const replyOrAtNotificationSchema = notificationBaseSchema
  .and(
    z.object({
      topicTitle: z.string().optional(),
      floor: z.number().optional(),
      userId: z.number().optional(),
      userName: z.string().optional(),
      boardId: z.number().optional(),
      boardName: z.string().optional(),
    }),
  )
  .meta({ id: "ReplyOrAtNotification" });
export type ReplyOrAtNotification = z.infer<typeof replyOrAtNotificationSchema>;

export const systemNotificationSchema = notificationBaseSchema
  .and(
    z.object({
      title: z.string().optional(),
      content: z.string().optional(),
      floor: z.number().optional(),
    }),
  )
  .meta({ id: "SystemNotification" });
export type SystemNotification = z.infer<typeof systemNotificationSchema>;
