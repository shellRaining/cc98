<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/vue-query";
import dayjs from "dayjs";
import { useRoute, useRouter } from "vue-router";
import { useSendPrivateMessageMutation } from "../../api/mutations";
import {
  privateContactsInfiniteQuery,
  privateConversationInfiniteQuery,
  userByIdQuery,
  usersByIdsQuery,
} from "../../api/queries";
import LoadMore from "../../components/LoadMore.vue";
import PageState from "../../components/PageState.vue";
import UiButton from "../../components/ui/Button.vue";
import ContentRenderer from "../../components/rich-content/ContentRenderer.vue";
import { normalizeApiError } from "../../lib/api-error";
import { createConversationReadSynchronizer, mergeConversationPages } from "../../lib/messages";
import { parsePositiveInt } from "../../lib/route-params";
import { useUserStore } from "../../stores/user";
import { queryKeys } from "../../api/queries";

const CONTACT_SIZE = 20;
const MESSAGE_SIZE = 20;
const route = useRoute();
const router = useRouter();
const queryClient = useQueryClient();
const user = useUserStore();
const content = ref("");
const messageList = ref<HTMLElement | null>(null);
const authScope = computed(() => user.user?.id ?? "anonymous");
const targetUserId = computed(() => parsePositiveInt(String(route.params.userId ?? "")) ?? 0);

const contactsQuery = useInfiniteQuery(
  computed(() => privateContactsInfiniteQuery(authScope.value, CONTACT_SIZE, user.isLoggedIn)),
);
const profileQuery = useQuery(
  computed(() =>
    userByIdQuery(targetUserId.value, authScope.value, targetUserId.value > 0 && user.isLoggedIn),
  ),
);
const conversationQuery = useInfiniteQuery(
  computed(() =>
    privateConversationInfiniteQuery(
      targetUserId.value,
      authScope.value,
      MESSAGE_SIZE,
      targetUserId.value > 0 && user.isLoggedIn,
    ),
  ),
);
const sendMessage = useSendPrivateMessageMutation();

const rawContacts = computed(() => contactsQuery.data.value?.pages.flat() ?? []);
const contactUserIds = computed(() => rawContacts.value.map((contact) => contact.userId));
const contactUsersQuery = useQuery(
  computed(() => usersByIdsQuery(contactUserIds.value, contactUserIds.value.length > 0)),
);
const contactUserMap = computed(
  () => new Map((contactUsersQuery.data.value ?? []).map((contact) => [contact.id, contact])),
);
const contacts = computed(() =>
  rawContacts.value.map((contact) => ({
    ...contact,
    user: contactUserMap.value.get(contact.userId) ?? null,
  })),
);
const messages = computed(() => mergeConversationPages(conversationQuery.data.value?.pages));
const targetProfile = computed(
  () =>
    profileQuery.data.value ??
    contacts.value.find((contact) => contact.userId === targetUserId.value)?.user ??
    null,
);

watch(
  () => messages.value.length,
  async () => {
    await nextTick();
    if (messageList.value) messageList.value.scrollTop = messageList.value.scrollHeight;
  },
);

const readSynchronizer = createConversationReadSynchronizer({
  refetchConversation: () => conversationQuery.refetch({ cancelRefetch: false }),
  refreshReadState: () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.unreadCountsRoot }),
      queryClient.invalidateQueries({ queryKey: queryKeys.privateContactsRoot }),
    ]),
  getCurrentUserId: () => targetUserId.value,
});

watch(
  targetUserId,
  (userId) => {
    content.value = "";
    readSynchronizer.cancel();
    if (userId <= 0) return;
    // 会话 GET 会在后端标记已读，缓存命中不能代替本次网络请求完成。
    void readSynchronizer.synchronize(userId);
  },
  { immediate: true, flush: "post" },
);

function openConversation(userId: number) {
  void router.push(`/messages/private/${userId}`);
}

function submit() {
  const value = content.value.trim();
  if (!value || targetUserId.value <= 0 || sendMessage.isPending.value) return;
  sendMessage.mutate(
    { receiverId: targetUserId.value, content: value, authScope: authScope.value },
    {
      onSuccess: () => {
        content.value = "";
      },
    },
  );
}
</script>

