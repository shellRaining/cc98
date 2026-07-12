<script setup lang="ts">
import { useThemeStore } from "../stores/theme";
import AppHeader from "../components/AppHeader.vue";
import AppFooter from "../components/AppFooter.vue";
import MessageRealtimeController from "../components/MessageRealtimeController.vue";

const theme = useThemeStore();
theme.apply();
</script>

<template>
  <div class="min-h-screen flex flex-col bg-cc98-bg text-cc98-text">
    <AppHeader />
    <MessageRealtimeController />
    <main class="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
      <router-view />
    </main>
    <AppFooter />
  </div>
</template>
