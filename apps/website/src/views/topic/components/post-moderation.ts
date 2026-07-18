import type { PostModerationRequest } from "../../../api/mutations/moderation";

export function validatePostModerationRequest(request: PostModerationRequest): string | null {
  if (request.action === "unmute") {
    return request.userId ? null : "该楼层缺少用户信息，无法解除 TP";
  }
  if (!request.reason.trim()) return "请输入操作理由";
  if (request.action === "delete") return null;
  if (request.action === "mute") {
    return Number.isInteger(request.days) && (request.days ?? 0) > 0 ? null : "请输入有效天数";
  }
  return Number.isInteger(request.value) && (request.value ?? 0) > 0 ? null : "请输入大于 0 的整数";
}