<template>
  <section class="space-y-4">
    <header>
      <h1 class="text-2xl font-bold">私信</h1>
      <p class="text-sm text-cc98-text-muted">私信沿用论坛历史内容协议。</p>
    </header>

    <div class="grid min-h-[32rem] gap-4 lg:grid-cols-[16rem_minmax(0,1fr)]">
      <aside class="cc98-card overflow-hidden">
        <div class="border-b border-cc98-border px-4 py-3 font-medium">近期联系人</div>
        <PageState v-if="contactsQuery.isPending.value" kind="loading" title="加载联系人" />
        <PageState
          v-else-if="contactsQuery.error.value"
          kind="error"
          :message="normalizeApiError(contactsQuery.error.value).message"
          @retry="contactsQuery.refetch()"
        />
        <div v-else class="divide-y divide-cc98-border">
          <button
            v-for="contact in contacts"
            :key="contact.userId"
            type="button"
            class="w-full border-0 bg-transparent p-3 text-left hover:bg-cc98-surface-subtle"
            :class="contact.userId === targetUserId ? 'bg-cc98-surface-subtle' : ''"
            @click="openConversation(contact.userId)"
          >
            <div class="flex items-center gap-3">
              <img
                v-if="contact.user?.portraitUrl"
                :src="contact.user.portraitUrl"
                :alt="contact.user.name"
                class="h-9 w-9 rounded object-cover"
              />
              <div class="min-w-0 flex-1">
                <div class="flex items-center justify-between gap-2">
                  <span class="truncate text-sm font-medium">{{
                    contact.user?.name ?? `用户 ${contact.userId}`
                  }}</span>
                  <span v-if="!contact.isRead" class="h-2 w-2 rounded-full bg-cc98-primary" />
                </div>
                <p class="truncate text-xs text-cc98-text-muted">{{ contact.lastContent }}</p>
              </div>
            </div>
          </button>
        </div>
        <LoadMore
          v-if="contacts.length > 0"
          :has-more="Boolean(contactsQuery.hasNextPage.value)"
          :loading="contactsQuery.isFetchingNextPage.value"
          @load-more="contactsQuery.fetchNextPage()"
        />
      </aside>

      <div class="cc98-card flex min-h-[32rem] min-w-0 flex-col overflow-hidden">
        <PageState
          v-if="targetUserId <= 0"
          kind="empty"
          title="选择联系人"
          message="从左侧选择联系人，或从用户主页发起私信。"
        />
        <PageState
          v-else-if="profileQuery.isPending.value || conversationQuery.isPending.value"
          kind="loading"
          title="加载会话"
        />
        <PageState
          v-else-if="profileQuery.error.value || conversationQuery.error.value"
          kind="error"
          :message="
            normalizeApiError(profileQuery.error.value ?? conversationQuery.error.value).message
          "
          @retry="conversationQuery.refetch()"
        />
        <template v-else>
          <header class="border-b border-cc98-border px-4 py-3 font-medium">
            与 {{ targetProfile?.name ?? `用户 ${targetUserId}` }} 的私信
          </header>
          <div ref="messageList" class="flex-1 space-y-4 overflow-y-auto p-4">
            <LoadMore
              :has-more="Boolean(conversationQuery.hasNextPage.value)"
              :loading="conversationQuery.isFetchingNextPage.value"
              exhausted-message="已经到最早的消息了"
              @load-more="conversationQuery.fetchNextPage()"
            />
            <p v-if="messages.length === 0" class="text-center text-sm text-cc98-text-muted">
              还没有私信，发送第一条消息吧。
            </p>
            <article
              v-for="message in messages"
              :key="message.id ?? `${message.senderId}-${message.time}`"
              class="flex"
              :class="message.senderId === user.user?.id ? 'justify-end' : 'justify-start'"
            >
              <div class="max-w-[80%] space-y-1">
                <time class="block text-xs text-cc98-text-muted">{{
                  dayjs(message.time).format("YYYY-MM-DD HH:mm")
                }}</time>
                <div
                  class="rounded px-3 py-2 text-sm"
                  :class="
                    message.senderId === user.user?.id
                      ? 'bg-cc98-primary text-cc98-on-primary'
                      : 'bg-cc98-surface-subtle'
                  "
                >
                  <ContentRenderer
                    :content="message.content ?? ''"
                    type="ubb"
                    :options="{ allowMediaContent: false, allowToolbox: false, maxImageCount: 5 }"
                  />
                </div>
              </div>
            </article>
          </div>
          <form class="border-t border-cc98-border p-4 space-y-2" @submit.prevent="submit">
            <textarea
              v-model="content"
              rows="3"
              class="w-full resize-y cc98-input text-sm"
              placeholder="输入私信内容"
              :disabled="sendMessage.isPending.value"
            />
            <div class="flex items-center justify-between gap-3">
              <p class="text-xs text-cc98-text-muted">发送失败时内容会保留。</p>
              <UiButton
                type="submit"
                size="sm"
                :disabled="!content.trim()"
                :loading="sendMessage.isPending.value"
              >
                {{ sendMessage.isPending.value ? "发送中…" : "发送" }}
              </UiButton>
            </div>
            <p v-if="sendMessage.error.value" class="text-sm text-cc98-accent">
              {{ normalizeApiError(sendMessage.error.value).message }}
            </p>
          </form>
        </template>
      </div>
    </div>
  </section>
</template>
