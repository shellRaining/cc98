import type { CreateVoteInfo } from "@cc98/api";

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
