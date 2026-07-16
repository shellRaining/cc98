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
