import { createApp } from "vue";
import { createPinia } from "pinia";
import piniaPluginPersistedstate from "pinia-plugin-persistedstate";
import VueVirtualScroller from "vue-virtual-scroller";
import "vue-virtual-scroller/dist/vue-virtual-scroller.css";

import App from "./App.vue";
import { router } from "./router";
import { createQueryClient, installQueryClient } from "./lib/query-client";
import { useThemeStore } from "./stores/theme";

import "virtual:uno.css";
import "./styles/global.css";
import "./styles/skins.css";

const app = createApp(App);
const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);

app.use(pinia);
app.use(router);
installQueryClient(app, createQueryClient());
app.use(VueVirtualScroller);

useThemeStore().apply();

app.mount("#app");
