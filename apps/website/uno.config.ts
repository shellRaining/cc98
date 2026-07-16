import {
  defineConfig,
  presetAttributify,
  presetTypography,
  presetWebFonts,
  presetWind3,
  transformerDirectives,
  transformerVariantGroup,
} from "unocss";

export default defineConfig({
  presets: [
    presetWind3(),
    presetAttributify(),
    presetTypography(),
    presetWebFonts({
      provider: "none",
    }),
  ],
  transformers: [transformerDirectives(), transformerVariantGroup()],
  theme: {
    colors: {
      "cc98-brand": "var(--cc98-color-brand)",
      "cc98-primary": "var(--cc98-color-primary)",
      "cc98-primary-hover": "var(--cc98-color-primary-hover)",
      "cc98-accent": "var(--cc98-color-accent)",
      "cc98-on-primary": "var(--cc98-color-on-primary)",
      "cc98-background": "var(--cc98-color-background)",
      "cc98-surface": "var(--cc98-color-surface)",
      "cc98-surface-subtle": "var(--cc98-color-surface-subtle)",
      "cc98-border": "var(--cc98-color-border)",
      "cc98-text": "var(--cc98-color-text)",
      "cc98-text-muted": "var(--cc98-color-text-muted)",
      "cc98-text-caption": "var(--cc98-color-text-caption)",
      "cc98-link": "var(--cc98-color-link)",
      "cc98-link-visited": "var(--cc98-color-link-visited)",
      "cc98-success": "var(--cc98-color-success)",
      "cc98-warning": "var(--cc98-color-warning)",
      "cc98-error": "var(--cc98-color-error)",
      // 旧命名兼容，组件迁移到语义名后移除
      "cc98-bg": "var(--cc98-color-background)",
      "cc98-bg-elevated": "var(--cc98-color-surface)",
    },
    borderRadius: {
      none: "0px",
      DEFAULT: "4px",
      sm: "4px",
      md: "8px",
      lg: "12px",
      xl: "16px",
      full: "9999px",
    },
  },
  shortcuts: {
    "cc98-link": "text-cc98-link hover:text-cc98-primary-hover transition-colors",
    "cc98-card": "bg-cc98-surface border border-cc98-border rounded-lg",
    "cc98-btn":
      "inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-cc98-primary text-cc98-on-primary hover:bg-cc98-primary-hover transition-colors",
  },
});
