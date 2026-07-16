import { makeUpSigninResultSchema } from "@cc98/api";
import { useMutation, useQueryClient } from "@tanstack/vue-query";
import { typedPost } from "../../lib/http";
import { queryKeys } from "../queries/index.ts";

export function postSignin(content = "") {
  return typedPost<unknown>("/me/signin", content, {
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

export function useMakeUpSigninMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const result = makeUpSigninResultSchema.parse(
        await typedPost<unknown>("/me/make-up-missed-signin"),
      );
      if ((result.errorCode ?? 0) !== 0) throw new Error(result.extra || "补签失败");
      return result;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.signinInfoRoot }),
        queryClient.invalidateQueries({ queryKey: queryKeys.signinMonthRoot }),
        queryClient.invalidateQueries({ queryKey: queryKeys.currentUser }),
      ]);
    },
  });
}
