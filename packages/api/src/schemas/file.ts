import { z } from "zod";

const multipartContentTypeSchema = z.literal("multipart/form-data").optional().meta({
  description:
    "兼容旧客户端随表单提交的内容类型字符串；当前客户端固定传入 `multipart/form-data`，服务端是否必需尚未确认。",
});

export const fileUploadRequestSchema = z
  .object({
    files: z
      .array(z.file().meta({ description: "需要上传的文件。" }))
      .min(1)
      .meta({ description: "一个或多个待上传文件；使用同名 `files` 字段重复提交。" }),
    contentType: multipartContentTypeSchema,
  })
  .meta({ id: "FileUploadRequest", description: "通用文件上传表单。" });
export type FileUploadRequest = z.infer<typeof fileUploadRequestSchema>;

export const portraitUploadRequestSchema = z
  .object({
    files: z.file().meta({ description: "需要上传的头像图片文件。" }),
    contentType: multipartContentTypeSchema,
  })
  .meta({ id: "PortraitUploadRequest", description: "头像图片上传表单。" });
export type PortraitUploadRequest = z.infer<typeof portraitUploadRequestSchema>;

export const fileUploadResponseSchema = z
  .array(z.string().min(1).meta({ description: "上传后可访问的文件地址。" }))
  .meta({
    id: "FileUploadResponse",
    description: "成功上传后返回的文件地址列表。单文件上传也使用数组包装。",
  });
export type FileUploadResponse = z.infer<typeof fileUploadResponseSchema>;
