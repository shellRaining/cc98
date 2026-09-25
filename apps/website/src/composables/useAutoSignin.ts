import { useQuery } from "@tanstack/vue-query";
import { useEventListener, useIntervalFn } from "@vueuse/core";
import { computed, ref, watch } from "vue";
import { useSigninMutation } from "../api/mutations";
import { signinInfoQuery } from "../api/queries";
import type { AuthScope } from "../api/queries/keys.ts";
import { createLogger } from "../lib/logger";
import { useAutoSigninStore } from "../stores/auto-signin";
import { useUserStore } from "../stores/user";

const autoSigninLogger = createLogger("auto-signin");
const beijingDate = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Shanghai",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function signinDay(timestamp: number): string {
  return beijingDate.format(timestamp);
}

// 开关开启、已登录、今日尚未签到且当前账号当天尚未尝试过时才触发。
export function shouldAutoSignin(params: {
  active: boolean;
  hasSignedInToday: boolean | undefined;
  scope: AuthScope;
  attemptedScope: AuthScope | null;
  day: string;
  attemptedDay: string | null;
  dataUpdatedAt: number;
}): boolean {
  const { active, hasSignedInToday, scope, attemptedScope, day, attemptedDay, dataUpdatedAt } =
    params;
  if (!active || hasSignedInToday !== false || signinDay(dataUpdatedAt) !== day) return false;
  return attemptedScope !== scope || attemptedDay !== day;
}

export function useAutoSignin(): void {
  const user = useUserStore();
  const settings = useAutoSigninStore();
  const signin = useSigninMutation();
  const attemptedScope = ref<AuthScope | null>(null);
  const attemptedDay = ref<string | null>(null);
  const day = ref(signinDay(Date.now()));

  const authScope = computed<AuthScope>(() => user.user?.id ?? "anonymous");
  const active = computed(() => user.isLoggedIn && settings.enabled);
  const infoQuery = useQuery(computed(() => signinInfoQuery(authScope.value, active.value)));

  function refreshDay() {
    const today = signinDay(Date.now());
    if (day.value === today) return;
    day.value = today;
    if (active.value) void infoQuery.refetch();
  }

  useIntervalFn(refreshDay, 60_000);
  useEventListener(document, "visibilitychange", () => {
    if (!document.hidden) refreshDay();
  });

  watch(
    [active, authScope, infoQuery.data, infoQuery.dataUpdatedAt, day] as const,
    ([isActive, scope, info, dataUpdatedAt, today]) => {
      if (
        !shouldAutoSignin({
          active: isActive,
          hasSignedInToday: info?.hasSignedInToday,
          scope,
          attemptedScope: attemptedScope.value,
          day: today,
          attemptedDay: attemptedDay.value,
          dataUpdatedAt,
        })
      ) {
        return;
      }
      attemptedScope.value = scope;
      attemptedDay.value = today;
      signin.mutate("", {
        onError: (err) => {
          // 失败后等待签到状态下次刷新，不在同一次请求结果上循环重试。
          autoSigninLogger.warn({ err }, "自动签到失败");
        },
      });
    },
    { immediate: true },
  );
}
