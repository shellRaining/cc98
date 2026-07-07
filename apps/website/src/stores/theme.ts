import { defineStore } from "pinia";
import { ref } from "vue";

export type ThemeMode = "light" | "dark";
export type ThemeSeason = "default" | "spring" | "summer" | "autumn" | "winter";

const THEME_STORAGE_KEY = "cc98:theme";

interface StoredTheme {
  mode: ThemeMode;
  season: ThemeSeason;
}

function loadStored(): StoredTheme {
  const fallback: StoredTheme = { mode: "light", season: "default" };
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY);
    return raw ? ({ ...fallback, ...JSON.parse(raw) } as StoredTheme) : fallback;
  } catch {
    return fallback;
  }
}

function applyTheme(mode: ThemeMode, season: ThemeSeason) {
  const root = document.documentElement;
  root.dataset.theme = mode;
  root.dataset.themeSeason = season;
}

export const useThemeStore = defineStore(
  "theme",
  () => {
    const initial = loadStored();
    const mode = ref<ThemeMode>(initial.mode);
    const season = ref<ThemeSeason>(initial.season);

    function apply() {
      applyTheme(mode.value, season.value);
    }

    function setMode(next: ThemeMode) {
      mode.value = next;
      apply();
      localStorage.setItem(
        THEME_STORAGE_KEY,
        JSON.stringify({ mode: mode.value, season: season.value }),
      );
    }

    function setSeason(next: ThemeSeason) {
      season.value = next;
      apply();
      localStorage.setItem(
        THEME_STORAGE_KEY,
        JSON.stringify({ mode: mode.value, season: season.value }),
      );
    }

    function toggleMode() {
      setMode(mode.value === "light" ? "dark" : "light");
    }

    return { mode, season, apply, setMode, setSeason, toggleMode };
  },
  {
    persist: {
      pick: ["mode", "season"],
    },
  },
);
