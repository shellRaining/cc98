<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useUserStore } from "../stores/user";
import { AccountLockedError, LoginError } from "../stores/user";
import UiButton from "../components/ui/Button.vue";
import { takeLoginRedirect } from "../lib/login-redirect";

const router = useRouter();
const user = useUserStore();

const loginName = ref("");
const loginPassword = ref("");
const submitting = ref(false);
const errorMsg = ref("");

async function handleLogin() {
  if (!loginName.value || !loginPassword.value) {
    errorMsg.value = "请输入用户名和密码";
    return;
  }
  submitting.value = true;
  errorMsg.value = "";
  try {
    await user.login(loginName.value, loginPassword.value);
    await router.replace(takeLoginRedirect("/"));
  } catch (err) {
    if (err instanceof AccountLockedError) {
      errorMsg.value = err.message;
    } else if (err instanceof LoginError) {
      errorMsg.value = err.message;
    } else {
      errorMsg.value = "登录失败，请稍后重试";
    }
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <section class="max-w-md mx-auto py-12 space-y-6">
    <h1 class="text-2xl font-bold text-center text-cc98-text">登录</h1>
    <form class="space-y-4" @submit.prevent="handleLogin">
      <div class="space-y-1">
        <label class="block text-sm text-cc98-text-muted" for="login-name">用户名</label>
        <input
          id="login-name"
          v-model="loginName"
          type="text"
          autocomplete="username"
          class="w-full cc98-input"
          :disabled="submitting"
        />
      </div>
      <div class="space-y-1">
        <label class="block text-sm text-cc98-text-muted" for="login-password">密码</label>
        <input
          id="login-password"
          v-model="loginPassword"
          type="password"
          autocomplete="current-password"
          class="w-full cc98-input"
          :disabled="submitting"
        />
      </div>
      <p v-if="errorMsg" class="text-sm text-cc98-error">{{ errorMsg }}</p>
      <UiButton type="submit" block size="sm" class="hover:opacity-90" :loading="submitting">
        {{ submitting ? "登录中…" : "登录" }}
      </UiButton>
    </form>
  </section>
</template>
