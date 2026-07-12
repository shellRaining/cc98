import { fileUploadResponseSchema } from "@cc98/api";
import { useMutation } from "@tanstack/vue-query";
import { typedPostForm } from "../../lib/http";

interface UploadFilesVariables {
  files: File[];
  compressImage?: boolean;
}

async function uploadFiles({
  files,
  compressImage = true,
}: UploadFilesVariables): Promise<string[]> {
  const form = new FormData();
  form.append("contentType", "multipart/form-data");
  for (const file of files) form.append("files", file, file.name);
  const data = await typedPostForm<unknown>("/file", form, {
    query: { compressImage },
  });
  return fileUploadResponseSchema.parse(data);
}

export function useUploadFilesMutation() {
  return useMutation({
    retry: 0,
    mutationFn: uploadFiles,
  });
}
