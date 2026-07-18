<script setup lang="ts">
import { useQuery } from "@tanstack/vue-query";
import { computed, reactive, ref, watch } from "vue";
import { useTransferWealthMutation } from "../../api/mutations";
import { currentUserQuery } from "../../api/queries";
import PageState from "../../components/PageState.vue";
import { normalizeApiError } from "../../lib/api-error";

const meQuery = useQuery(currentUserQuery);
const transfer = useTransferWealthMutation();
const form = reactive({ recipients: "", amount: "", reason: "" });
const notice = ref("");

const recipientNames = computed(() =>
  [...new Set(form.recipients.trim().split(/\s+/).filter(Boolean))].slice(0, 11),
);
const amount = computed(() => Number(form.amount));
const amountValid = computed(
  () => /^\d+(?:\.\d+)?$/.test(form.amount.trim()) && Number.isFinite(amount.value),
);
const fee = computed(() => (amountValid.value ? Math.max(Math.floor(amount.value * 0.1), 10) : 0));
const receivedAmount = computed(() => Math.max(0, amount.value - fee.value));
const totalCost = computed(() => amount.value * recipientNames.value.length);
const preview = computed(() => {
  if (recipientNames.value.length === 0 || !amountValid.value || amount.value < 10) return "";
  if (recipientNames.value.length > 10) return "一次最多只能向 10 个用户转账";
  const receiverText =
    recipientNames.value.length === 1
      ? `${recipientNames.value[0]} 将收到`
      : `${recipientNames.value.join("、")} 将各收到`;
  return `你共有 ${meQuery.data.value?.wealth ?? 0} 个财富值，本次共扣除 ${totalCost.value} 个财富值，${receiverText} ${receivedAmount.value} 个财富值。`;
});

watch(
  () => [form.recipients, form.amount, form.reason],
  () => {
    if (!transfer.isPending.value) notice.value = "";
  },
);

function validate(): string | null {
  if (recipientNames.value.length === 0) return "请输入收款人信息";
  if (recipientNames.value.length > 10) return "一次最多只能向 10 个用户转账";
  if (!amountValid.value || amount.value < 10) return "请输入不小于 10 的合法金额";
  if (!form.reason.trim()) return "请输入理由";
  if ((meQuery.data.value?.wealth ?? 0) < totalCost.value) return "财富值不足";
  return null;
}

async function submit() {
  const validationMessage = validate();
  if (validationMessage) {
    notice.value = validationMessage;
    return;
  }
  notice.value = "转账中";
  try {
    const successNames = await transfer.mutateAsync({
      userNames: recipientNames.value,
      wealth: amount.value,
      reason: form.reason.trim(),
    });
    const deducted = successNames.length * amount.value;
    notice.value = successNames.length
      ? `成功给 ${successNames.join("、")} 转账，总计扣除 ${deducted} 个财富值`
      : "没有用户完成转账";
  } catch (error) {
    notice.value = normalizeApiError(error).message;
  }
}
</script>

<template>
  <PageState v-if="meQuery.isPending.value" kind="loading" />
  <PageState
    v-else-if="meQuery.error.value"
    kind="error"
    :message="normalizeApiError(meQuery.error.value).message"
    show-retry
    @retry="meQuery.refetch()"
  />
  <section v-else class="user-transfer-wealth">
    <h2>转账</h2>
    <form novalidate @submit.prevent="submit">
      <label class="user-transfer-wealth__field">
        <span>收款人</span>
        <input
          v-model="form.recipients"
          class="is-wide"
          type="text"
          autocomplete="off"
          placeholder="多个用户名请用空格隔开"
        />
      </label>
      <label class="user-transfer-wealth__field">
        <span>金额</span>
        <input v-model="form.amount" type="text" inputmode="decimal" autocomplete="off" />
      </label>
      <label class="user-transfer-wealth__field">
        <span>理由</span>
        <input v-model="form.reason" class="is-wide" type="text" maxlength="100" />
      </label>
      <div class="user-transfer-wealth__field user-transfer-wealth__rules">
        <span>说明</span>
        <ul>
          <li>转账手续费为金额的 10% 与 10 中的较大值。</li>
          <li>手续费从转账金额中收取，对方实际收到的金额会少于输入金额。</li>
          <li>转账金额不能小于 <strong>10</strong>。</li>
          <li>
            多个收款人请用空格隔开，每人都会单独收取手续费，一次最多向
            <strong>10</strong> 个用户转账。
          </li>
        </ul>
      </div>
      <p v-if="preview" class="user-transfer-wealth__preview">{{ preview }}</p>
      <button type="submit" :disabled="transfer.isPending.value">
        {{ transfer.isPending.value ? "转账中" : "转账" }}
      </button>
    </form>
    <p v-if="notice" class="user-transfer-wealth__notice" role="status">{{ notice }}</p>
  </section>
</template>

<style scoped>
.user-transfer-wealth h2,
.user-transfer-wealth p {
  margin: 0;
}

.user-transfer-wealth h2 {
  font-size: 1rem;
  font-weight: 400;
}

.user-transfer-wealth form {
  display: flex;
  flex-direction: column;
  margin-top: 2rem;
}

.user-transfer-wealth__field {
  display: flex;
  align-items: center;
  margin: 1rem 0;
}

.user-transfer-wealth__field > span {
  width: 5rem;
  flex: 0 0 5rem;
  margin: 0 1rem;
}

.user-transfer-wealth__field input {
  width: 12rem;
  height: 2rem;
  border: 1px solid var(--cc98-color-border);
  background: var(--cc98-color-surface);
  color: var(--cc98-color-text);
  font: inherit;
  padding: 0.5rem;
}

.user-transfer-wealth__field input.is-wide {
  width: 30rem;
}

.user-transfer-wealth__rules {
  align-items: flex-start;
}

.user-transfer-wealth__rules ul {
  max-width: 42rem;
  margin: 0 0 0 2.5rem;
  padding-left: 1.25rem;
  line-height: 1.8;
}

.user-transfer-wealth__preview {
  margin: 1rem 6rem 0 !important;
  color: var(--cc98-color-text-muted);
}

.user-transfer-wealth form > button {
  width: 5rem;
  height: 2rem;
  align-self: center;
  margin-top: 2rem;
  border: 0;
  border-radius: 3px;
  background: var(--cc98-color-surface-subtle);
  color: var(--cc98-color-text);
  font: inherit;
  cursor: pointer;
}

.user-transfer-wealth form > button:hover {
  background: var(--cc98-color-primary);
  color: #fff;
}

.user-transfer-wealth form > button:disabled {
  cursor: wait;
  opacity: 0.6;
}

.user-transfer-wealth__notice {
  margin: 1rem !important;
  color: var(--cc98-color-accent);
}
</style>
