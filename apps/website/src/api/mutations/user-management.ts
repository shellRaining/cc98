import type { UserOperationRequest } from "@cc98/api";
import { useMutation, useQueryClient } from "@tanstack/vue-query";
import { typedDelete, typedPut } from "../../lib/http";
import { queryKeys } from "../queries";

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

export function manageUser(request: UserManagementOperationRequest) {
  const body: UserOperationRequest = {
    PunishmentType: request.punishmentType,
    OperationType: request.operationType,
    Reason: request.reason.trim(),
    ...(request.days != null ? { Days: request.days } : {}),
  };
  return typedPut<void>(`/user/${request.userId}/operation`, body);
}

export function deleteUserContent(request: DeleteUserContentRequest) {
  return typedDelete<number>(`/user/${request.userId}/${request.kind}`, {
    query: { days: request.days },
  });
}

export function useManageUserMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    retry: 0,
    mutationFn: manageUser,
    onSuccess: async (_data, request) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.usersByIdRoot(request.userId) });
    },
  });
}

export function useDeleteUserContentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    retry: 0,
    mutationFn: deleteUserContent,
    onSuccess: async (_data, request) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.usersByIdRoot(request.userId) }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.userModerationPostsRoot(request.userId),
        }),
      ]);
    },
  });
}
