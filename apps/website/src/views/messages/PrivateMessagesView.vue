<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import { POST_CONTENT_TYPE, type PrivateMessage } from "@cc98/api";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/vue-query";
import { useTitle } from "@vueuse/core";
import dayjs from "dayjs";
import { useRoute, useRouter } from "vue-router";
import { useSendPrivateMessageMutation, useUploadFilesMutation } from "../../api/mutations";
import {
  privateContactsInfiniteQuery,
  privateConversationInfiniteQuery,
  queryKeys,
  userByIdQuery,
  usersByIdsQuery,
} from "../../api/queries";
import PageState from "../../components/PageState.vue";
import ContentRenderer from "../../components/rich-content/ContentRenderer.vue";
import { normalizeApiError } from "../../lib/api-error";
import { createConversationReadSynchronizer, mergeConversationPages } from "../../lib/messages";
import { parsePositiveInt } from "../../lib/route-params";
import { postExcerpt } from "../../lib/user-center";
import { useUserStore } from "../../stores/user";

const CONTACT_SIZE = 7;
const MESSAGE_SIZE = 10;
const DEFAULT_AVATAR = "/static/images/default_avatar_boy.png";

const route = useRoute();
const router = useRouter();
const queryClient = useQueryClient();
const user = useUserStore();
const content = ref("");
const messageList = ref<HTMLElement | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);
const shouldScrollToBottom = ref(true);
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
const upload = useUploadFilesMutation();

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
    preview: postExcerpt(contact.lastContent, POST_CONTENT_TYPE.ubb, 36),
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
const visibleContacts = computed(() => {
  if (
    targetUserId.value <= 0 ||
    !targetProfile.value ||
    contacts.value.some((contact) => contact.userId === targetUserId.value)
  ) {
    return contacts.value;
  }
  return [
    {
      userId: targetUserId.value,
      senderId: user.user?.id ?? 0,
      lastContent: "",
      preview: "还没有私信",
      isRead: true,
      time: "",
      user: targetProfile.value,
    },
    ...contacts.value,
  ];
});
const conversationTitle = computed(() =>
  targetUserId.value > 0
    ? `与 ${targetProfile.value?.name ?? `用户 ${targetUserId.value}`} 的私信`
    : "无当前聊天对象",
);
useTitle(computed(() => `${conversationTitle.value} - CC98 论坛`));

watch(
  [() => contactsQuery.isPending.value, contacts, targetUserId],
  ([isPending, contactList, selectedUserId]) => {
    if (!isPending && selectedUserId <= 0 && contactList[0]) {
      void router.replace(`/messages/private/${contactList[0].userId}`);
    }
  },
  { immediate: true },
);

watch(
  () => messages.value.length,
  async () => {
    if (!shouldScrollToBottom.value) return;
    await nextTick();
    scrollToBottom();
    shouldScrollToBottom.value = false;
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
    shouldScrollToBottom.value = true;
    readSynchronizer.cancel();
    if (userId <= 0) return;
    // 会话 GET 会在后端标记已读，缓存命中不能代替本次网络请求完成。
    void readSynchronizer.synchronize(userId);
  },
  { immediate: true, flush: "post" },
);

function avatarOf(
  profile: { portraitUrl?: string | null; photourl?: string | null } | null | undefined,
) {
  return profile?.portraitUrl || profile?.photourl || DEFAULT_AVATAR;
}

function onAvatarError(event: Event) {
  const image = event.currentTarget as HTMLImageElement;
  image.src = DEFAULT_AVATAR;
  image.onerror = null;
}

function openConversation(userId: number) {
  void router.push(`/messages/private/${userId}`);
}

function retryConversation() {
  void Promise.all([profileQuery.refetch(), conversationQuery.refetch()]);
}

function scrollToBottom() {
  if (messageList.value) messageList.value.scrollTop = messageList.value.scrollHeight;
}

