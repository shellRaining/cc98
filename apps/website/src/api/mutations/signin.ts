import { useMutation, useQueryClient } from "@tanstack/vue-query";
import { typedPost } from "../../lib/http";
import { queryKeys } from "../queries/index.ts";

export function useSigninMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (content: string = "") => typedPost<unknown>("/me/signin", content),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.signinInfoRoot }),
        queryClient.invalidateQueries({ queryKey: queryKeys.signinMonthRoot }),
        queryClient.invalidateQueries({ queryKey: queryKeys.currentUser }),
      ]);
    },
  });
}
