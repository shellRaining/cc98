<script setup lang="ts">
import { useTitle } from "@vueuse/core";
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useUserStore } from "../stores/user";
import { AccountLockedError, LoginError } from "../stores/user";
import { takeLoginRedirect } from "../lib/login-redirect";
import illustrationUrl from "../assets/login/illustration.png";
import welcomeUrl from "../assets/login/welcome.png";

useTitle("登录 - CC98 论坛");

const router = useRouter();
const user = useUserStore();

const loginName = ref("");
const loginPassword = ref("");
const submitting = ref(false);
const errorMsg = ref("");
const loginNameInput = ref<HTMLInputElement | null>(null);
const loginPasswordInput = ref<HTMLInputElement | null>(null);
let shakeTimer: ReturnType<typeof setTimeout> | undefined;

function focusWithShake(input: HTMLInputElement | null) {
  if (!input) return;
  if (shakeTimer) clearTimeout(shakeTimer);
  input.classList.remove("is-shaking");
  void input.offsetWidth;
  input.classList.add("is-shaking");
  input.focus();
  shakeTimer = setTimeout(() => input.classList.remove("is-shaking"), 500);
}

async function handleLogin() {
  if (!loginName.value) {
    errorMsg.value = "请输入用户名";
    focusWithShake(loginNameInput.value);
    return;
  }
  if (!loginPassword.value) {
    errorMsg.value = "请输入密码";
    focusWithShake(loginPasswordInput.value);
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
  <section class="login-page">
    <div class="login-announcement">
      <p>
        <strong>温馨提示：</strong><br />
        <span class="login-announcement__body">
          本论坛仅限校内交流使用，任何内容在未经允许的情况下禁止外传到公网。按照网络实名制的要求及学校和论坛的相关规定，本论坛账号禁止外借他人使用。违规用户将视情节轻重进行全站处罚。请全体用户共同珍惜和维护良好的讨论环境。
        </span>
      </p>
    </div>

    <div class="login-card">
      <div class="login-card__illustration">
        <img :src="illustrationUrl" alt="欢迎回家，等你好久了" />
      </div>

      <div class="login-card__panel">
        <img class="login-card__welcome" :src="welcomeUrl" alt="登录论坛" />
        <h1 class="sr-only">登录</h1>
        <form class="login-form" autocomplete="on" @submit.prevent="handleLogin">
          <label class="login-form__row" for="login-name">
            <span>用户名</span>
            <input
              id="login-name"
              ref="loginNameInput"
              v-model="loginName"
              name="username"
              type="text"
              autocomplete="username"
              :disabled="submitting"
              @input="errorMsg = ''"
            />
          </label>
          <label class="login-form__row" for="login-password">
            <span>密码</span>
            <input
              id="login-password"
              ref="loginPasswordInput"
              v-model="loginPassword"
              name="password"
              type="password"
              autocomplete="current-password"
              :disabled="submitting"
              @input="errorMsg = ''"
            />
          </label>
          <p class="login-form__message" aria-live="polite">
            {{ submitting ? "登录中" : errorMsg }}
          </p>
          <button type="submit" :disabled="submitting">
            {{ submitting ? "登录中…" : "登录账号" }}
          </button>
        </form>

        <p class="login-card__link">
          还没账号？我要
          <a href="https://account.cc98.org/" target="_blank" rel="noopener noreferrer">注册</a>
        </p>
        <p class="login-card__link">
          密码错误？我要
          <a href="https://account.cc98.org/" target="_blank" rel="noopener noreferrer">找回</a>
        </p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.login-page {
  --login-accent: var(--cc98-color-primary-fill);
  padding-bottom: 4.5rem;
  color: var(--cc98-color-text);
}

.login-announcement {
  width: 100%;
  border: 1px solid var(--cc98-color-border);
  background: var(--cc98-color-surface);
  font-size: 1rem;
  line-height: 1.65;
}

.login-announcement p {
  margin: 1.25rem;
}

.login-announcement__body {
  display: inline-block;
  padding-left: 2em;
}

.login-card {
  display: grid;
  grid-template-columns: minmax(0, 571px) minmax(0, 1fr);
  width: 100%;
  min-height: 567px;
  margin-top: 1.875rem;
  border: 1px solid var(--cc98-color-border);
  background: var(--cc98-color-surface);
}

.login-card__illustration {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 1.875rem;
}

.login-card__illustration img {
  width: min(511px, 100%);
  height: auto;
}

.login-card__panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 3.125rem;
}

.login-card__welcome {
  width: 123px;
  height: 26px;
  object-fit: contain;
}

:global(:root[data-theme="dark"] .login-card__welcome) {
  filter: brightness(0) invert(1);
  opacity: 0.82;
}

.login-form {
  display: flex;
  width: 400px;
  max-width: calc(100% - 2rem);
  flex-direction: column;
  align-items: flex-end;
}

.login-form__row {
  display: grid;
  width: 100%;
  grid-template-columns: 55px minmax(0, 320px);
  align-items: center;
  gap: 25px;
  margin-top: 1.875rem;
  font-size: 0.75rem;
}

.login-form__row input {
  width: 100%;
  height: 2.5rem;
  padding-inline: 0.625rem;
  border: 1px solid var(--cc98-color-border);
  border-radius: 5px;
  background: var(--cc98-color-surface);
  color: var(--cc98-color-text);
  font: inherit;
}

.login-form__row input:focus {
  border-color: var(--login-accent);
  outline: 2px solid color-mix(in srgb, var(--login-accent) 22%, transparent);
  outline-offset: 1px;
}

.login-form__row input:disabled {
  background: var(--cc98-color-surface-subtle);
}

.login-form__message {
  width: 320px;
  min-height: 2.5rem;
  margin: 0.5rem 0 0;
  color: var(--cc98-color-error);
  font-size: 0.75rem;
  line-height: 2.5rem;
  text-align: center;
}

.login-form button {
  width: 320px;
  height: 2.5rem;
  border: 0;
  border-radius: 5px;
  background: var(--login-accent);
  color: var(--cc98-color-on-primary);
  cursor: pointer;
  font: inherit;
}

.login-form button:hover:not(:disabled) {
  background: var(--cc98-color-primary-fill-hover);
}

.login-form button:active:not(:disabled) {
  filter: brightness(0.92);
}

.login-form button:disabled {
  cursor: wait;
  opacity: 0.7;
}

.login-card__link {
  width: 320px;
  margin: 1rem 0 0 80px;
  font-size: 0.75rem;
  text-align: center;
}

.login-card__link a,
.login-card__link a:visited {
  color: var(--login-accent);
}

@keyframes login-shake {
  from {
    transform: translateX(-5px);
  }

  to {
    transform: translateX(5px);
  }
}

.login-form__row input.is-shaking {
  animation: login-shake 50ms alternate 10;
}

@media (max-width: 900px) {
  .login-card {
    grid-template-columns: 1fr;
  }

  .login-card__illustration {
    display: none;
  }

  .login-card__panel {
    padding: 3rem 1rem;
  }
}
</style>
