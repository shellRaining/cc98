import { useMutation, useQueryClient } from "@tanstack/vue-query";
import { typedPost } from "../../lib/http";
import { queryKeys } from "../queries/index.ts";

export function postSignin() {
  return typedPost<unknown>("/me/signin", undefined, {
    headers: { "Content-Type": "application/json" },
  });
}

export function useSigninMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: postSignin,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.signinInfoRoot }),
        queryClient.invalidateQueries({ queryKey: queryKeys.signinMonthRoot }),
        queryClient.invalidateQueries({ queryKey: queryKeys.currentUser }),
      ]);
    },
  });
}
