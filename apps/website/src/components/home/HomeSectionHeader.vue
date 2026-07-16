<script setup lang="ts">
withDefaults(
  defineProps<{
    title: string;
    tone?: "primary" | "secondary";
  }>(),
  { tone: "primary" },
);
</script>

<template>
  <div class="home-section-heading" :class="`home-section-heading--${tone}`">
    <div class="home-section-heading__title">
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path
          d="M4 9v6h4l5 4V5L8 9H4Zm12.5 3a4.5 4.5 0 0 0-2.1-3.8v7.6a4.5 4.5 0 0 0 2.1-3.8Zm-2.1-8.4v2.1a7 7 0 0 1 0 12.6v2.1a9 9 0 0 0 0-16.8Z"
        />
      </svg>
      <h2>{{ title }}</h2>
    </div>
    <div class="home-section-heading__actions">
      <slot />
    </div>
  </div>
</template>
