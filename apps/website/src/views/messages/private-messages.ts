import type { PrivateMessage } from "@cc98/api";

interface ConversationReadSynchronizerDeps {
  refetchConversation: () => Promise<unknown>;
  refreshReadState: () => Promise<unknown>;
  getCurrentUserId: () => number;
}

export interface ConversationReadSynchronizer {
  cancel: () => void;
  synchronize: (userId: number) => Promise<boolean>;
}

export function createConversationReadSynchronizer(
  deps: ConversationReadSynchronizerDeps,
): ConversationReadSynchronizer {
  let generation = 0;
  return {
    cancel() {
      generation += 1;
    },
    async synchronize(userId) {
      const currentGeneration = ++generation;
      await deps.refetchConversation();
      if (currentGeneration !== generation || deps.getCurrentUserId() !== userId) return false;
      await deps.refreshReadState();
      return true;
    },
  };
}

export function mergeConversationPages(pages: PrivateMessage[][] | undefined): PrivateMessage[] {
  const messages = pages?.flat() ?? [];
  const seen = new Set<number | string>();
  return messages
    .filter((message) => {
      const key = message.id ?? `${message.senderId}-${message.receiverId}-${message.time}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => {
      const timeDiff = Date.parse(a.time ?? "") - Date.parse(b.time ?? "");
      if (Number.isFinite(timeDiff) && timeDiff !== 0) return timeDiff;
      return (a.id ?? 0) - (b.id ?? 0);
    });
}
