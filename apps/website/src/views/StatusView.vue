<script setup lang="ts">
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import FullPageStatus from "../components/FullPageStatus.vue";
import { parseServiceStatusKind } from "../components/full-page-status";
import { isSafeInternalPath } from "../lib/login-redirect";

const route = useRoute();
const router = useRouter();
const kind = computed(() => {
  const value = parseServiceStatusKind(route.params.status);
  if (!value) throw new Error("无效的服务状态路由");
  return value;
});
const sourcePath = computed(() => {
  const value = route.query.from;
  return typeof value === "string" && isSafeInternalPath(value) ? value : "";
});

function retry() {
  if (sourcePath.value) {
    void router.replace(sourcePath.value);
    return;
  }
  window.location.reload();
}
</script>

<template>
  <FullPageStatus :kind="kind" @retry="retry" />
</template>
