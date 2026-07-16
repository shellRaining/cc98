import { useUserStore } from "./user";
import {
  legacyThemeToSkin,
  skinToLegacyTheme,
  resolveAutoMode,
  type SkinId,
  type ThemeMode,
  type ThemeStyle,
} from "./skins";
import type { MeUser, ThemeSetting } from "@cc98/api";
import { defineStore } from "pinia";
import { computed, ref, watch } from "vue";
import { typedPut } from "../lib/http";
import { createLogger } from "../lib/logger";

const themeLogger = createLogger("theme");

/** 已落地的默认风格，style 维度后续阶段再开放切换 UI */
const DEFAULT_STYLE: ThemeStyle = "solid";

/**
 * 主题 Store：mode + skin + style 三维正交。
 *
 * mode 是用户手动选择的明暗；当 ThemeSetting 开启日夜自动切换时，
 * {@link effectiveMode} 会按规则（浏览器 prefers-color-scheme 或时间段）覆盖手动 mode。
 * skin 对应老论坛皮肤编号，配对皮肤的亮暗由 mode 决定。style 首发固定 solid。
 */
export const useThemeStore = defineStore(
  "theme",
  () => {
    const mode = ref<ThemeMode>("light");
    const skin = ref<SkinId>("default");
    const style = ref<ThemeStyle>(DEFAULT_STYLE);
    const dayNight = ref<ThemeSetting | null>(null);

    // 浏览器 prefers-color-scheme 的实时状态，null 表示浏览器不支持
    const browserDark = ref<boolean | null>(null);
    // 时间段模式下的分钟级心跳，触发 effectiveMode 重算
    const clockTick = ref(0);

    /**
     * 实际生效的明暗。日夜规则开启时优先按规则推断，否则用用户手动 mode。
     */
    const effectiveMode = computed<ThemeMode>(() => {
      void clockTick.value;
      return resolveAutoMode(dayNight.value, browserDark.value) ?? mode.value;
    });

    /** 当前是否处于日夜自动切换 */
    const isAutoMode = computed(() => dayNight.value?.enableDayNightSwitch === true);

    function apply() {
      if (typeof document === "undefined") return;
      const root = document.documentElement;
      root.dataset.theme = effectiveMode.value;
      root.dataset.skin = skin.value;
      root.dataset.style = style.value;
    }

    // 任意影响 DOM 的维度变化都重新写入根节点属性
    watch([effectiveMode, skin, style], apply);

    /**
     * 启动日夜切换的运行时监听：浏览器 prefers-color-scheme 变化 + 时间段心跳。
     * 只在浏览器环境注册一次。
     */
    function startDayNightWatcher() {
      if (typeof window === "undefined") return;

      if (window.matchMedia) {
        const mql = window.matchMedia("(prefers-color-scheme: dark)");
        browserDark.value = mql.matches;
        mql.addEventListener("change", (e) => {
          browserDark.value = e.matches;
        });
      }

      // 时间段模式每分钟重新判定一次，接近整点切换的误差可接受
      window.setInterval(() => {
        clockTick.value = (clockTick.value + 1) % 1_000_000;
      }, 60_000);
    }

    startDayNightWatcher();

    /**
     * 从服务端用户资料回填主题偏好（登录或刷新后调用）。
     * 服务端的皮肤编号是权威来源：配对皮肤的编号带出 mode，非配对皮肤只覆盖 skin。
     * 不触发写回，避免读写循环。
     */
    function syncFromServer(me: Pick<MeUser, "theme" | "themeSetting">) {
      if (typeof me.theme === "number") {
        const { skin: nextSkin, mode: nextMode } = legacyThemeToSkin(me.theme);
        skin.value = nextSkin;
        if (nextMode) mode.value = nextMode;
      }
      if (me.themeSetting) {
        dayNight.value = me.themeSetting;
      }
      apply();
    }

    /** 把当前 skin + 生效 mode 写回服务端 PUT /me/theme。 */
    async function persistSkinToServer() {
      const userStore = useUserStore();
      if (!userStore.isLoggedIn) return;
      const id = skinToLegacyTheme(skin.value, effectiveMode.value);
      try {
        await typedPut("/me/theme", undefined, { query: { id } });
      } catch (err) {
        themeLogger.warn({ err, id }, "写回皮肤编号失败");
        throw err;
      }
    }

    async function setSkin(next: SkinId) {
      const previous = skin.value;
      skin.value = next;
      apply();
      try {
        await persistSkinToServer();
      } catch (error) {
        skin.value = previous;
        apply();
        throw error;
      }
    }

    async function setMode(next: ThemeMode) {
      const previous = mode.value;
      mode.value = next;
      apply();
      // 配对皮肤的编号随 mode 变化，需要同步服务端；非配对皮肤编号不变
      if (skinToLegacyTheme(skin.value, "light") !== skinToLegacyTheme(skin.value, "dark")) {
        try {
          await persistSkinToServer();
        } catch (error) {
          mode.value = previous;
          apply();
          throw error;
        }
      }
    }

    function toggleMode() {
      void setMode(mode.value === "light" ? "dark" : "light");
    }

    /**
     * 更新日夜切换规则并写回 PUT /me/theme-setting。
     */
    async function setDayNightSetting(next: ThemeSetting) {
      const previous = dayNight.value;
      dayNight.value = next;
      apply();
      const userStore = useUserStore();
      if (!userStore.isLoggedIn) return;
      try {
        await typedPut("/me/theme-setting", next);
      } catch (err) {
        themeLogger.warn({ err }, "写回日夜规则失败");
        dayNight.value = previous;
        apply();
        throw err;
      }
    }

    return {
      mode,
      skin,
      style,
      dayNight,
      effectiveMode,
      isAutoMode,
      apply,
      syncFromServer,
      setSkin,
      setMode,
      toggleMode,
      setDayNightSetting,
    };
  },
  {
    persist: {
      pick: ["mode", "skin", "style"],
    },
  },
);