async function loadOlderMessages() {
  if (!messageList.value || !conversationQuery.hasNextPage.value) return;
  const list = messageList.value;
  const oldHeight = list.scrollHeight;
  shouldScrollToBottom.value = false;
  await conversationQuery.fetchNextPage();
  await nextTick();
  list.scrollTop += list.scrollHeight - oldHeight;
}

function isOwnMessage(message: PrivateMessage) {
  return message.senderId === user.user?.id;
}

function messageAvatar(message: PrivateMessage) {
  return isOwnMessage(message)
    ? user.user?.avatarUrl || DEFAULT_AVATAR
    : avatarOf(targetProfile.value);
}

function messageUserId(message: PrivateMessage) {
  return isOwnMessage(message) ? user.user?.id : targetUserId.value;
}

function shouldShowTime(index: number) {
  if (index === 0) return true;
  const currentTime = Date.parse(messages.value[index]?.time ?? "");
  const previousTime = Date.parse(messages.value[index - 1]?.time ?? "");
  if (!Number.isFinite(currentTime) || !Number.isFinite(previousTime)) return true;
  return currentTime - previousTime >= 60 * 1000;
}

function submit() {
  const value = content.value.trim();
  if (!value || targetUserId.value <= 0 || sendMessage.isPending.value) return;
  shouldScrollToBottom.value = true;
  sendMessage.mutate(
    { receiverId: targetUserId.value, content: value, authScope: authScope.value },
    {
      onSuccess: async () => {
        content.value = "";
        await nextTick();
        scrollToBottom();
        shouldScrollToBottom.value = false;
      },
    },
  );
}

function triggerUpload() {
  fileInput.value?.click();
}

async function uploadImages(files: File[]) {
  const images = files.filter((file) => file.type.startsWith("image/"));
  if (images.length === 0 || upload.isPending.value) return;
  try {
    const urls = await upload.mutateAsync({ files: images });
    const separator = content.value && !content.value.endsWith("\n") ? "\n" : "";
    content.value += `${separator}${urls.map((url) => `[img]${url}[/img]`).join("\n")}`;
  } catch {
    // mutation 状态负责展示错误，事件处理器不再向控制台抛未处理拒绝。
  }
}

async function handleFileChange(event: Event) {
  const input = event.currentTarget as HTMLInputElement;
  await uploadImages(Array.from(input.files ?? []));
  input.value = "";
}

async function handlePaste(event: ClipboardEvent) {
  const images = Array.from(event.clipboardData?.files ?? []).filter((file) =>
    file.type.startsWith("image/"),
  );
  if (images.length === 0) return;
  event.preventDefault();
  await uploadImages(images);
}

async function handleDrop(event: DragEvent) {
  await uploadImages(Array.from(event.dataTransfer?.files ?? []));
}
</script>

