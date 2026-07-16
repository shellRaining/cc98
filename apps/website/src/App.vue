<script setup lang="ts">
import { useQuery } from "@tanstack/vue-query";
import { watch } from "vue";
import DefaultLayout from "./layouts/DefaultLayout.vue";
import { currentUserQuery } from "./api/queries";
import { useUserStore } from "./stores/user";
import { useThemeStore } from "./stores/theme";

const userStore = useUserStore();
const themeStore = useThemeStore();

// 登录后从服务端回填皮肤与日夜规则；未登录时 enabled 为 false，不触发请求
const { data: me } = useQuery({
  ...currentUserQuery,
  enabled: () => userStore.isLoggedIn,
});

watch(me, (next) => {
  if (next) themeStore.syncFromServer(next);
});
</script>

<template>
  <DefaultLayout />
</template>
