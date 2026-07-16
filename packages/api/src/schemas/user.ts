import { z } from "zod";

export const basicUserSchema = z
  .looseObject({
    id: z.number(),
    name: z.string(),
    portraitUrl: z.string().optional(),
  })
  .meta({ id: "BasicUser" });
export type BasicUser = z.infer<typeof basicUserSchema>;

export const changeUserRequestSchema = z
  .object({
    EmailAddress: z.string().nullable().optional(),
    Gender: z.number().optional(),
    Introduction: z.string().nullable().optional(),
    QQ: z.string().nullable().optional(),
    SignatureCode: z.string().nullable().optional(),
    Birthday: z.string().nullable().optional(),
    DisplayTitleId: z.number().optional(),
  })
  .meta({ id: "ChangeUserRequest" });
export type ChangeUserRequest = z.infer<typeof changeUserRequestSchema>;

export const themeSettingSchema = z
  .looseObject({
    enableDayNightSwitch: z.boolean().optional(),
    syncWithBrowserDayNightMode: z.boolean().optional(),
    dayStartTime: z.string().optional(),
    nightStartTime: z.string().optional(),
  })
  .meta({ id: "ThemeSetting" });
export type ThemeSetting = z.infer<typeof themeSettingSchema>;

export const userOperationRequestSchema = z
  .strictObject({
    PunishmentType: z.union([z.literal(1), z.literal(2), z.literal(3)]),
    OperationType: z.union([z.literal(0), z.literal(1)]),
    Days: z.number().optional(),
    Reason: z.string(),
  })
  .meta({ id: "UserOperationRequest" });
export type UserOperationRequest = z.infer<typeof userOperationRequestSchema>;

export const userModerationPostSchema = z
  .looseObject({
    boardId: z.number(),
    content: z.string(),
    floor: z.number(),
    ip: z.string(),
    time: z.string(),
    topicId: z.number(),
  })
  .meta({ id: "UserModerationPost" });
export type UserModerationPost = z.infer<typeof userModerationPostSchema>;

export const userModerationPostPageSchema = z
  .looseObject({
    postInfos: z.array(userModerationPostSchema),
    count: z.number(),
  })
  .meta({ id: "UserModerationPostPage" });
export type UserModerationPostPage = z.infer<typeof userModerationPostPageSchema>;

export const userSchema = basicUserSchema
  .and(
    z.looseObject({
      gender: z.number().optional(),
      birthday: z.string().nullable().optional(),
      photourl: z.string().nullable().optional(),
      introduction: z.string().nullable().optional(),
      signatureCode: z.string().nullable().optional(),
      emailAddress: z.string().nullable().optional(),
      qq: z.string().nullable().optional(),
      postCount: z.number().optional(),
      prestige: z.number().optional(),
      displayTitle: z.string().optional(),
      privilege: z.string(),
      registerTime: z.string().optional(),
      lastLogOnTime: z.string().optional(),
      customTitle: z.string().nullable().optional(),
      lockState: z.number(),
      popularity: z.number().optional(),
      userTitleIds: z.array(z.number()).optional(),
      displayTitleId: z.number().nullable().optional(),
      fanCount: z.number().optional(),
      wealth: z.number().optional(),
      customBoards: z.array(z.number()).optional(),
      followCount: z.number().optional(),
      isFollowing: z.boolean().optional(),
      theme: z.number().optional(),
      levelTitle: z.string().optional(),
      deleteCount: z.number().optional(),
      receivedLikeCount: z.number().optional(),
      topicViewMode: z.number().optional(),
      stopPostBoardCount: z.number().optional(),
      signInCardCount: z.number().optional(),
      browsingHistoryEnabled: z.boolean().optional(),
      themeSetting: themeSettingSchema.optional(),
    }),
  )
  .meta({ id: "User" });
export type User = z.infer<typeof userSchema>;

export const meUserSchema = userSchema
  .and(
    z.object({
      isVerified: z.boolean().optional(),
    }),
  )
  .meta({ id: "MeUser" });
export type MeUser = z.infer<typeof meUserSchema>;
