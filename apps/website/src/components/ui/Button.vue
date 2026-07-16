<script setup lang="ts">
import { computed } from "vue";
import { Primitive } from "reka-ui";

type ButtonVariant = "primary" | "ghost" | "danger" | "text";
type ButtonSize = "md" | "sm";

const props = withDefaults(
  defineProps<{
    variant?: ButtonVariant;
    size?: ButtonSize;
    type?: "button" | "submit" | "reset";
    disabled?: boolean;
    loading?: boolean;
    block?: boolean;
    asChild?: boolean;
  }>(),
  {
    variant: "primary",
    size: "md",
    type: "button",
    disabled: false,
    loading: false,
    block: false,
    asChild: false,
  },
);

const baseClass =
  "inline-flex items-center justify-center gap-1 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

const variantClass: Record<ButtonVariant, string> = {
  primary: "bg-cc98-primary text-cc98-on-primary hover:bg-cc98-primary-hover",
  ghost: "border border-cc98-border bg-cc98-surface text-cc98-text hover:bg-cc98-surface-subtle",
  danger: "bg-cc98-error text-cc98-on-primary hover:opacity-90",
  text: "text-cc98-link hover:text-cc98-primary-hover",
};

const sizeClass: Record<ButtonSize, string> = {
  md: "px-4 py-2",
  sm: "px-3 py-1.5 text-sm",
};

const classes = computed(() => [
  baseClass,
  variantClass[props.variant],
  sizeClass[props.size],
  props.block ? "w-full" : "",
]);

const isDisabled = computed(() => props.disabled || props.loading);
</script>

<template>
  <Primitive v-if="asChild" as-child :class="classes">
    <slot />
  </Primitive>
  <button v-else :type="type" :class="classes" :disabled="isDisabled">
    <slot />
  </button>
</template>
