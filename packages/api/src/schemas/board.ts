import { z } from "zod";

export const boardSchema = z
  .looseObject({
    id: z.number().optional(),
    name: z.string().optional(),
    description: z.string().nullable().optional(),
    topicCount: z.number().optional(),
    postCount: z.number().optional(),
    todayCount: z.number().optional(),
    boardMasters: z.array(z.string()).optional(),
    isUserCustomBoard: z.boolean().optional(),
    internalState: z.number().optional(),
    isLock: z.boolean().optional(),
    parentId: z.number().optional(),
    anonymousState: z.number().optional(),
    canEntry: z.boolean().optional(),
    canVote: z.boolean().optional(),
    bigPaper: z.string().nullable().optional(),
  })
  .meta({ id: "Board" });
export type Board = z.infer<typeof boardSchema>;

export const tagSchema = z
  .looseObject({
    id: z.number().optional(),
    name: z.string().optional(),
  })
  .meta({ id: "Tag" });
export type Tag = z.infer<typeof tagSchema>;

export const boardEventSchema = z
  .looseObject({
    id: z.number(),
    topicId: z.number(),
    boardId: z.number(),
    targetUserName: z.string().nullable(),
    operatorUserName: z.string(),
    content: z.string(),
    time: z.string(),
    ip: z.string(),
    isDeleted: z.boolean(),
    isAnonymous: z.boolean(),
  })
  .meta({ id: "BoardEvent" });
export type BoardEvent = z.infer<typeof boardEventSchema>;

export const boardGroupSchema = z
  .looseObject({
    id: z.number().optional(),
    name: z.string().optional(),
    order: z.number().optional(),
    masters: z.array(z.string()).optional(),
    boards: z.array(boardSchema).optional(),
  })
  .meta({ id: "BoardGroup" });
export type BoardGroup = z.infer<typeof boardGroupSchema>;

export const tagGroupSchema = z
  .object({
    layer: z.number().optional(),
    tags: z.array(tagSchema).optional(),
  })
  .meta({ id: "TagGroup" });
export type TagGroup = z.infer<typeof tagGroupSchema>;

export const boardTagDataSchema = z
  .looseObject({
    layers: z.number(),
    tags: z.array(z.unknown()),
  })
  .meta({ id: "BoardTagData" });
export type BoardTagData = z.infer<typeof boardTagDataSchema>;

export const boardMutedUserSchema = z
  .looseObject({
    userId: z.number(),
    userName: z.string(),
    expiredTime: z.string(),
    days: z.number(),
    operatorUserName: z.string(),
  })
  .meta({ id: "BoardMutedUser" });
export type BoardMutedUser = z.infer<typeof boardMutedUserSchema>;
