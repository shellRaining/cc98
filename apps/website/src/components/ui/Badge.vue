<script setup lang="ts">
import { computed } from "vue";

type BadgeVariant = "accent" | "primary";

const props = withDefaults(
  defineProps<{
    /** 数字计数，超过 max 显示 max+ */
    count?: number;
    /** 最大显示值，超过显示为 max+ */
    max?: number;
    /** 纯圆点，不显示数字 */
    dot?: boolean;
    /** 颜色变体：accent（红色，未读/警示）、primary（蓝色，状态） */
    variant?: BadgeVariant;
  }>(),
  {
    count: 0,
    max: 99,
    dot: false,
    variant: "accent",
  },
);

const shouldShow = computed(() => props.dot || props.count > 0);
const display = computed(() => (props.count > props.max ? `${props.max}+` : String(props.count)));

const baseClass = "rounded-full text-center text-xs text-cc98-on-primary";
const variantClass: Record<BadgeVariant, string> = {
  accent: "bg-cc98-accent",
  primary: "bg-cc98-primary-fill",
};
const shapeClass = computed(() => (props.dot ? "h-2 w-2 block" : "min-w-5 px-1 leading-5"));
</script>

<template>
  <span v-if="shouldShow" :class="[baseClass, variantClass[variant], shapeClass]">
    <template v-if="!dot">{{ display }}</template>
  </span>
</template>
