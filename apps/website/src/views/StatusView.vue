<script setup lang="ts">
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import FullPageStatus from "../components/FullPageStatus.vue";
import { type FullPageStatusKind } from "../components/full-page-status";
import { isSafeInternalPath, saveLoginRedirect } from "../lib/login-redirect";

const route = useRoute();
const router = useRouter();
const kind = computed(() => route.meta.statusKind as FullPageStatusKind);
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

function login() {
  saveLoginRedirect(sourcePath.value || "/");
  void router.push({ name: "logon" });
}
</script>

<template>
  <FullPageStatus :kind="kind" @login="login" @retry="retry" />
</template>
