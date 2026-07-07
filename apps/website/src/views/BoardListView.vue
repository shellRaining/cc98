<script setup lang="ts">
import { computed } from "vue";
import { useQuery } from "@tanstack/vue-query";
import { boardsQuery } from "../api/queries";

const { data: boardGroups } = useQuery(boardsQuery);

const totalBoards = computed(() =>
  (boardGroups.value ?? []).reduce((acc, group) => acc + group.boards.length, 0),
);
</script>

<template>
  <section class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold">全部版面</h1>
      <p v-if="boardGroups" class="text-sm text-cc98-text-muted mt-1">
        共 {{ boardGroups.length }} 个分组 · {{ totalBoards }} 个版面
      </p>
    </div>

    <div v-if="boardGroups" class="space-y-6">
      <div v-for="group in boardGroups" :key="group.id" class="cc98-card p-4">
        <h2 class="text-lg font-semibold mb-3">{{ group.name }}</h2>
        <div class="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
          <RouterLink
            v-for="board in group.boards"
            :key="board.id"
            :to="`/list/${board.id}`"
            class="cc98-link truncate"
            :title="board.description ?? board.name"
          >
            {{ board.name }}
          </RouterLink>
        </div>
      </div>
    </div>
    <p v-else class="text-sm text-cc98-text-muted">加载中…</p>
  </section>
</template>
