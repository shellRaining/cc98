import {
  defineConfig,
  presetAttributify,
  presetTypography,
  presetUno,
  presetWebFonts,
  transformerDirectives,
  transformerVariantGroup,
} from "unocss";

export default defineConfig({
  presets: [
    presetUno(),
    presetAttributify(),
    presetTypography(),
    presetWebFonts({
      provider: "none",
    }),
  ],
  transformers: [transformerDirectives(), transformerVariantGroup()],
  theme: {
    colors: {
      cc98: {
        primary: "var(--cc98-color-primary)",
        accent: "var(--cc98-color-accent)",
        text: "var(--cc98-color-text)",
        "text-muted": "var(--cc98-color-text-muted)",
        bg: "var(--cc98-color-bg)",
        "bg-elevated": "var(--cc98-color-bg-elevated)",
        border: "var(--cc98-color-border)",
      },
    },
  },
  shortcuts: {
    "cc98-link": "text-cc98-primary hover:text-cc98-accent transition-colors",
    "cc98-card": "bg-cc98-bg-elevated border border-cc98-border rounded-lg",
    "cc98-btn":
      "inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-cc98-primary text-white hover:opacity-90 transition-opacity",
  },
});
