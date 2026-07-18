import { defineStore } from "pinia";
import { meUserSchema } from "@cc98/api";
import { computed, ref } from "vue";
import { loginWithPassword, clearAuth, hasValidAuth, onAuthLost } from "../lib/auth";
import { typedGet } from "../lib/http";

export interface AuthUser {
  id: number;
  name: string;
  avatarUrl: string | null;
  privilege: string;
}

export function isSiteAdministrator(privilege: string | null | undefined): boolean {
  return privilege === "管理员";
}

const USER_STORAGE_KEY = "cc98:user";

function loadUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

function persistUser(user: AuthUser | null): void {
  try {
    if (user) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_STORAGE_KEY);
    }
  } catch {
    // 存储不可用时静默降级
  }
}

function pickAvatar(me: { portraitUrl?: string | null; photourl?: string | null }): string | null {
  return me.portraitUrl ?? me.photourl ?? null;
}

export class AccountLockedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AccountLockedError";
  }
}

export class LoginError extends Error {
  readonly status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "LoginError";
    this.status = status;
  }
}

export const useUserStore = defineStore("user", () => {
  const user = ref<AuthUser | null>(loadUser());
  const hasToken = ref<boolean>(hasValidAuth());

  const isLoggedIn = computed(() => hasToken.value && user.value !== null);

  onAuthLost(() => {
    hasToken.value = false;
    user.value = null;
    persistUser(null);
  });

  function setUser(next: AuthUser | null) {
    user.value = next;
    persistUser(next);
  }

  async function login(username: string, password: string): Promise<void> {
    try {
      await loginWithPassword(username, password);
    } catch {
      throw new LoginError("登录失败，请检查用户名和密码");
    }
    hasToken.value = true;

    const raw = await typedGet<unknown>("/me");
    const me = meUserSchema.parse(raw);

    if (me.lockState === 1 || me.lockState === 2) {
      logout();
      throw new AccountLockedError("账号已锁定");
    }

    setUser({
      id: me.id,
      name: me.name,
      avatarUrl: pickAvatar(me),
      privilege: me.privilege ?? "",
    });
  }

  function logout(): void {
    clearAuth();
    hasToken.value = false;
    setUser(null);
    try {
      sessionStorage.clear();
    } catch {
      // 无 sessionStorage 环境静默
    }
  }

  return { user, hasToken, isLoggedIn, setUser, login, logout };
});
