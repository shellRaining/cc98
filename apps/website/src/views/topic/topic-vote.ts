import type { SubmitVoteRequest } from "@cc98/api";

export function calculateVotePercentage(count: number, participantCount: number): number {
  if (!Number.isFinite(count) || !Number.isFinite(participantCount) || participantCount <= 0) {
    return 0;
  }
  return Math.min(100, Math.max(0, (count / participantCount) * 100));
}

export function createVotePayload(
  selectedItems: number[],
  availableIds: number[],
  maxVoteCount: number,
): { payload?: SubmitVoteRequest; error?: string } {
  const uniqueItems = [...new Set(selectedItems)];
  if (uniqueItems.length === 0) return { error: "请至少选择一个投票选项" };
  if (maxVoteCount < 1 || uniqueItems.length > maxVoteCount) {
    return { error: `最多只能选择 ${Math.max(1, maxVoteCount)} 项` };
  }
  const allowed = new Set(availableIds);
  if (uniqueItems.some((id) => !allowed.has(id))) return { error: "投票选项已失效，请刷新后重试" };
  return { payload: { items: uniqueItems } };
}
