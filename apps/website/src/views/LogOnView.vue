<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useUserStore } from "../stores/user";
import { AccountLockedError, LoginError } from "../stores/user";
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
          class="w-full rounded border border-cc98-border bg-cc98-bg px-3 py-2 text-cc98-text outline-none focus:border-cc98-primary"
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
          class="w-full rounded border border-cc98-border bg-cc98-bg px-3 py-2 text-cc98-text outline-none focus:border-cc98-primary"
          :disabled="submitting"
        />
      </div>
      <p v-if="errorMsg" class="text-sm text-red-500">{{ errorMsg }}</p>
      <button
        type="submit"
        class="w-full rounded bg-cc98-primary px-4 py-2 text-sm text-white hover:opacity-90 disabled:opacity-50"
        :disabled="submitting"
      >
        {{ submitting ? "登录中…" : "登录" }}
      </button>
    </form>
  </section>
</template>
