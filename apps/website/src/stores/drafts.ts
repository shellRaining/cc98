export type DraftKind = "create-topic" | "reply" | "edit";

const DRAFT_PREFIX = "cc98:draft";

export function createDraftKey(kind: DraftKind, targetId: number): string {
  return `${DRAFT_PREFIX}:${kind}:${targetId}`;
}

export function readDraft<T extends object>(
  key: string,
  defaults: T,
  storage: Storage = localStorage,
): T {
  try {
    const parsed: unknown = JSON.parse(storage.getItem(key) ?? "null");
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed))
      return { ...defaults };
    return { ...defaults, ...parsed };
  } catch {
    return { ...defaults };
  }
}

export function writeDraft(key: string, value: object, storage: Storage = localStorage): void {
  storage.setItem(key, JSON.stringify(value));
}

export function clearDraft(key: string, storage: Storage = localStorage): void {
  storage.removeItem(key);
}
