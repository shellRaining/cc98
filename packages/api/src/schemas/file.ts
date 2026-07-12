import { z } from "zod";

export const fileUploadResponseSchema = z
  .array(z.string().min(1))
  .meta({ id: "FileUploadResponse" });
export type FileUploadResponse = z.infer<typeof fileUploadResponseSchema>;
