import type {
  CreateVoteInfo,
  Like,
  PostLikeAction,
  RatingReason,
  SubmitVoteRequest,
} from "@cc98/api";

export function nextLikeState(current: Like, action: PostLikeAction): Like {
  const target = Number(action) as 1 | 2;
  const previous = current.likeState ?? 0;
  const next = previous === target ? 0 : target;
  let likeCount = current.likeCount ?? 0;
  let dislikeCount = current.dislikeCount ?? 0;

  if (previous === 1) likeCount = Math.max(0, likeCount - 1);
  if (previous === 2) dislikeCount = Math.max(0, dislikeCount - 1);
  if (next === 1) likeCount += 1;
  if (next === 2) dislikeCount += 1;

  return { likeCount, dislikeCount, likeState: next };
}

export function availableRatingReasons(
  reasons: RatingReason[] | undefined,
  type: 1 | 2,
): RatingReason[] {
  return (reasons ?? []).filter((reason) => reason.enabled && reason.type === type);
}

export function validateCreateVote(vote: CreateVoteInfo): string | null {
  if (vote.expiredDays < 1 || vote.expiredDays > 1000) {
    return "投票有效天数须为 1 至 1000 天";
  }
  if (vote.voteItems.length < 2 || vote.voteItems.length > 20) {
    return "投票选项须为 2 至 20 项";
  }
  if (vote.voteItems.some((item) => !item.trim())) return "投票选项不能为空";
  if (vote.voteItems.some((item) => item.length > 50)) return "投票选项不能超过 50 字";
  if (vote.maxVoteCount < 1 || vote.maxVoteCount > vote.voteItems.length) {
    return "每人最多可选数量须在选项总数以内";
  }
  return null;
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

function escapeMarkdownLabel(value: string): string {
  return value
    .replace(/\r?\n/g, " ")
    .replaceAll("\\", "\\\\")
    .replaceAll("[", "\\[")
    .replaceAll("]", "\\]");
}

export function createAttachmentMarkdown(fileNames: string[], urls: string[]): string {
  if (fileNames.length !== urls.length) throw new Error("附件上传结果数量不一致");
  return fileNames
    .map((fileName, index) => `[${escapeMarkdownLabel(fileName)}](${urls[index]})`)
    .join("\n");
}

export function appendMarkdownBlock(content: string, block: string): string {
  if (!content) return block;
  if (content.endsWith("\n\n")) return `${content}${block}`;
  if (content.endsWith("\n")) return `${content}\n${block}`;
  return `${content}\n\n${block}`;
}
