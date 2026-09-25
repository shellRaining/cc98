import { defineStore } from "pinia";
import { ref } from "vue";

// 自动签到偏好：默认开启，登录后访问论坛时静默完成当日签到。
export const useAutoSigninStore = defineStore(
  "auto-signin",
  () => {
    const enabled = ref(true);
    return { enabled };
  },
  {
    persist: {
      pick: ["enabled"],
    },
  },
);