<template>
  <section class="message-private">
    <aside class="message-private__contacts">
      <div class="message-private__contacts-title">近期私信</div>
      <PageState v-if="contactsQuery.isPending.value" kind="loading" title="加载联系人" />
      <PageState
        v-else-if="contactsQuery.error.value"
        kind="error"
        :message="normalizeApiError(contactsQuery.error.value).message"
        @retry="contactsQuery.refetch()"
      />
      <div v-else class="message-private__contact-list">
        <button
          v-for="contact in visibleContacts"
          :key="contact.userId"
          type="button"
          :class="{ 'is-active': contact.userId === targetUserId }"
          :aria-pressed="contact.userId === targetUserId"
          @click="openConversation(contact.userId)"
        >
          <img
            :src="avatarOf(contact.user)"
            :alt="contact.user?.name ?? `用户 ${contact.userId}`"
            @error="onAvatarError"
          />
          <span class="message-private__contact-info">
            <span class="message-private__contact-name">
              {{ contact.user?.name ?? `用户 ${contact.userId}` }}
            </span>
            <span class="message-private__contact-preview">{{ contact.preview }}</span>
          </span>
          <span v-if="!contact.isRead" class="message-private__unread" aria-label="未读私信" />
        </button>

        <button
          v-if="contacts.length > 0 && contactsQuery.hasNextPage.value"
          type="button"
          class="message-private__more-contacts"
          :disabled="contactsQuery.isFetchingNextPage.value"
          @click="contactsQuery.fetchNextPage()"
        >
          <span>...</span>
          {{ contactsQuery.isFetchingNextPage.value ? "正在加载小伙伴..." : "显示更多小伙伴~" }}
        </button>
        <p v-else-if="contacts.length > CONTACT_SIZE" class="message-private__contacts-end">
          小伙伴们都出来了~
        </p>
      </div>
    </aside>

    <section class="message-private__window">
      <header>{{ conversationTitle }}</header>

      <div ref="messageList" class="message-private__conversation">
        <PageState
          v-if="targetUserId <= 0"
          kind="empty"
          title="无当前聊天对象"
          message="可以从用户主页发起私信。"
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
          @retry="retryConversation"
        />
        <template v-else>
          <button
            v-if="conversationQuery.hasNextPage.value"
            type="button"
            class="message-private__older"
            :disabled="conversationQuery.isFetchingNextPage.value"
            @click="loadOlderMessages"
          >
            {{ conversationQuery.isFetchingNextPage.value ? "正在加载..." : "点击加载更多..." }}
          </button>
          <p v-else class="message-private__history-end">没有更多消息了~</p>
          <p v-if="messages.length === 0" class="message-private__empty">还没有私信</p>

          <article
            v-for="(message, index) in messages"
            :key="message.id ?? `${message.senderId}-${message.receiverId}-${message.time}`"
            class="message-private__message"
          >
            <time v-if="shouldShowTime(index)">
              {{ dayjs(message.time).format("YYYY-MM-DD HH:mm:ss") }}
            </time>
            <div :class="isOwnMessage(message) ? 'is-sender' : 'is-receiver'">
              <RouterLink :to="`/user/id/${messageUserId(message)}`">
                <img
                  :src="messageAvatar(message)"
                  :alt="isOwnMessage(message) ? user.user?.name : targetProfile?.name"
                  @error="onAvatarError"
                />
              </RouterLink>
              <div class="message-private__bubble">
                <ContentRenderer
                  :content="message.content ?? ''"
                  type="ubb"
                  :options="{ allowMediaContent: false, allowToolbox: false, maxImageCount: 5 }"
                />
              </div>
            </div>
          </article>
        </template>
      </div>

      <form class="message-private__composer" @submit.prevent="submit">
        <textarea
          v-model="content"
          aria-label="私信内容"
          placeholder="请在这里填入您要发送的私信内容"
          :disabled="targetUserId <= 0 || sendMessage.isPending.value"
          @paste="handlePaste"
          @drop.prevent="handleDrop"
          @dragover.prevent
        />
        <input
          ref="fileInput"
          type="file"
          accept="image/*"
          multiple
          hidden
          @change="handleFileChange"
        />
        <p v-if="sendMessage.error.value" class="message-private__error">
          {{ normalizeApiError(sendMessage.error.value).message }}
        </p>
        <p v-else-if="upload.error.value" class="message-private__error">
          图片上传失败，请稍后重试
        </p>
        <div class="message-private__composer-actions">
          <button
            type="button"
            :disabled="targetUserId <= 0 || upload.isPending.value"
            @click="triggerUpload"
          >
            {{ upload.isPending.value ? "上传中" : "上传图片" }}
          </button>
          <button
            type="submit"
            :disabled="targetUserId <= 0 || !content.trim() || sendMessage.isPending.value"
          >
            {{ sendMessage.isPending.value ? "发送中" : "发送" }}
          </button>
        </div>
      </form>
    </section>
  </section>
</template>

<style scoped>
.message-private {
  display: flex;
  height: 42.125rem;
  background: var(--cc98-color-surface);
}

