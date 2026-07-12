<script setup lang="ts">
import { onBeforeUnmount, watch } from "vue";
import { useQueryClient } from "@tanstack/vue-query";
import { MessageRealtimeService } from "../lib/message-realtime";
import { useUserStore } from "../stores/user";

const user = useUserStore();
const queryClient = useQueryClient();
const realtime = new MessageRealtimeService(queryClient);

watch(
  () => user.isLoggedIn,
  (isLoggedIn) => {
    if (isLoggedIn) {
      void realtime.start();
      return;
    }
    void realtime.stop();
    queryClient.removeQueries({ queryKey: ["messages"] });
    queryClient.removeQueries({ queryKey: ["signin"] });
  },
  { immediate: true },
);

onBeforeUnmount(() => realtime.dispose());
</script>

<template />
