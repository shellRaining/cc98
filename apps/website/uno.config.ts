import {
  defineConfig,
  presetAttributify,
  presetIcons,
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
    presetIcons(),
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
      "cc98-secondary": "var(--cc98-color-secondary)",
      "cc98-accent": "var(--cc98-color-accent)",
      "cc98-on-primary": "var(--cc98-color-on-primary)",
      "cc98-background": "var(--cc98-color-background)",
      "cc98-surface": "var(--cc98-color-surface)",
      "cc98-surface-subtle": "var(--cc98-color-surface-subtle)",
      "cc98-border": "var(--cc98-color-border)",
      "cc98-overlay": "var(--cc98-color-overlay)",
      "cc98-text": "var(--cc98-color-text)",
      "cc98-text-muted": "var(--cc98-color-text-muted)",
      "cc98-text-caption": "var(--cc98-color-text-caption)",
      "cc98-link": "var(--cc98-color-link)",
      "cc98-link-visited": "var(--cc98-color-link-visited)",
      "cc98-success": "var(--cc98-color-success)",
      "cc98-warning": "var(--cc98-color-warning)",
      "cc98-error": "var(--cc98-color-error)",
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
      "inline-flex items-center justify-center gap-1 rounded bg-cc98-primary px-4 py-2 text-cc98-on-primary transition-colors hover:bg-cc98-primary-hover disabled:opacity-50",
    "cc98-input":
      "rounded border border-cc98-border bg-cc98-surface-subtle px-3 py-2 text-cc98-text outline-none transition-colors focus:border-cc98-primary",
    "cc98-overlay": "fixed inset-0 z-40 bg-cc98-overlay",
    "cc98-modal":
      "fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 rounded border border-cc98-border bg-cc98-surface p-5 shadow-xl",
  },
});
