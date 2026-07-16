<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import { useThemeStore } from "../stores/theme";
import AppHeader from "../components/AppHeader.vue";
import AppFooter from "../components/AppFooter.vue";
import MessageRealtimeController from "../components/MessageRealtimeController.vue";

const theme = useThemeStore();
const route = useRoute();
const isHome = computed(() => route.name === "home");
theme.apply();
</script>

<template>
  <div class="min-h-screen flex flex-col bg-cc98-background text-cc98-text">
    <AppHeader />
    <MessageRealtimeController />
    <main class="cc98-content flex-1" :class="isHome ? 'site-main--home' : 'site-main--inner'">
      <router-view />
    </main>
    <AppFooter />
  </div>
</template>
