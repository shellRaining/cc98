export type UserPunishmentType = 1 | 2 | 3;
export type UserOperationType = 0 | 1;

export interface UserManagementOperationRequest {
  userId: number;
  punishmentType: UserPunishmentType;
  operationType: UserOperationType;
  reason: string;
  days?: number;
}

export interface DeleteUserContentRequest {
  userId: number;
  kind: "topic" | "post";
  days: number;
}

export function validateUserManagementOperation(
  request: UserManagementOperationRequest,
): string | null {
  if (!request.reason.trim()) return "请填写理由";
  if (request.operationType === 1 && request.punishmentType === 3) {
    const days = request.days;
    if (
      !Number.isInteger(days) ||
      days == null ||
      days < -1 ||
      days > 1000 ||
      (days < 7 && days > -1)
    ) {
      return "TP 天数只能是 -1，或 7 至 1000 之间的整数";
    }
  }
  return null;
}

export function validateUserContentDays(days: number): string | null {
  return Number.isInteger(days) && days >= 1 && days <= 365
    ? null
    : "天数必须是 1 至 365 之间的整数";
}
