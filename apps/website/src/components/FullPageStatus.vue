<script setup lang="ts">
import { useTitle } from "@vueuse/core";
import { computed } from "vue";
import { FULL_PAGE_STATUS_CONFIG, type FullPageStatusKind } from "../lib/full-page-status";

const props = defineProps<{
  kind: FullPageStatusKind;
  message?: string;
}>();

const emit = defineEmits<{
  login: [];
  retry: [];
}>();

const config = computed(() => FULL_PAGE_STATUS_CONFIG[props.kind]);
const resolvedMessage = computed(() => props.message || config.value.message);

useTitle(computed(() => config.value.documentTitle + " - CC98论坛"));
</script>

<template>
  <section class="status-page" :aria-labelledby="'status-page-title-' + kind">
    <div class="status-page__content">
      <img class="status-page__image" :src="config.image" :alt="config.imageAlt" />
      <h1 :id="'status-page-title-' + kind" class="status-page__title">{{ config.title }}</h1>
      <p class="status-page__message">{{ resolvedMessage }}</p>
      <div class="status-page__actions">
        <RouterLink v-if="config.showHome !== false" to="/">返回首页</RouterLink>
        <button v-if="config.showRetry" type="button" @click="emit('retry')">重新尝试</button>
        <button v-if="config.showLogin" type="button" @click="emit('login')">点我登录</button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.status-page {
  display: flex;
  min-height: 43rem;
  flex-direction: column;
  align-items: center;
  color: var(--cc98-color-text);
  font-family: SimHei, "Microsoft YaHei", sans-serif;
  font-size: 1.5rem;
  letter-spacing: 2px;
}

.status-page__content {
  display: flex;
  flex-direction: column;
  align-items: center;
  transform: translateY(8rem);
}

.status-page__image {
  width: 48rem;
  max-width: 100%;
  height: 27rem;
  margin-top: -5rem;
  object-fit: contain;
}

.status-page__title {
  width: 18rem;
  padding-bottom: 0.6rem;
  border-bottom: 1px solid currentcolor;
  margin: -7.5rem 0 0;
  font-size: 1.5rem;
  font-weight: 700;
  text-align: center;
}

.status-page__message {
  max-width: 38rem;
  margin: 0.6rem 0 0;
  font-size: 0.88rem;
  letter-spacing: 1px;
  text-align: center;
}

.status-page__actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.8rem;
  margin-top: 2.5rem;
}

.status-page__actions a,
.status-page__actions button {
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--cc98-color-text);
  cursor: pointer;
  font: inherit;
  font-size: 0.75rem;
  letter-spacing: 1px;
  text-decoration: underline;
}

.status-page__actions a:visited {
  color: var(--cc98-color-text);
}

@media (max-width: 800px) {
  .status-page {
    min-height: 36rem;
  }

  .status-page__content {
    transform: translateY(4rem);
  }

  .status-page__image {
    height: auto;
    margin-top: -2rem;
  }

  .status-page__title {
    margin-top: -5rem;
  }
}
</style>
