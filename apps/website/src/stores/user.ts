import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { authState } from "../lib/http";

export interface AuthUser {
  id: number;
  name: string;
  avatarUrl: string | null;
  permission: string[];
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

export const useUserStore = defineStore(
  "user",
  () => {
    const user = ref<AuthUser | null>(loadUser());
    const hasToken = ref<boolean>(authState.load() !== null);

    const isLoggedIn = computed(() => hasToken.value && user.value !== null);

    function setUser(next: AuthUser | null) {
      user.value = next;
      if (next) {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(next));
      } else {
        localStorage.removeItem(USER_STORAGE_KEY);
      }
    }

    function setAuthed(next: AuthUser) {
      hasToken.value = true;
      setUser(next);
    }

    function logout() {
      authState.save(null);
      hasToken.value = false;
      setUser(null);
    }

    return { user, hasToken, isLoggedIn, setUser, setAuthed, logout };
  },
  {
    persist: {
      pick: ["hasToken"],
    },
  },
);
