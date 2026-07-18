import type { BatchTopicModerationRequest } from "../../../api/mutations/moderation";

export function validateBatchTopicModerationRequest(
  request: BatchTopicModerationRequest,
): string | null {
  if (request.topicIds.length === 0) return "请至少选择一个主题";
  if (!request.reason.trim()) return "请输入操作理由";
  if (request.action === "lock" && (!Number.isInteger(request.days) || (request.days ?? 0) <= 0)) {
    return "请选择有效天数";
  }
  return null;
}