.message-private__contacts {
  display: flex;
  width: 12.375rem;
  flex: 0 0 12.375rem;
  flex-direction: column;
  border: 1px solid var(--cc98-color-border);
  font-size: 0.875rem;
}

.message-private__contacts-title {
  display: flex;
  height: 2.5rem;
  flex: 0 0 2.5rem;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid var(--cc98-color-border);
  background: var(--cc98-color-background);
  color: var(--cc98-color-text-muted);
}

.message-private__contact-list {
  min-height: 0;
  flex: 1 1 auto;
  overflow-x: hidden;
  overflow-y: auto;
}

.message-private__contact-list > button:not(.message-private__more-contacts) {
  position: relative;
  display: flex;
  width: 100%;
  min-height: 5rem;
  align-items: center;
  padding: 0;
  border: 0;
  border-bottom: 1px dashed var(--cc98-color-border);
  background: transparent;
  color: var(--cc98-color-text);
  cursor: pointer;
  text-align: left;
}

.message-private__contact-list > button:hover,
.message-private__contact-list > button.is-active {
  background: var(--cc98-color-surface-subtle);
}

.message-private__contact-list > button > img {
  width: 2.5rem;
  height: 2.5rem;
  flex: 0 0 2.5rem;
  margin: 1.25rem 0.625rem;
  border-radius: 50%;
  object-fit: cover;
}

.message-private__contact-info {
  display: flex;
  width: 6.875rem;
  min-width: 0;
  flex-direction: column;
}

