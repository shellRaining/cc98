import { createApp } from "vue";
import { createPinia } from "pinia";
import piniaPluginPersistedstate from "pinia-plugin-persistedstate";
import { VueQueryPlugin } from "@tanstack/vue-query";
import VueVirtualScroller from "vue-virtual-scroller";
import "vue-virtual-scroller/dist/vue-virtual-scroller.css";

import App from "./App.vue";
import { router } from "./router";
import { createLogger, logErrorOnce } from "./lib/logger";
import { createQueryClient } from "./lib/query-client";
import { useThemeStore } from "./stores/theme";

import "virtual:uno.css";
import "./styles/global.css";
import "./styles/skins.css";

const app = createApp(App);
const pinia = createPinia();
const runtimeLogger = createLogger("runtime");
pinia.use(piniaPluginPersistedstate);

app.config.errorHandler = (error, instance, info) => {
  logErrorOnce(runtimeLogger, error, "Vue 运行时异常", {
    component: instance?.$options.name ?? null,
    info,
  });
};

router.onError((error, to, from) => {
  logErrorOnce(runtimeLogger, error, "路由异常", {
    from: from.fullPath,
    to: to.fullPath,
  });
});

window.addEventListener("error", (event) => {
  const error = event.error ?? new Error(event.message);
  logErrorOnce(runtimeLogger, error, "浏览器运行时异常", {
    filename: event.filename || null,
    line: event.lineno || null,
    column: event.colno || null,
  });
});

window.addEventListener("unhandledrejection", (event) => {
  logErrorOnce(runtimeLogger, event.reason, "未处理的 Promise 拒绝");
});

app.use(pinia);
app.use(router);
app.use(VueQueryPlugin, { queryClient: createQueryClient() });
app.use(VueVirtualScroller);

useThemeStore().apply();

app.mount("#app");