.message-private__contact-name {
  overflow: hidden;
  padding-bottom: 0.625rem;
  color: var(--cc98-color-text);
  font-size: 0.875rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.message-private__contact-preview {
  overflow: hidden;
  color: var(--cc98-color-text-caption);
  font-size: 0.625rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.message-private__unread {
  position: absolute;
  top: 2.25rem;
  right: 0.9375rem;
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background: #fb6165;
}

.message-private__more-contacts {
  display: flex;
  width: 100%;
  min-height: 4.25rem;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 0;
  background: transparent;
  color: var(--cc98-color-text-muted);
  cursor: pointer;
  font: inherit;
  font-size: 0.75rem;
}

.message-private__more-contacts span {
  margin-bottom: 0.375rem;
  font-size: 1rem;
}

.message-private__more-contacts:disabled {
  cursor: wait;
}

.message-private__contacts-end {
  margin: 0;
  padding: 1rem 0;
  color: var(--cc98-color-text-muted);
  font-size: 0.75rem;
  text-align: center;
}

.message-private__window {
  display: flex;
  min-width: 0;
  flex: 1 1 auto;
  flex-direction: column;
}

.message-private__window > header {
  display: flex;
  height: 2.5rem;
  flex: 0 0 2.5rem;
  align-items: center;
  justify-content: center;
  border-top: 1px solid var(--cc98-color-border);
  border-right: 1px solid var(--cc98-color-border);
  color: var(--cc98-color-text);
  font-size: 0.875rem;
}

.message-private__conversation {
  min-height: 0;
  flex: 1 1 auto;
  border-top: 1px solid var(--cc98-color-border);
  border-right: 1px solid var(--cc98-color-border);
  overflow-x: hidden;
  overflow-y: auto;
}

.message-private__older {
  display: block;
  height: 2.5rem;
  margin: 0 auto;
  border: 0;
  background: transparent;
  color: var(--cc98-color-text-muted);
  cursor: pointer;
  font: inherit;
  font-size: 0.625rem;
}

.message-private__older:disabled {
  cursor: wait;
}

.message-private__history-end,
.message-private__empty {
  margin: 0;
  padding: 0.625rem 0 1.3125rem;
  color: var(--cc98-color-text-muted);
  font-size: 0.625rem;
  text-align: center;
}

.message-private__empty {
  padding-top: 8rem;
  font-size: 0.875rem;
}

.message-private__message {
  display: flex;
  flex-direction: column;
  margin: 0.625rem 0;
}

.message-private__message > time {
  padding: 0.3125rem 0 0.5rem;
  color: var(--cc98-color-text-muted);
  font-size: 0.625rem;
  text-align: center;
}

.message-private__message > div {
  position: relative;
  display: flex;
}

.message-private__message > div.is-sender {
  flex-direction: row-reverse;
}

.message-private__message > div > a {
  flex: 0 0 auto;
}

.message-private__message > div > a > img {
  width: 3.125rem;
  height: 3.125rem;
  margin: 0.3125rem 1.25rem;
  border-radius: 50%;
  object-fit: cover;
}

.message-private__bubble {
  position: relative;
  width: auto;
  max-width: 31.25rem;
  height: fit-content;
  margin: 0.5rem 0 0.625rem;
  border: 1px solid var(--cc98-color-border);
  border-radius: 3px;
  background: var(--cc98-color-background);
  color: var(--cc98-color-text-muted);
  font-size: 0.875rem;
  line-height: 1.375rem;
  overflow-wrap: anywhere;
}

.message-private__bubble::before,
.message-private__bubble::after {
  position: absolute;
  top: 0.5625rem;
  width: 0;
  height: 0;
  border-style: solid;
  content: "";
}

.is-receiver .message-private__bubble::before {
  left: -1rem;
  border-width: 0.5rem;
  border-color: transparent var(--cc98-color-border) transparent transparent;
}

.is-receiver .message-private__bubble::after {
  top: 0.6875rem;
  left: -0.75rem;
  border-width: 0.375rem;
  border-color: transparent var(--cc98-color-background) transparent transparent;
}

.is-sender .message-private__bubble::before {
  right: -1rem;
  border-width: 0.5rem;
  border-color: transparent transparent transparent var(--cc98-color-border);
}

.is-sender .message-private__bubble::after {
  top: 0.6875rem;
  right: -0.75rem;
  border-width: 0.375rem;
  border-color: transparent transparent transparent var(--cc98-color-background);
}

.message-private__bubble > * {
  margin: 0.625rem !important;
}

.message-private__composer {
  position: relative;
  display: flex;
  height: 10rem;
  flex: 0 0 10rem;
  flex-direction: column;
  border-top: 1px solid var(--cc98-color-border);
  border-right: 1px solid var(--cc98-color-border);
  border-bottom: 1px solid var(--cc98-color-border);
  background: var(--cc98-color-surface-subtle);
}

.message-private__composer textarea {
  width: calc(100% - 3.625rem);
  height: 4.875rem;
  flex: 0 0 4.875rem;
  margin: 1.1875rem 1.8125rem 0.625rem;
  padding: 0.5rem;
  border: 1px solid var(--cc98-color-border);
  background: var(--cc98-color-surface);
  color: var(--cc98-color-text);
  font: inherit;
  font-size: 0.75rem;
  line-height: 1.375rem;
  resize: none;
}

.message-private__composer textarea:focus {
  border-color: var(--cc98-color-primary);
  outline: 0;
}

.message-private__composer textarea:disabled {
  cursor: not-allowed;
  opacity: 0.65;
}

.message-private__composer-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.625rem;
  margin-right: 1.8125rem;
}

.message-private__composer-actions button {
  width: 6.25rem;
  height: 1.875rem;
  border: 0;
  border-radius: 3px;
  background: var(--cc98-color-primary);
  color: #fff;
  cursor: pointer;
  font: inherit;
  font-size: 0.75rem;
}

.message-private__composer-actions button:hover {
  filter: brightness(1.08);
}

.message-private__composer-actions button:disabled {
  cursor: default;
  opacity: 0.55;
}

.message-private__error {
  position: absolute;
  bottom: 0.45rem;
  left: 1.8125rem;
  max-width: calc(100% - 17rem);
  margin: 0;
  color: var(--cc98-color-accent);
  font-size: 0.75rem;
}
</style>
